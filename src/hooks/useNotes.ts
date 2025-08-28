/**
 * React Hooks for Note Management
 * Functional reactive patterns with TaskEither integration
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { AppService, AppDependencies } from '../services/AppService.ts'
import { Reader, ReaderTaskEither } from '../utils/reader.ts'
import { TaskEither } from '../utils/task-either.ts'
import { pipe } from '../utils/pipeline.ts'
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

// Hook state types
interface UseNotesState {
  readonly notes: readonly Note[]
  readonly loading: boolean
  readonly error: string | null
  readonly hasMore: boolean
  readonly total: number
}

interface UseNoteState {
  readonly note: Note | null
  readonly loading: boolean
  readonly error: string | null
  readonly saving: boolean
}

interface UseSearchState {
  readonly results: SearchResult | null
  readonly loading: boolean
  readonly error: string | null
  readonly query: SearchQuery | null
}

interface UseFoldersState {
  readonly folders: readonly Folder[]
  readonly loading: boolean
  readonly error: string | null
}

// Main notes listing hook
export function useNotes(
  folderId?: string,
  filter?: NoteFilter,
  sort: NoteSortOptions = { field: 'lastModified', direction: 'desc' },
  initialLimit: number = 50
) {
  const [state, setState] = useState<UseNotesState>({
    notes: [],
    loading: true,
    error: null,
    hasMore: true,
    total: 0
  })

  const [deps] = useState<AppDependencies>(() => {
    const basePath = './mekkanote-data'
    return AppService.create(basePath).run({} as AppDependencies)
  })

  // Load notes function
  const loadNotes = useCallback((offset: number = 0, limit: number = initialLimit, append: boolean = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    const loadTask = pipe
      .from(AppService.getNotes(folderId, filter, sort, offset, limit))
      .build()

    loadTask
      .run(deps)
      .then(result => {
        if (result.isRight()) {
          const newNotes = result.value
          setState(prev => ({
            ...prev,
            loading: false,
            notes: append ? [...prev.notes, ...newNotes] : newNotes,
            hasMore: newNotes.length === limit,
            total: append ? prev.total + newNotes.length : newNotes.length
          }))
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            error: result.value.message
          }))
        }
      })
      .catch(error => {
        setState(prev => ({
          ...prev,
          loading: false,
          error: `Unexpected error: ${error.message}`
        }))
      })
  }, [folderId, filter, sort, initialLimit, deps])

  // Load more notes for infinite scrolling
  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      loadNotes(state.notes.length, initialLimit, true)
    }
    return TaskEither.of(undefined)
  }, [state.loading, state.hasMore, state.notes.length, loadNotes, initialLimit])

  // Refresh notes
  const refresh = useCallback(() => {
    loadNotes(0, initialLimit, false)
    return TaskEither.of(undefined)
  }, [loadNotes, initialLimit])

  // Initial load
  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  return {
    ...state,
    loadMore,
    refresh
  }
}

// Individual note hook
export function useNote(id: string | null) {
  const [state, setState] = useState<UseNoteState>({
    note: null,
    loading: false,
    error: null,
    saving: false
  })

  const [deps] = useState<AppDependencies>(() => {
    const basePath = './mekkanote-data'
    return AppService.create(basePath).run({} as AppDependencies)
  })

  // Load note function
  const loadNote = useCallback((noteId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    AppService.getNote(noteId)
      .run(deps)
      .then(result => {
        if (result.isRight()) {
          setState(prev => ({
            ...prev,
            loading: false,
            note: result.value
          }))
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            error: result.value.message
          }))
        }
      })
      .catch(error => {
        setState(prev => ({
          ...prev,
          loading: false,
          error: `Unexpected error: ${error.message}`
        }))
      })
  }, [deps])

  // Save note function
  const saveNote = useCallback((updates: NoteUpdateRequest) => {
    if (!state.note) {
      return TaskEither.left({ 
        type: 'validation_error' as const, 
        message: 'No note to save', 
        field: 'note' 
      })
    }

    setState(prev => ({ ...prev, saving: true, error: null }))

    const saveTask = AppService.updateNote(state.note.id, updates)

    saveTask
      .run(deps)
      .then(result => {
        if (result.isRight()) {
          setState(prev => ({
            ...prev,
            saving: false,
            note: result.value
          }))
        } else {
          setState(prev => ({
            ...prev,
            saving: false,
            error: result.value.message
          }))
        }
      })
      .catch(error => {
        setState(prev => ({
          ...prev,
          saving: false,
          error: `Unexpected error: ${error.message}`
        }))
      })

    return saveTask
  }, [state.note, deps])

  // Load note when id changes
  useEffect(() => {
    if (id) {
      loadNote(id)
    } else {
      setState({
        note: null,
        loading: false,
        error: null,
        saving: false
      })
    }
  }, [id, loadNote])

  return {
    ...state,
    saveNote,
    reload: () => id ? loadNote(id) : undefined
  }
}

// Note creation hook
export function useCreateNote() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [deps] = useState<AppDependencies>(() => {
    const basePath = './mekkanote-data'
    return AppService.create(basePath).run({} as AppDependencies)
  })

  const createNote = useCallback((request: NoteCreateRequest) => {
    setLoading(true)
    setError(null)

    const createTask = AppService.createNote(request)

    createTask
      .run(deps)
      .then(result => {
        setLoading(false)
        if (result.isLeft()) {
          setError(result.value.message)
        }
      })
      .catch(error => {
        setLoading(false)
        setError(`Unexpected error: ${error.message}`)
      })

    return createTask
  }, [deps])

  return {
    createNote,
    loading,
    error
  }
}

// Note deletion hook
export function useDeleteNote() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [deps] = useState<AppDependencies>(() => {
    const basePath = './mekkanote-data'
    return AppService.create(basePath).run({} as AppDependencies)
  })

  const deleteNote = useCallback((id: string) => {
    setLoading(true)
    setError(null)

    const deleteTask = AppService.deleteNote(id)

    deleteTask
      .run(deps)
      .then(result => {
        setLoading(false)
        if (result.isLeft()) {
          setError(result.value.message)
        }
      })
      .catch(error => {
        setLoading(false)
        setError(`Unexpected error: ${error.message}`)
      })

    return deleteTask
  }, [deps])

  return {
    deleteNote,
    loading,
    error
  }
}

// Search hook
export function useSearch() {
  const [state, setState] = useState<UseSearchState>({
    results: null,
    loading: false,
    error: null,
    query: null
  })

  const [deps] = useState<AppDependencies>(() => {
    const basePath = './mekkanote-data'
    return AppService.create(basePath).run({} as AppDependencies)
  })

  const search = useCallback((query: SearchQuery) => {
    setState(prev => ({ ...prev, loading: true, error: null, query }))

    const searchTask = AppService.searchNotes(query)

    searchTask
      .run(deps)
      .then(result => {
        if (result.isRight()) {
          setState(prev => ({
            ...prev,
            loading: false,
            results: result.value
          }))
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            error: result.value.message
          }))
        }
      })
      .catch(error => {
        setState(prev => ({
          ...prev,
          loading: false,
          error: `Unexpected error: ${error.message}`
        }))
      })

    return searchTask
  }, [deps])

  const clearSearch = useCallback(() => {
    setState({
      results: null,
      loading: false,
      error: null,
      query: null
    })
  }, [])

  return {
    ...state,
    search,
    clearSearch
  }
}

// Folders hook
export function useFolders() {
  const [state, setState] = useState<UseFoldersState>({
    folders: [],
    loading: true,
    error: null
  })

  const [deps] = useState<AppDependencies>(() => {
    const basePath = './mekkanote-data'
    return AppService.create(basePath).run({} as AppDependencies)
  })

  const loadFolders = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    AppService.getFolders()
      .run(deps)
      .then(result => {
        if (result.isRight()) {
          setState(prev => ({
            ...prev,
            loading: false,
            folders: result.value
          }))
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            error: result.value.message
          }))
        }
      })
      .catch(error => {
        setState(prev => ({
          ...prev,
          loading: false,
          error: `Unexpected error: ${error.message}`
        }))
      })
  }, [deps])

  const createFolder = useCallback((name: string, parentId?: string) => {
    const createTask = AppService.createFolder(name, parentId)
    
    createTask
      .run(deps)
      .then(result => {
        if (result.isRight()) {
          // Reload folders after creation
          loadFolders()
        }
      })
    
    return createTask
  }, [deps, loadFolders])

  // Initial load
  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  return {
    ...state,
    createFolder,
    refresh: loadFolders
  }
}

// Storage stats hook
export function useStorageStats() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [deps] = useState<AppDependencies>(() => {
    const basePath = './mekkanote-data'
    return AppService.create(basePath).run({} as AppDependencies)
  })

  const loadStats = useCallback(() => {
    setLoading(true)
    setError(null)

    AppService.getStorageStats()
      .run(deps)
      .then(result => {
        setLoading(false)
        if (result.isRight()) {
          setStats(result.value)
        } else {
          setError(result.value.message)
        }
      })
      .catch(error => {
        setLoading(false)
        setError(`Unexpected error: ${error.message}`)
      })
  }, [deps])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  }
}

// App initialization hook
export function useAppInitialization() {
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [deps] = useState<AppDependencies>(() => {
    const basePath = './mekkanote-data'
    return AppService.create(basePath).run({} as AppDependencies)
  })

  useEffect(() => {
    AppService.initialize()
      .run(deps)
      .then(result => {
        setLoading(false)
        if (result.isRight()) {
          setInitialized(true)
        } else {
          setError(result.value.message)
        }
      })
      .catch(error => {
        setLoading(false)
        setError(`Initialization failed: ${error.message}`)
      })
  }, [deps])

  return {
    initialized,
    loading,
    error
  }
}