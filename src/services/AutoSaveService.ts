/**
 * Auto-Save Service
 * Background saving with conflict resolution using Reader pattern
 */

import { Reader, ReaderTaskEither } from '../utils/reader.ts'
import { TaskEither } from '../utils/task-either.ts'
import { State } from '../utils/state.ts'
import { AppService, AppDependencies } from './AppService.ts'
import { 
  Note, 
  NoteServiceError, 
  AutoSaveError, 
  NoteUpdateRequest,
  ConflictResolutionStrategy 
} from '../types/note.ts'

export interface AutoSaveConfig {
  readonly enabled: boolean
  readonly debounceMs: number
  readonly maxRetries: number
  readonly retryDelayMs: number
  readonly conflictStrategy: ConflictResolutionStrategy
  readonly enableVersioning: boolean
  readonly maxVersions: number
}

export interface AutoSaveState {
  readonly pendingSaves: Map<string, PendingSave>
  readonly saveTimers: Map<string, number>
  readonly conflicts: Map<string, ConflictInfo>
  readonly retryQueue: Map<string, RetryInfo>
}

interface PendingSave {
  readonly noteId: string
  readonly content: string
  readonly timestamp: Date
  readonly version: number
}

interface ConflictInfo {
  readonly noteId: string
  readonly localVersion: number
  readonly serverVersion: number
  readonly localContent: string
  readonly serverContent: string
  readonly timestamp: Date
}

interface RetryInfo {
  readonly noteId: string
  readonly content: string
  readonly attempt: number
  readonly nextRetryAt: Date
}

export class AutoSaveService {
  private static readonly DEFAULT_CONFIG: AutoSaveConfig = {
    enabled: true,
    debounceMs: 2000,
    maxRetries: 3,
    retryDelayMs: 1000,
    conflictStrategy: 'user_wins',
    enableVersioning: true,
    maxVersions: 10
  }

  // Initialize auto-save service
  static initialize(config?: Partial<AutoSaveConfig>): Reader<AppDependencies, AutoSaveService> {
    const finalConfig = { ...AutoSaveService.DEFAULT_CONFIG, ...config }
    
    return Reader.of((deps: AppDependencies) => {
      const initialState: AutoSaveState = {
        pendingSaves: new Map(),
        saveTimers: new Map(),
        conflicts: new Map(),
        retryQueue: new Map()
      }
      
      return new AutoSaveService(finalConfig, initialState)
    })
  }

  constructor(
    private readonly config: AutoSaveConfig,
    private state: AutoSaveState
  ) {}

  // Schedule auto-save for a note
  scheduleAutoSave = (noteId: string, content: string, version: number): ReaderTaskEither<AppDependencies, AutoSaveError, void> =>
    Reader.of((deps: AppDependencies) => {
      if (!this.config.enabled) {
        return TaskEither.of(undefined)
      }

      return TaskEither.tryCatch(
        async () => {
          // Cancel existing timer
          const existingTimer = this.state.saveTimers.get(noteId)
          if (existingTimer) {
            clearTimeout(existingTimer)
          }

          // Store pending save
          const pendingSave: PendingSave = {
            noteId,
            content,
            timestamp: new Date(),
            version
          }
          
          this.state.pendingSaves.set(noteId, pendingSave)

          // Schedule debounced save
          const timerId = setTimeout(() => {
            this.executeSave(noteId, deps)
          }, this.config.debounceMs) as unknown as number

          this.state.saveTimers.set(noteId, timerId)
        },
        (error) => ({
          type: 'auto_save_error' as const,
          message: `Failed to schedule auto-save: ${(error as Error).message}`,
          noteId
        })
      )
    })

  // Execute immediate save (bypass debouncing)
  executeImmediateSave = (noteId: string): ReaderTaskEither<AppDependencies, AutoSaveError, Note> =>
    Reader.of((deps: AppDependencies) => {
      const pendingSave = this.state.pendingSaves.get(noteId)
      
      if (!pendingSave) {
        return TaskEither.left({
          type: 'auto_save_error' as const,
          message: 'No pending save found',
          noteId
        })
      }

      return this.performSave(pendingSave, deps)
    })

