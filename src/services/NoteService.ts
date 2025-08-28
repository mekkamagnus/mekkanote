/**
 * Note Management Service
 * File system integration using Reader pattern and TaskEither
 */

import { TaskEither } from '../utils/task-either.ts'
import { Reader, ReaderTaskEither } from '../utils/reader.ts'
import { Pipeline, pipe } from '../utils/pipeline.ts'
import { Lens } from '../utils/lens.ts'
import { 
  Note, 
  Folder, 
  NoteServiceError, 
  FileSystemError, 
  ValidationError,
  NoteCreateRequest,
  NoteUpdateRequest,
  SearchQuery,
  SearchResult,
  NoteSortOptions,
  NoteFilter,
  StorageStats
} from '../types/note.ts'

export interface FileSystemDependencies {
  readonly readTextFile: (path: string) => Promise<string>
  readonly writeTextFile: (path: string, content: string) => Promise<void>
  readonly readDir: (path: string) => Promise<string[]>
  readonly mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>
  readonly stat: (path: string) => Promise<{ size: number; mtime: Date; isFile: boolean; isDirectory: boolean }>
  readonly remove: (path: string, options?: { recursive?: boolean }) => Promise<void>
  readonly exists: (path: string) => Promise<boolean>
  readonly rename: (oldPath: string, newPath: string) => Promise<void>
}

export interface CacheDependencies {
  readonly get: <T>(key: string) => Promise<T | null>
  readonly set: <T>(key: string, value: T, ttl?: number) => Promise<void>
  readonly delete: (key: string) => Promise<void>
  readonly clear: () => Promise<void>
}

export interface Dependencies {
  readonly fs: FileSystemDependencies
  readonly cache: CacheDependencies
  readonly basePath: string
  readonly indexPath: string
}

export class NoteService {
  private static readonly NOTES_DIR = 'notes'
  private static readonly FOLDERS_DIR = 'folders'
  private static readonly INDEX_FILE = 'index.json'
  private static readonly CACHE_TTL = 300000 // 5 minutes

  // Note Creation and Management
  static createNote = (request: NoteCreateRequest): ReaderTaskEither<Dependencies, NoteServiceError, Note> =>
    Reader.of((deps: Dependencies) =>
      pipe
        .from(NoteService.validateCreateRequest(request))
        .step(validRequest => NoteService.generateNoteId(validRequest))
        .step(noteWithId => NoteService.writeNoteToFileSystem(noteWithId, deps))
        .step(savedNote => NoteService.updateIndex(savedNote, 'create', deps))
        .step(updatedNote => NoteService.invalidateCache(updatedNote.id, deps))
        .step(() => TaskEither.of(NoteService.buildNote(request)))
        .build()
    )

  static updateNote = (id: string, updates: NoteUpdateRequest): ReaderTaskEither<Dependencies, NoteServiceError, Note> =>
    Reader.of((deps: Dependencies) =>
      pipe
        .from(NoteService.validateUpdateRequest(updates))
        .step(() => NoteService.loadNote(id, deps))
        .step(existingNote => NoteService.applyUpdates(existingNote, updates))
        .step(updatedNote => NoteService.writeNoteToFileSystem(updatedNote, deps))
        .step(savedNote => NoteService.updateIndex(savedNote, 'update', deps))
        .step(indexedNote => NoteService.invalidateCache(indexedNote.id, deps))
        .build()
    )

  static deleteNote = (id: string): ReaderTaskEither<Dependencies, NoteServiceError, void> =>
    Reader.of((deps: Dependencies) =>
      pipe
        .from(NoteService.loadNote(id, deps))
        .step(note => NoteService.removeNoteFile(note, deps))
        .step(removedNote => NoteService.updateIndex(removedNote, 'delete', deps))
        .step(() => NoteService.invalidateCache(id, deps))
        .build()
    )

