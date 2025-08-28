/**
 * Application Service
 * Main service layer that wires together all dependencies using Reader pattern
 */

import { Reader, ReaderTaskEither } from '../utils/reader.ts'
import { TaskEither } from '../utils/task-either.ts'
import { NoteService, Dependencies } from './NoteService.ts'
import { createFileSystemAdapter } from './FileSystemAdapter.ts'
import { createCacheAdapter } from './CacheAdapter.ts'
import { 
  Note, 
  Folder,
  NoteServiceError,
  AppError,
  NoteCreateRequest,
  NoteUpdateRequest,
  SearchQuery,
  SearchResult,
  NoteSortOptions,
  NoteFilter,
  StorageStats
} from '../types/note.ts'

export interface AppConfig {
  readonly basePath: string
  readonly indexPath: string
  readonly cacheEnabled: boolean
  readonly maxCacheSize: number
  readonly searchIndexEnabled: boolean
}

export interface AppDependencies extends Dependencies {
  readonly config: AppConfig
}

export class AppService {
  // Static factory method to create service with default configuration
  static create(basePath: string = './mekkanote-data'): Reader<AppDependencies, AppService> {
    const config: AppConfig = {
      basePath,
      indexPath: `${basePath}/index.json`,
      cacheEnabled: true,
      maxCacheSize: 1000,
      searchIndexEnabled: true
    }

    const dependencies: AppDependencies = {
      fs: createFileSystemAdapter(),
      cache: createCacheAdapter(),
      basePath: config.basePath,
      indexPath: config.indexPath,
      config
    }

    return Reader.of((_deps: AppDependencies) => new AppService())
  }

  // Initialize application - create directories, setup indices
  static initialize(): ReaderTaskEither<AppDependencies, AppError, void> {
    return Reader.of((deps: AppDependencies) =>
      TaskEither.tryCatch(
        async () => {
          // Create base directories
          await deps.fs.mkdir(deps.basePath, { recursive: true })
          await deps.fs.mkdir(`${deps.basePath}/notes`, { recursive: true })
          await deps.fs.mkdir(`${deps.basePath}/folders`, { recursive: true })
          await deps.fs.mkdir(`${deps.basePath}/attachments`, { recursive: true })
          
          // Create default folder if it doesn't exist
          const defaultFolderPath = `${deps.basePath}/folders/default.json`
          const defaultExists = await deps.fs.exists(defaultFolderPath)
          
          if (!defaultExists) {
            const defaultFolder: Folder = {
              id: 'default',
              name: 'Notes',
              parentId: null,
              path: 'Notes',
              noteCount: 0,
              createdAt: new Date(),
              lastModified: new Date(),
              icon: 'folder',
              color: '#6B7280'
            }
            
            await deps.fs.writeTextFile(defaultFolderPath, JSON.stringify(defaultFolder, null, 2))
          }
        },
        (error) => ({
          type: 'initialization_error' as const,
          message: `Failed to initialize application: ${(error as Error).message}`
        })
      )
    )
  }

  // Note Management Operations
  static createNote(request: NoteCreateRequest): ReaderTaskEither<AppDependencies, NoteServiceError, Note> {
    return NoteService.createNote(request)
  }

  static updateNote(id: string, updates: NoteUpdateRequest): ReaderTaskEither<AppDependencies, NoteServiceError, Note> {
    return NoteService.updateNote(id, updates)
  }

  static deleteNote(id: string): ReaderTaskEither<AppDependencies, NoteServiceError, void> {
    return NoteService.deleteNote(id)
  }

  static getNote(id: string): ReaderTaskEither<AppDependencies, NoteServiceError, Note> {
    return NoteService.getNote(id)
  }

  static getNotes(
    folderId?: string,
    filter?: NoteFilter,
    sort?: NoteSortOptions,
    offset: number = 0,
    limit: number = 50
  ): ReaderTaskEither<AppDependencies, NoteServiceError, readonly Note[]> {
    return NoteService.getNotes(folderId, filter, sort, offset, limit)
  }

  // Search Operations
  static searchNotes(query: SearchQuery): ReaderTaskEither<AppDependencies, NoteServiceError, SearchResult> {
    return NoteService.searchNotes(query)
  }

  // Folder Management
  static createFolder(name: string, parentId?: string): ReaderTaskEither<AppDependencies, NoteServiceError, Folder> {
    return NoteService.createFolder(name, parentId)
  }

  static getFolders(): ReaderTaskEither<AppDependencies, NoteServiceError, readonly Folder[]> {
    return NoteService.getFolders()
  }

  // Storage Operations
  static getStorageStats(): ReaderTaskEither<AppDependencies, NoteServiceError, StorageStats> {
    return NoteService.getStorageStats()
  }

  // Backup Operations
  static createBackup(): ReaderTaskEither<AppDependencies, AppError, string> {
    return Reader.of((deps: AppDependencies) =>
      TaskEither.tryCatch(
        async () => {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const backupPath = `${deps.basePath}/backups/backup-${timestamp}.json`
          
          // Create backup directory
          await deps.fs.mkdir(`${deps.basePath}/backups`, { recursive: true })
          
          // Get all notes and folders
          const notesResult = await NoteService.getNotes().run(deps)
          const foldersResult = await NoteService.getFolders().run(deps)
          
          if (notesResult.isLeft()) {
            throw new Error(`Failed to load notes for backup: ${notesResult.value.message}`)
          }
          
          if (foldersResult.isLeft()) {
            throw new Error(`Failed to load folders for backup: ${foldersResult.value.message}`)
          }
          
          const backup = {
            version: '1.0',
            createdAt: new Date().toISOString(),
            notes: notesResult.value,
            folders: foldersResult.value,
            metadata: {
              totalNotes: notesResult.value.length,
              totalFolders: foldersResult.value.length
            }
          }
          
          await deps.fs.writeTextFile(backupPath, JSON.stringify(backup, null, 2))
          return backupPath
        },
        (error) => ({
          type: 'backup_error' as const,
          message: `Failed to create backup: ${(error as Error).message}`
        })
      )
    )
  }