  // Get auto-save status
  getAutoSaveStatus = (noteId: string): Reader<AppDependencies, AutoSaveStatus> =>
    Reader.of((_deps: AppDependencies) => {
      const pendingSave = this.state.pendingSaves.get(noteId)
      const conflict = this.state.conflicts.get(noteId)
      const retry = this.state.retryQueue.get(noteId)

      if (conflict) {
        return { status: 'conflict', conflict, lastSave: null }
      }

      if (retry) {
        return { 
          status: 'retrying', 
          conflict: null,
          lastSave: pendingSave ? pendingSave.timestamp : null,
          retryAttempt: retry.attempt,
          nextRetry: retry.nextRetryAt
        }
      }

      if (pendingSave) {
        return { 
          status: 'pending', 
          conflict: null,
          lastSave: pendingSave.timestamp 
        }
      }

      return { status: 'saved', conflict: null, lastSave: null }
    })

  // Resolve conflict
  resolveConflict = (noteId: string, resolution: ConflictResolutionData): ReaderTaskEither<AppDependencies, AutoSaveError, Note> =>
    Reader.of((deps: AppDependencies) => {
      const conflict = this.state.conflicts.get(noteId)
      
      if (!conflict) {
        return TaskEither.left({
          type: 'auto_save_error' as const,
          message: 'No conflict found to resolve',
          noteId
        })
      }

      return TaskEither.tryCatch(
        async () => {
          let finalContent: string
          
          switch (resolution.strategy) {
            case 'local_wins':
              finalContent = conflict.localContent
              break
            case 'server_wins':
              finalContent = conflict.serverContent
              break
            case 'manual_merge':
              if (!resolution.mergedContent) {
                throw new Error('Manual merge requires merged content')
              }
              finalContent = resolution.mergedContent
              break
            default:
              finalContent = conflict.localContent
          }

          // Save resolved content
          const updateRequest: NoteUpdateRequest = { content: finalContent }
          const saveResult = await AppService.updateNote(noteId, updateRequest).run(deps)
          
          if (saveResult.isLeft()) {
            throw new Error(`Failed to save resolved conflict: ${saveResult.value.message}`)
          }

          // Clear conflict state
          this.state.conflicts.delete(noteId)
          this.state.pendingSaves.delete(noteId)

          return saveResult.value
        },
        (error) => ({
          type: 'auto_save_error' as const,
          message: `Failed to resolve conflict: ${(error as Error).message}`,
          noteId
        })
      )
    })

  // Pause auto-save for a note
  pauseAutoSave = (noteId: string): Reader<AppDependencies, void> =>
    Reader.of((_deps: AppDependencies) => {
      const timerId = this.state.saveTimers.get(noteId)
      if (timerId) {
        clearTimeout(timerId)
        this.state.saveTimers.delete(noteId)
      }
    })

  // Resume auto-save for a note
  resumeAutoSave = (noteId: string): ReaderTaskEither<AppDependencies, AutoSaveError, void> =>
    Reader.of((deps: AppDependencies) => {
      const pendingSave = this.state.pendingSaves.get(noteId)
      
      if (!pendingSave) {
        return TaskEither.of(undefined)
      }

      return this.scheduleAutoSave(noteId, pendingSave.content, pendingSave.version).run(deps)
    })

  // Get all pending saves
  getPendingSaves = (): Reader<AppDependencies, readonly PendingSave[]> =>
    Reader.of((_deps: AppDependencies) => Array.from(this.state.pendingSaves.values()))

  // Clear all auto-save state
  clearAllState = (): Reader<AppDependencies, void> =>
    Reader.of((_deps: AppDependencies) => {
      // Clear all timers
      for (const timerId of this.state.saveTimers.values()) {
        clearTimeout(timerId)
      }

      this.state.pendingSaves.clear()
      this.state.saveTimers.clear()
      this.state.conflicts.clear()
      this.state.retryQueue.clear()
    })

  // Private implementation methods

  private executeSave = async (noteId: string, deps: AppDependencies): Promise<void> => {
    const pendingSave = this.state.pendingSaves.get(noteId)
    
    if (!pendingSave) {
      return
    }

    try {
      const result = await this.performSave(pendingSave, deps).run(deps)
      
      if (result.isRight()) {
        // Success - clear pending save
        this.state.pendingSaves.delete(noteId)
        this.state.saveTimers.delete(noteId)
        this.state.retryQueue.delete(noteId)
      } else {
        // Handle failure
        await this.handleSaveFailure(pendingSave, result.value, deps)
      }
    } catch (error) {
      await this.handleSaveFailure(pendingSave, {
        type: 'auto_save_error' as const,
        message: `Unexpected save error: ${(error as Error).message}`,
        noteId
      }, deps)
    }
  }

