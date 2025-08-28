/**
 * Auto-Save React Hook
 * Integrates auto-save functionality with React components
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { AutoSaveService, AutoSaveConfig, AutoSaveStatus, ConflictResolutionData } from '../services/AutoSaveService.ts'
import { AppDependencies, AppService } from '../services/AppService.ts'
import { TaskEither } from '../utils/task-either.ts'
import { AutoSaveError, Note } from '../types/note.ts'

interface UseAutoSaveOptions extends Partial<AutoSaveConfig> {
  readonly noteId: string | null
  readonly initialContent?: string
  readonly onSaveSuccess?: (note: Note) => void
  readonly onSaveError?: (error: AutoSaveError) => void
  readonly onConflict?: (status: AutoSaveStatus) => void
}

interface UseAutoSaveResult {
  readonly status: AutoSaveStatus
  readonly isAutoSaving: boolean
  readonly lastSaved: Date | null
  readonly hasUnsavedChanges: boolean
  readonly saveNow: () => Promise<void>
  readonly pauseAutoSave: () => void
  readonly resumeAutoSave: () => void
  readonly resolveConflict: (resolution: ConflictResolutionData) => Promise<void>
  readonly updateContent: (content: string) => void
}

export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveResult {
  const {
    noteId,
    initialContent = '',
    onSaveSuccess,
    onSaveError,
    onConflict,
    ...autoSaveConfig
  } = options

  // State
  const [status, setStatus] = useState<AutoSaveStatus>({
    status: 'saved',
    conflict: null,
    lastSave: null
  })
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [currentContent, setCurrentContent] = useState(initialContent)
  const [noteVersion, setNoteVersion] = useState(1)

  // Refs for stable references
  const autoSaveServiceRef = useRef<AutoSaveService | null>(null)
  const depsRef = useRef<AppDependencies | null>(null)
  const contentRef = useRef(initialContent)
  const versionRef = useRef(1)

  // Initialize dependencies and auto-save service
  useEffect(() => {
    const basePath = './mekkanote-data'
    const deps = AppService.create(basePath).run({} as AppDependencies)
    depsRef.current = deps

    const autoSaveService = AutoSaveService.initialize(autoSaveConfig).run(deps)
    autoSaveServiceRef.current = autoSaveService

    return () => {
      if (autoSaveServiceRef.current) {
        autoSaveServiceRef.current.clearAllState().run(deps)
      }
    }
  }, [])

  // Update content and trigger auto-save
  const updateContent = useCallback((content: string) => {
    contentRef.current = content
    setCurrentContent(content)
    setHasUnsavedChanges(content !== initialContent)

    if (noteId && autoSaveServiceRef.current && depsRef.current) {
      const scheduleTask = autoSaveServiceRef.current.scheduleAutoSave(
        noteId, 
        content, 
        versionRef.current
      )

      scheduleTask.run(depsRef.current).then(result => {
        if (result.isLeft() && onSaveError) {
          onSaveError(result.value)
        }
      })
    }
  }, [noteId, initialContent, onSaveError])

  // Manual save
  const saveNow = useCallback(async () => {
    if (!noteId || !autoSaveServiceRef.current || !depsRef.current) {
      return
    }

    setIsAutoSaving(true)

    try {
      const saveTask = autoSaveServiceRef.current.executeImmediateSave(noteId)
      const result = await saveTask.run(depsRef.current)

      if (result.isRight()) {
        const savedNote = result.value
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
        setNoteVersion(savedNote.version)
        versionRef.current = savedNote.version

        if (onSaveSuccess) {
          onSaveSuccess(savedNote)
        }
      } else {
        if (onSaveError) {
          onSaveError(result.value)
        }
      }
    } catch (error) {
      if (onSaveError) {
        onSaveError({
          type: 'auto_save_error',
          message: `Save failed: ${(error as Error).message}`,
          noteId
        })
      }
    } finally {
      setIsAutoSaving(false)
    }
  }, [noteId, onSaveSuccess, onSaveError])

  // Pause auto-save
  const pauseAutoSave = useCallback(() => {
    if (noteId && autoSaveServiceRef.current && depsRef.current) {
      autoSaveServiceRef.current.pauseAutoSave(noteId).run(depsRef.current)
    }
  }, [noteId])

  // Resume auto-save
  const resumeAutoSave = useCallback(async () => {
    if (noteId && autoSaveServiceRef.current && depsRef.current) {
      const resumeTask = autoSaveServiceRef.current.resumeAutoSave(noteId)
      await resumeTask.run(depsRef.current)
    }
  }, [noteId])

  // Resolve conflict
  const resolveConflict = useCallback(async (resolution: ConflictResolutionData) => {
    if (!noteId || !autoSaveServiceRef.current || !depsRef.current) {
      return
    }

    setIsAutoSaving(true)

    try {
      const resolveTask = autoSaveServiceRef.current.resolveConflict(noteId, resolution)
      const result = await resolveTask.run(depsRef.current)

      if (result.isRight()) {
        const resolvedNote = result.value
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
        setNoteVersion(resolvedNote.version)
        versionRef.current = resolvedNote.version

        // Update content if server won or manual merge
        if (resolution.strategy === 'server_wins' || resolution.strategy === 'manual_merge') {
          const newContent = resolution.strategy === 'server_wins' 
            ? resolvedNote.content 
            : resolution.mergedContent || resolvedNote.content
          
          setCurrentContent(newContent)
          contentRef.current = newContent
        }

        if (onSaveSuccess) {
          onSaveSuccess(resolvedNote)
        }
      } else {
        if (onSaveError) {
          onSaveError(result.value)
        }
      }
    } catch (error) {
      if (onSaveError) {
        onSaveError({
          type: 'auto_save_error',
          message: `Conflict resolution failed: ${(error as Error).message}`,
          noteId
        })
      }
    } finally {
      setIsAutoSaving(false)
    }
  }, [noteId, onSaveSuccess, onSaveError])

  // Monitor auto-save status
  useEffect(() => {
    if (!noteId || !autoSaveServiceRef.current || !depsRef.current) {
      return
    }

    const pollStatus = () => {
      if (autoSaveServiceRef.current && depsRef.current) {
        const statusTask = autoSaveServiceRef.current.getAutoSaveStatus(noteId)
        const currentStatus = statusTask.run(depsRef.current)
        
        setStatus(currentStatus)

        // Handle conflict detection
        if (currentStatus.status === 'conflict' && onConflict) {
          onConflict(currentStatus)
        }
      }
    }

    // Initial status check
    pollStatus()

    // Poll status every 2 seconds
    const statusInterval = setInterval(pollStatus, 2000)

    return () => {
      clearInterval(statusInterval)
    }
  }, [noteId, onConflict])

  // Load initial note data
  useEffect(() => {
    if (noteId && depsRef.current) {
      AppService.getNote(noteId).run(depsRef.current).then(result => {
        if (result.isRight()) {
          const note = result.value
          setCurrentContent(note.content)
          setNoteVersion(note.version)
          setLastSaved(note.lastModified)
          setHasUnsavedChanges(false)
          contentRef.current = note.content
          versionRef.current = note.version
        }
      })
    }
  }, [noteId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (noteId && autoSaveServiceRef.current && depsRef.current) {
        // Pause auto-save when component unmounts
        autoSaveServiceRef.current.pauseAutoSave(noteId).run(depsRef.current)
      }
    }
  }, [noteId])

  return {
    status,
    isAutoSaving,
    lastSaved,
    hasUnsavedChanges,
    saveNow,
    pauseAutoSave,
    resumeAutoSave,
    resolveConflict,
    updateContent
  }
}

// Hook for global auto-save management
export function useAutoSaveManager() {
  const [isEnabled, setIsEnabled] = useState(true)
  const autoSaveServiceRef = useRef<AutoSaveService | null>(null)
  const depsRef = useRef<AppDependencies | null>(null)

  useEffect(() => {
    const basePath = './mekkanote-data'
    const deps = AppService.create(basePath).run({} as AppDependencies)
    depsRef.current = deps

    const autoSaveService = AutoSaveService.initialize({ enabled: isEnabled }).run(deps)
    autoSaveServiceRef.current = autoSaveService
  }, [isEnabled])

  const toggleAutoSave = useCallback((enabled: boolean) => {
    setIsEnabled(enabled)
  }, [])

  const getPendingSaves = useCallback(() => {
    if (autoSaveServiceRef.current && depsRef.current) {
      return autoSaveServiceRef.current.getPendingSaves().run(depsRef.current)
    }
    return []
  }, [])

  const clearAllState = useCallback(() => {
    if (autoSaveServiceRef.current && depsRef.current) {
      autoSaveServiceRef.current.clearAllState().run(depsRef.current)
    }
  }, [])

  return {
    isEnabled,
    toggleAutoSave,
    getPendingSaves,
    clearAllState
  }
}