  static restoreFromBackup(backupPath: string): ReaderTaskEither<AppDependencies, AppError, void> {
    return Reader.of((deps: AppDependencies) =>
      TaskEither.tryCatch(
        async () => {
          // Read backup file
          const backupContent = await deps.fs.readTextFile(backupPath)
          const backup = JSON.parse(backupContent)
          
          // Validate backup format
          if (!backup.version || !backup.notes || !backup.folders) {
            throw new Error('Invalid backup format')
          }
          
          // Clear existing data
          await deps.cache.clear()
          const notesDir = `${deps.basePath}/notes`
          const foldersDir = `${deps.basePath}/folders`
          
          // Remove existing files
          try {
            await deps.fs.remove(notesDir, { recursive: true })
            await deps.fs.remove(foldersDir, { recursive: true })
          } catch (error) {
            // Ignore if directories don't exist
          }
          
          // Recreate directories
          await deps.fs.mkdir(notesDir, { recursive: true })
          await deps.fs.mkdir(foldersDir, { recursive: true })
          
          // Restore folders first
          for (const folder of backup.folders) {
            const folderPath = `${foldersDir}/${folder.id}.json`
            await deps.fs.writeTextFile(folderPath, JSON.stringify(folder, null, 2))
          }
          
          // Restore notes
          for (const note of backup.notes) {
            const createRequest: NoteCreateRequest = {
              title: note.title,
              content: note.content,
              folderId: note.folderId,
              tags: note.tags
            }
            
            const result = await NoteService.createNote(createRequest).run(deps)
            if (result.isLeft()) {
              console.warn(`Failed to restore note ${note.id}:`, result.value)
            }
          }
        },
        (error) => ({
          type: 'restore_error' as const,
          message: `Failed to restore from backup: ${(error as Error).message}`
        })
      )
    )
  }

  // Maintenance Operations
  static cleanupExpiredCache(): ReaderTaskEither<AppDependencies, AppError, void> {
    return Reader.of((deps: AppDependencies) =>
      TaskEither.tryCatch(
        async () => {
          // Trigger cleanup if cache supports it
          if ('cleanup' in deps.cache && typeof deps.cache.cleanup === 'function') {
            await deps.cache.cleanup()
          }
        },
        (error) => ({
          type: 'maintenance_error' as const,
          message: `Failed to cleanup cache: ${(error as Error).message}`
        })
      )
    )
  }

  static rebuildSearchIndex(): ReaderTaskEither<AppDependencies, AppError, void> {
    return Reader.of((deps: AppDependencies) =>
      TaskEither.tryCatch(
        async () => {
          // This would rebuild the full-text search index
          // For now, just clear the search cache
          const cacheKeys = ['cache', 'deps.cache.getStats', 'keys'].reduce((acc, key) => {
            if (key in deps.cache && typeof deps.cache[key] === 'function') {
              return [...acc, key]
            }
            return acc
          }, [] as string[])
          
          // Clear search-related cache entries
          for (const key of cacheKeys) {
            if (key.startsWith('search:')) {
              await deps.cache.delete(key)
            }
          }
        },
        (error) => ({
          type: 'maintenance_error' as const,
          message: `Failed to rebuild search index: ${(error as Error).message}`
        })
      )
    )
  }

  // Health Check
  static healthCheck(): ReaderTaskEither<AppDependencies, AppError, { status: string; checks: Record<string, boolean> }> {
    return Reader.of((deps: AppDependencies) =>
      TaskEither.tryCatch(
        async () => {
          const checks: Record<string, boolean> = {}
          
          // Check base directory exists
          checks.baseDirectory = await deps.fs.exists(deps.basePath)
          
          // Check notes directory
          checks.notesDirectory = await deps.fs.exists(`${deps.basePath}/notes`)
          
          // Check folders directory
          checks.foldersDirectory = await deps.fs.exists(`${deps.basePath}/folders`)
          
          // Check cache functionality
          try {
            await deps.cache.set('health-check', 'test', 1000)
            const value = await deps.cache.get('health-check')
            checks.cache = value === 'test'
            await deps.cache.delete('health-check')
          } catch {
            checks.cache = false
          }
          
          // Check if we can create/read files
          try {
            const testPath = `${deps.basePath}/health-check.txt`
            await deps.fs.writeTextFile(testPath, 'test')
            const content = await deps.fs.readTextFile(testPath)
            checks.fileSystem = content === 'test'
            await deps.fs.remove(testPath)
          } catch {
            checks.fileSystem = false
          }
          
          const allChecksPass = Object.values(checks).every(check => check)
          
          return {
            status: allChecksPass ? 'healthy' : 'degraded',
            checks
          }
        },
        (error) => ({
          type: 'health_check_error' as const,
          message: `Health check failed: ${(error as Error).message}`
        })
      )
    )
  }
}