  // Note Retrieval
  static getNote = (id: string): ReaderTaskEither<Dependencies, NoteServiceError, Note> =>
    Reader.of((deps: Dependencies) =>
      pipe
        .from(NoteService.loadFromCache(id, deps))
        .step(cachedNote => 
          cachedNote 
            ? TaskEither.of(cachedNote)
            : NoteService.loadNote(id, deps).flatMap(note => 
                NoteService.cacheNote(note, deps).map(() => note)
              )
        )
        .build()
    )

  static getNotes = (
    folderId?: string, 
    filter?: NoteFilter, 
    sort?: NoteSortOptions,
    offset: number = 0,
    limit: number = 50
  ): ReaderTaskEither<Dependencies, NoteServiceError, readonly Note[]> =>
    Reader.of((deps: Dependencies) =>
      pipe
        .from(NoteService.loadNoteIndex(deps))
        .step(index => NoteService.filterNotes(index, folderId, filter))
        .step(filteredNotes => NoteService.sortNotes(filteredNotes, sort))
        .step(sortedNotes => TaskEither.of(sortedNotes.slice(offset, offset + limit)))
        .step(paginatedNotes => NoteService.loadNotesContent(paginatedNotes, deps))
        .build()
    )

  // Search Functionality
  static searchNotes = (query: SearchQuery): ReaderTaskEither<Dependencies, NoteServiceError, SearchResult> =>
    Reader.of((deps: Dependencies) =>
      pipe
        .from(NoteService.validateSearchQuery(query))
        .step(validQuery => NoteService.executeSearch(validQuery, deps))
        .step(searchResult => NoteService.cacheSearchResult(query, searchResult, deps))
        .build()
    )

  // Folder Management
  static createFolder = (name: string, parentId?: string): ReaderTaskEither<Dependencies, NoteServiceError, Folder> =>
    Reader.of((deps: Dependencies) =>
      pipe
        .from(NoteService.validateFolderName(name))
        .step(() => NoteService.generateFolderId())
        .step(folderId => NoteService.buildFolder(folderId, name, parentId))
        .step(folder => NoteService.writeFolderToFileSystem(folder, deps))
        .step(savedFolder => NoteService.updateFolderIndex(savedFolder, 'create', deps))
        .build()
    )

  static getFolders = (): ReaderTaskEither<Dependencies, NoteServiceError, readonly Folder[]> =>
    Reader.of((deps: Dependencies) =>
      pipe
        .from(NoteService.loadFolderIndex(deps))
        .step(folders => NoteService.enrichFoldersWithStats(folders, deps))
        .build()
    )

  // Storage Management
  static getStorageStats = (): ReaderTaskEither<Dependencies, NoteServiceError, StorageStats> =>
    Reader.of((deps: Dependencies) =>
      pipe
        .from(NoteService.calculateDirectorySize(deps.basePath, deps))
        .step(totalSize => NoteService.countNotes(deps))
        .step(noteCount => NoteService.countFolders(deps))
        .step(folderCount => TaskEither.of({
          totalSize,
          noteCount,
          folderCount,
          lastBackup: new Date(),
          availableSpace: 0 // Will be calculated by filesystem
        }))
        .build()
    )

  // Private Implementation Methods

  private static validateCreateRequest = (request: NoteCreateRequest): TaskEither<ValidationError, NoteCreateRequest> =>
    TaskEither.tryCatch(
      async () => {
        if (!request.title?.trim()) {
          throw new Error('Note title is required')
        }
        if (request.title.length > 200) {
          throw new Error('Note title too long (max 200 characters)')
        }
        return request
      },
      (error) => ({
        type: 'validation_error' as const,
        message: (error as Error).message,
        field: 'title'
      })
    )

  private static validateUpdateRequest = (updates: NoteUpdateRequest): TaskEither<ValidationError, NoteUpdateRequest> =>
    TaskEither.tryCatch(
      async () => {
        if (updates.title !== undefined && (!updates.title?.trim() || updates.title.length > 200)) {
          throw new Error('Invalid title update')
        }
        return updates
      },
      (error) => ({
        type: 'validation_error' as const,
        message: (error as Error).message,
        field: 'updates'
      })
    )