  private performSave = (pendingSave: PendingSave, deps: AppDependencies): ReaderTaskEither<AppDependencies, AutoSaveError, Note> =>
    Reader.of(async () => {
      try {
        // First, get current note to check for conflicts
        const currentNoteResult = await AppService.getNote(pendingSave.noteId).run(deps)
        
        if (currentNoteResult.isLeft()) {
          return TaskEither.left({
            type: 'auto_save_error' as const,
            message: `Failed to load current note: ${currentNoteResult.value.message}`,
            noteId: pendingSave.noteId
          })
        }

        const currentNote = currentNoteResult.value

        // Check for version conflict
        if (this.config.enableVersioning && currentNote.version > pendingSave.version) {
          return this.handleVersionConflict(pendingSave, currentNote, deps)
        }

        // Perform the save
        const updateRequest: NoteUpdateRequest = {
          content: pendingSave.content
        }

        const saveResult = await AppService.updateNote(pendingSave.noteId, updateRequest).run(deps)
        
        if (saveResult.isLeft()) {
          return TaskEither.left({
            type: 'auto_save_error' as const,
            message: saveResult.value.message,
            noteId: pendingSave.noteId
          })
        }

        return TaskEither.of(saveResult.value)
      } catch (error) {
        return TaskEither.left({
          type: 'auto_save_error' as const,
          message: `Save operation failed: ${(error as Error).message}`,
          noteId: pendingSave.noteId
        })
      }
    }).flatMap(task => task)

  private handleVersionConflict = (
    pendingSave: PendingSave, 
    currentNote: Note, 
    deps: AppDependencies
  ): TaskEither<AutoSaveError, Note> => {
    const conflict: ConflictInfo = {
      noteId: pendingSave.noteId,
      localVersion: pendingSave.version,
      serverVersion: currentNote.version,
      localContent: pendingSave.content,
      serverContent: currentNote.content,
      timestamp: new Date()
    }

    this.state.conflicts.set(pendingSave.noteId, conflict)

    // Apply automatic resolution strategy
    switch (this.config.conflictStrategy) {
      case 'server_wins':
        return TaskEither.of(currentNote)
      
      case 'user_wins':
        // Force save local content
        return this.forceSave(pendingSave, deps)
      
      case 'manual':
      default:
        // Leave for manual resolution
        return TaskEither.left({
          type: 'auto_save_error' as const,
          message: 'Version conflict detected - manual resolution required',
          noteId: pendingSave.noteId,
          conflict
        })
    }
  }

  private forceSave = (pendingSave: PendingSave, deps: AppDependencies): TaskEither<AutoSaveError, Note> =>
    TaskEither.tryCatch(
      async () => {
        const updateRequest: NoteUpdateRequest = {
          content: pendingSave.content
        }

        const result = await AppService.updateNote(pendingSave.noteId, updateRequest).run(deps)
        
        if (result.isLeft()) {
          throw new Error(result.value.message)
        }

        return result.value
      },
      (error) => ({
        type: 'auto_save_error' as const,
        message: `Force save failed: ${(error as Error).message}`,
        noteId: pendingSave.noteId
      })
    )

  private handleSaveFailure = async (
    pendingSave: PendingSave, 
    error: AutoSaveError, 
    deps: AppDependencies
  ): Promise<void> => {
    const existingRetry = this.state.retryQueue.get(pendingSave.noteId)
    const attempt = existingRetry ? existingRetry.attempt + 1 : 1

    if (attempt <= this.config.maxRetries) {
      // Schedule retry
      const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1) // Exponential backoff
      const nextRetryAt = new Date(Date.now() + delay)

      const retryInfo: RetryInfo = {
        noteId: pendingSave.noteId,
        content: pendingSave.content,
        attempt,
        nextRetryAt
      }

      this.state.retryQueue.set(pendingSave.noteId, retryInfo)

      // Schedule the retry
      setTimeout(() => {
        this.executeSave(pendingSave.noteId, deps)
      }, delay)
    } else {
      // Max retries exceeded - clear state and give up
      this.state.retryQueue.delete(pendingSave.noteId)
      console.error(`Auto-save failed after ${this.config.maxRetries} attempts:`, error)
    }
  }
}

// Type definitions for auto-save status
export interface AutoSaveStatus {
  readonly status: 'saved' | 'pending' | 'conflict' | 'retrying' | 'error'
  readonly conflict: ConflictInfo | null
  readonly lastSave: Date | null
  readonly retryAttempt?: number
  readonly nextRetry?: Date
}

export interface ConflictResolutionData {
  readonly strategy: 'local_wins' | 'server_wins' | 'manual_merge'
  readonly mergedContent?: string
}