  private static generateNoteId = (request: NoteCreateRequest): TaskEither<NoteServiceError, NoteCreateRequest & { id: string }> =>
    TaskEither.of({
      ...request,
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })

  private static generateFolderId = (): TaskEither<NoteServiceError, string> =>
    TaskEither.of(`folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

  private static buildNote = (request: NoteCreateRequest & { id?: string }): Note => ({
    id: request.id || `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: request.title,
    content: request.content || '',
    preview: NoteService.generatePreview(request.content || ''),
    folderId: request.folderId || 'default',
    tags: request.tags || [],
    createdAt: new Date(),
    lastModified: new Date(),
    wordCount: NoteService.countWords(request.content || ''),
    hasAttachments: false,
    isPinned: false,
    isArchived: false,
    version: 1
  })

  private static buildFolder = (id: string, name: string, parentId?: string): TaskEither<NoteServiceError, Folder> =>
    TaskEither.of({
      id,
      name,
      parentId: parentId || null,
      path: parentId ? `${parentId}/${name}` : name,
      noteCount: 0,
      createdAt: new Date(),
      lastModified: new Date(),
      icon: 'folder',
      color: '#6B7280'
    })

  private static writeNoteToFileSystem = (note: Note, deps: Dependencies): TaskEither<FileSystemError, Note> =>
    TaskEither.tryCatch(
      async () => {
        const notePath = `${deps.basePath}/${NoteService.NOTES_DIR}/${note.id}.md`
        const noteContent = NoteService.serializeNote(note)
        await deps.fs.writeTextFile(notePath, noteContent)
        return note
      },
      (error) => ({
        type: 'file_system_error' as const,
        message: `Failed to write note: ${(error as Error).message}`,
        operation: 'write'
      })
    )

  private static writeFolderToFileSystem = (folder: Folder, deps: Dependencies): TaskEither<FileSystemError, Folder> =>
    TaskEither.tryCatch(
      async () => {
        const folderPath = `${deps.basePath}/${NoteService.FOLDERS_DIR}/${folder.id}.json`
        const folderContent = JSON.stringify(folder, null, 2)
        await deps.fs.writeTextFile(folderPath, folderContent)
        return folder
      },
      (error) => ({
        type: 'file_system_error' as const,
        message: `Failed to write folder: ${(error as Error).message}`,
        operation: 'write'
      })
    )

  private static loadNote = (id: string, deps: Dependencies): TaskEither<NoteServiceError, Note> =>
    TaskEither.tryCatch(
      async () => {
        const notePath = `${deps.basePath}/${NoteService.NOTES_DIR}/${id}.md`
        const exists = await deps.fs.exists(notePath)
        if (!exists) {
          throw new Error(`Note ${id} not found`)
        }
        
        const content = await deps.fs.readTextFile(notePath)
        return NoteService.deserializeNote(id, content)
      },
      (error) => ({
        type: 'note_not_found' as const,
        message: (error as Error).message,
        noteId: id
      })
    )

  private static serializeNote = (note: Note): string => {
    const frontMatter = [
      '---',
      `title: "${note.title}"`,
      `id: "${note.id}"`,
      `folderId: "${note.folderId}"`,
      `tags: [${note.tags.map(tag => `"${tag}"`).join(', ')}]`,
      `createdAt: "${note.createdAt.toISOString()}"`,
      `lastModified: "${note.lastModified.toISOString()}"`,
      `isPinned: ${note.isPinned}`,
      `isArchived: ${note.isArchived}`,
      `version: ${note.version}`,
      '---',
      ''
    ].join('\n')

    return frontMatter + note.content
  }

  private static deserializeNote = (id: string, content: string): Note => {
    const frontMatterMatch = content.match(/^---\n(.*?)\n---\n(.*)$/s)
    
    if (!frontMatterMatch) {
      // Fallback for notes without front matter
      return {
        id,
        title: 'Untitled Note',
        content,
        preview: NoteService.generatePreview(content),
        folderId: 'default',
        tags: [],
        createdAt: new Date(),
        lastModified: new Date(),
        wordCount: NoteService.countWords(content),
        hasAttachments: false,
        isPinned: false,
        isArchived: false,
        version: 1
      }
    }

    const [, frontMatter, noteContent] = frontMatterMatch
    const metadata = NoteService.parseFrontMatter(frontMatter)

    return {
      id: metadata.id || id,
      title: metadata.title || 'Untitled Note',
      content: noteContent,
      preview: NoteService.generatePreview(noteContent),
      folderId: metadata.folderId || 'default',
      tags: metadata.tags || [],
      createdAt: metadata.createdAt ? new Date(metadata.createdAt) : new Date(),
      lastModified: metadata.lastModified ? new Date(metadata.lastModified) : new Date(),
      wordCount: NoteService.countWords(noteContent),
      hasAttachments: false, // Will be calculated
      isPinned: metadata.isPinned || false,
      isArchived: metadata.isArchived || false,
      version: metadata.version || 1
    }
  }

  private static parseFrontMatter = (frontMatter: string): Record<string, any> => {
    const result: Record<string, any> = {}
    const lines = frontMatter.split('\n')
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/)
      if (match) {
        const [, key, value] = match
        try {
          // Try to parse as JSON for arrays/objects
          result[key] = JSON.parse(value)
        } catch {
          // Fallback to string parsing
          result[key] = value.replace(/^"(.*)"$/, '$1') // Remove quotes
        }
      }
    }
    
    return result
  }

  private static generatePreview = (content: string): string => {
    const plainText = content
      .replace(/#+\s+/g, '') // Remove headings
      .replace(/\*+([^*]+)\*+/g, '$1') // Remove emphasis
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim()
    
    return plainText.length > 150 
      ? plainText.substring(0, 150).trim() + '...'
      : plainText
  }

  private static countWords = (content: string): number => {
    return content
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(word => word.length > 0)
      .length
  }

  private static applyUpdates = (note: Note, updates: NoteUpdateRequest): TaskEither<NoteServiceError, Note> => {
    const noteLens = Lens.of<Note>()
    
    let updatedNote = note
    
    if (updates.title !== undefined) {
      updatedNote = noteLens.focus('title').set(updates.title)(updatedNote)
    }
    
    if (updates.content !== undefined) {
      updatedNote = noteLens.focus('content').set(updates.content)(updatedNote)
      updatedNote = noteLens.focus('preview').set(NoteService.generatePreview(updates.content))(updatedNote)
      updatedNote = noteLens.focus('wordCount').set(NoteService.countWords(updates.content))(updatedNote)
    }
    
    if (updates.tags !== undefined) {
      updatedNote = noteLens.focus('tags').set(updates.tags)(updatedNote)
    }
    
    if (updates.folderId !== undefined) {
      updatedNote = noteLens.focus('folderId').set(updates.folderId)(updatedNote)
    }
    
    if (updates.isPinned !== undefined) {
      updatedNote = noteLens.focus('isPinned').set(updates.isPinned)(updatedNote)
    }
    
    if (updates.isArchived !== undefined) {
      updatedNote = noteLens.focus('isArchived').set(updates.isArchived)(updatedNote)
    }
    
    // Always update lastModified and increment version
    updatedNote = noteLens.focus('lastModified').set(new Date())(updatedNote)
    updatedNote = noteLens.focus('version').modify(v => v + 1)(updatedNote)
    
    return TaskEither.of(updatedNote)
  }

  private static loadFromCache = (id: string, deps: Dependencies): TaskEither<NoteServiceError, Note | null> =>
    TaskEither.tryCatch(
      async () => deps.cache.get<Note>(`note:${id}`),
      () => null
    )

  private static cacheNote = (note: Note, deps: Dependencies): TaskEither<NoteServiceError, void> =>
    TaskEither.tryCatch(
      async () => deps.cache.set(`note:${note.id}`, note, NoteService.CACHE_TTL),
      () => undefined
    )

  private static invalidateCache = (id: string, deps: Dependencies): TaskEither<NoteServiceError, void> =>
    TaskEither.tryCatch(
      async () => deps.cache.delete(`note:${id}`),
      () => undefined
    )

  private static updateIndex = (note: Note, operation: 'create' | 'update' | 'delete', deps: Dependencies): TaskEither<NoteServiceError, Note> =>
    TaskEither.of(note) // Simplified for now - would update search index

  private static updateFolderIndex = (folder: Folder, operation: 'create' | 'update' | 'delete', deps: Dependencies): TaskEither<NoteServiceError, Folder> =>
    TaskEither.of(folder) // Simplified for now

  private static loadNoteIndex = (deps: Dependencies): TaskEither<NoteServiceError, readonly Note[]> =>
    TaskEither.tryCatch(
      async () => {
        const notesDir = `${deps.basePath}/${NoteService.NOTES_DIR}`
        const files = await deps.fs.readDir(notesDir)
        const noteFiles = files.filter(file => file.endsWith('.md'))
        
        const notes: Note[] = []
        for (const file of noteFiles) {
          const id = file.replace('.md', '')
          const content = await deps.fs.readTextFile(`${notesDir}/${file}`)
          notes.push(NoteService.deserializeNote(id, content))
        }
        
        return notes
      },
      (error) => ({
        type: 'file_system_error' as const,
        message: `Failed to load note index: ${(error as Error).message}`,
        operation: 'read'
      })
    )

  private static loadFolderIndex = (deps: Dependencies): TaskEither<NoteServiceError, readonly Folder[]> =>
    TaskEither.tryCatch(
      async () => {
        const foldersDir = `${deps.basePath}/${NoteService.FOLDERS_DIR}`
        const files = await deps.fs.readDir(foldersDir)
        const folderFiles = files.filter(file => file.endsWith('.json'))
        
        const folders: Folder[] = []
        for (const file of folderFiles) {
          const content = await deps.fs.readTextFile(`${foldersDir}/${file}`)
          folders.push(JSON.parse(content))
        }
        
        return folders
      },
      (error) => ({
        type: 'file_system_error' as const,
        message: `Failed to load folder index: ${(error as Error).message}`,
        operation: 'read'
      })
    )

  private static filterNotes = (notes: readonly Note[], folderId?: string, filter?: NoteFilter): TaskEither<NoteServiceError, readonly Note[]> =>
    TaskEither.of(notes.filter(note => {
      if (folderId && note.folderId !== folderId) return false
      if (filter?.isPinned !== undefined && note.isPinned !== filter.isPinned) return false
      if (filter?.isArchived !== undefined && note.isArchived !== filter.isArchived) return false
      if (filter?.tags && !filter.tags.every(tag => note.tags.includes(tag))) return false
      return true
    }))

  private static sortNotes = (notes: readonly Note[], sort?: NoteSortOptions): TaskEither<NoteServiceError, readonly Note[]> => {
    const sortedNotes = [...notes]
    
    if (!sort) {
      // Default sort by lastModified descending
      sortedNotes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      return TaskEither.of(sortedNotes)
    }
    
    sortedNotes.sort((a, b) => {
      let comparison = 0
      
      switch (sort.field) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
        case 'lastModified':
          comparison = a.lastModified.getTime() - b.lastModified.getTime()
          break
        case 'wordCount':
          comparison = a.wordCount - b.wordCount
          break
        default:
          comparison = 0
      }
      
      return sort.direction === 'desc' ? -comparison : comparison
    })
    
    return TaskEither.of(sortedNotes)
  }

  private static loadNotesContent = (notes: readonly Note[], deps: Dependencies): TaskEither<NoteServiceError, readonly Note[]> =>
    TaskEither.of(notes) // Already loaded in this implementation

  private static validateSearchQuery = (query: SearchQuery): TaskEither<ValidationError, SearchQuery> =>
    TaskEither.tryCatch(
      async () => {
        if (!query.term?.trim()) {
          throw new Error('Search term is required')
        }
        if (query.term.length < 2) {
          throw new Error('Search term too short (minimum 2 characters)')
        }
        return query
      },
      (error) => ({
        type: 'validation_error' as const,
        message: (error as Error).message,
        field: 'term'
      })
    )

  private static executeSearch = (query: SearchQuery, deps: Dependencies): TaskEither<NoteServiceError, SearchResult> =>
    TaskEither.tryCatch(
      async () => {
        // Simple implementation - would use proper search index in production
        const allNotes = await NoteService.loadNoteIndex(deps).run()
        if (allNotes.isLeft()) {
          throw new Error('Failed to load notes for search')
        }
        
        const notes = allNotes.value
        const term = query.term.toLowerCase()
        
        const matchingNotes = notes.filter(note => 
          note.title.toLowerCase().includes(term) ||
          note.content.toLowerCase().includes(term) ||
          note.tags.some(tag => tag.toLowerCase().includes(term))
        )
        
        return {
          notes: matchingNotes,
          totalCount: matchingNotes.length,
          query,
          executedAt: new Date()
        }
      },
      (error) => ({
        type: 'search_error' as const,
        message: `Search failed: ${(error as Error).message}`,
        query
      })
    )

  private static cacheSearchResult = (query: SearchQuery, result: SearchResult, deps: Dependencies): TaskEither<NoteServiceError, SearchResult> =>
    TaskEither.tryCatch(
      async () => {
        await deps.cache.set(`search:${JSON.stringify(query)}`, result, 60000) // 1 minute TTL
        return result
      },
      () => result // Return result even if caching fails
    )

  private static validateFolderName = (name: string): TaskEither<ValidationError, string> =>
    TaskEither.tryCatch(
      async () => {
        if (!name?.trim()) {
          throw new Error('Folder name is required')
        }
        if (name.length > 100) {
          throw new Error('Folder name too long (max 100 characters)')
        }
        if (/[<>:"/\\|?*]/.test(name)) {
          throw new Error('Folder name contains invalid characters')
        }
        return name.trim()
      },
      (error) => ({
        type: 'validation_error' as const,
        message: (error as Error).message,
        field: 'name'
      })
    )

  private static enrichFoldersWithStats = (folders: readonly Folder[], deps: Dependencies): TaskEither<NoteServiceError, readonly Folder[]> =>
    TaskEither.of(folders) // Simplified - would calculate note counts

  private static calculateDirectorySize = (path: string, deps: Dependencies): TaskEither<NoteServiceError, number> =>
    TaskEither.tryCatch(
      async () => {
        // Simplified implementation
        const stats = await deps.fs.stat(path)
        return stats.size
      },
      () => 0
    )

  private static countNotes = (deps: Dependencies): TaskEither<NoteServiceError, number> =>
    TaskEither.tryCatch(
      async () => {
        const notesDir = `${deps.basePath}/${NoteService.NOTES_DIR}`
        const files = await deps.fs.readDir(notesDir)
        return files.filter(file => file.endsWith('.md')).length
      },
      () => 0
    )

  private static countFolders = (deps: Dependencies): TaskEither<NoteServiceError, number> =>
    TaskEither.tryCatch(
      async () => {
        const foldersDir = `${deps.basePath}/${NoteService.FOLDERS_DIR}`
        const files = await deps.fs.readDir(foldersDir)
        return files.filter(file => file.endsWith('.json')).length
      },
      () => 0
    )

  private static removeNoteFile = (note: Note, deps: Dependencies): TaskEither<FileSystemError, Note> =>
    TaskEither.tryCatch(
      async () => {
        const notePath = `${deps.basePath}/${NoteService.NOTES_DIR}/${note.id}.md`
        await deps.fs.remove(notePath)
        return note
      },
      (error) => ({
        type: 'file_system_error' as const,
        message: `Failed to delete note file: ${(error as Error).message}`,
        operation: 'delete'
      })
    )
}