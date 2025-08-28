/**
 * Org-Mode Editor Component
 * Rich text editing with real-time syntax highlighting and auto-save
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { OrgModeEditorProps, EditorError, SaveError, OrgModeState } from '../../types/note.ts'
import { createOrgModeParser } from '../../services/OrgModeParser.ts'
import { useAutoSave } from '../../hooks/useAutoSave.ts'
import { AutoSaveStatusIndicator } from './AutoSaveStatusIndicator.tsx'
import { ConflictResolutionModal } from './ConflictResolutionModal.tsx'
import { State } from '../../utils/state.ts'
import { Lens } from '../../utils/lens.ts'

// State lenses for immutable updates
const contentLens = Lens.of<OrgModeState, 'content'>('content')
const cursorPositionLens = Lens.of<OrgModeState, 'cursorPosition'>('cursorPosition')
const undoStackLens = Lens.of<OrgModeState, 'undoStack'>('undoStack')
const redoStackLens = Lens.of<OrgModeState, 'redoStack'>('redoStack')
const isDirtyLens = Lens.of<OrgModeState, 'isDirty'>('isDirty')
const lastSavedLens = Lens.of<OrgModeState, 'lastSaved'>('lastSaved')

export const OrgModeEditor: React.FC<OrgModeEditorProps> = ({
  noteId,
  initialContent,
  onContentChange,
  onSave,
  readOnly = false,
  placeholder = 'Start writing your note...',
  autoSave = true,
  debounceMs = 2000,
}) => {
  const [editorState, setEditorState] = useState<OrgModeState>({
    content: initialContent,
    cursorPosition: 0,
    undoStack: [],
    redoStack: [],
    isDirty: false,
    lastSaved: undefined,
  })

  const [highlightedContent, setHighlightedContent] = useState<string>('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [showConflictModal, setShowConflictModal] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const parser = useMemo(() => createOrgModeParser(), [])

  // Auto-save integration
  const autoSaveHook = useAutoSave({
    noteId,
    initialContent,
    enabled: autoSave && !readOnly,
    debounceMs,
    onSaveSuccess: (note) => {
      setEditorState(prev => lastSavedLens.set(note.lastModified)(prev))
    },
    onSaveError: (error) => {
      console.error('Auto-save error:', error)
    },
    onConflict: (status) => {
      if (status.conflict) {
        setShowConflictModal(true)
      }
    }
  })

  // Update auto-save when content changes
  useEffect(() => {
    if (editorState.content !== initialContent) {
      autoSaveHook.updateContent(editorState.content)
      if (onContentChange) {
        onContentChange(editorState.content)
      }
    }
  }, [editorState.content, initialContent, onContentChange, autoSaveHook])

  // Parse and highlight content
  useEffect(() => {
    const parseContent = async () => {
      const result = await parser.parse(editorState.content).run()
      
      if (result.isRight()) {
        const elements = result.value
        const highlighted = renderHighlightedContent(elements, editorState.content)
        setHighlightedContent(highlighted)
        setParseError(null)
      } else {
        setParseError(result.value)
      }
    }

    parseContent()
  }, [editorState.content, parser])

  // Sync scroll between textarea and highlight layer
  useEffect(() => {
    const handleScroll = () => {
      if (textareaRef.current && highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
      }
    }

    const textarea = textareaRef.current
    if (textarea) {
      textarea.addEventListener('scroll', handleScroll, { passive: true })
      return () => textarea.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return

      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
        return
      }

      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
        return
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
        return
      }

      // Tab for indentation
      if (e.key === 'Tab') {
        e.preventDefault()
        handleTabIndentation(e.shiftKey)
        return
      }

      // Enter for smart newlines
      if (e.key === 'Enter') {
        handleSmartNewline(e)
        return
      }

      // Org-mode shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
            e.preventDefault()
            handleHeadlineShortcut(parseInt(e.key))
            break
          case 'l':
            e.preventDefault()
            handleInsertLink()
            break
          case 't':
            e.preventDefault()
            handleInsertTimestamp()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editorState, readOnly])

  const updateEditorState = (updateFn: (state: OrgModeState) => OrgModeState) => {
    setEditorState(prev => {
      const newState = updateFn(prev)
      
      // Trigger onChange callback if content changed
      if (newState.content !== prev.content) {
        onChange(newState.content).run().then(result => {
          if (result.isLeft()) {
            console.error('Editor change error:', result.value)
          }
        })
      }
      
      return newState
    })
  }

  const handleContentChange = useCallback((newContent: string) => {
    const textarea = textareaRef.current
    const cursorPos = textarea?.selectionStart ?? 0

    updateEditorState(state => {
      // Add to undo stack if content changed significantly
      const shouldAddToUndo = Math.abs(newContent.length - state.content.length) > 1 ||
        newContent !== state.content

      const newUndoStack = shouldAddToUndo && state.content !== newContent
        ? [...state.undoStack.slice(-49), state.content] // Keep last 50 states
        : state.undoStack

      return {
        ...state,
        content: newContent,
        cursorPosition: cursorPos,
        isDirty: true,
        undoStack: newUndoStack,
        redoStack: [], // Clear redo stack on new change
      }
    })
  }, [])

  const handleSave = async () => {
    if (onSave) {
      const result = await onSave(editorState.content).run()
      if (result.isRight()) {
        updateEditorState(state => ({
          ...state,
          isDirty: false,
          lastSaved: new Date(),
        }))
      } else {
        console.error('Save error:', result.value)
      }
    } else {
      // Use auto-save service
      await autoSaveHook.saveNow()
      updateEditorState(state => ({
        ...state,
        isDirty: false,
        lastSaved: new Date(),
      }))
    }
  }

  const handleUndo = () => {
    updateEditorState(state => {
      if (state.undoStack.length === 0) return state

      const previousContent = state.undoStack[state.undoStack.length - 1]!
      const newUndoStack = state.undoStack.slice(0, -1)
      const newRedoStack = [...state.redoStack, state.content]

      return {
        ...state,
        content: previousContent,
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        isDirty: true,
      }
    })
  }

  const handleRedo = () => {
    updateEditorState(state => {
      if (state.redoStack.length === 0) return state

      const nextContent = state.redoStack[state.redoStack.length - 1]!
      const newRedoStack = state.redoStack.slice(0, -1)
      const newUndoStack = [...state.undoStack, state.content]

      return {
        ...state,
        content: nextContent,
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        isDirty: true,
      }
    })
  }

  const handleTabIndentation = (shiftKey: boolean) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const content = editorState.content

    if (shiftKey) {
      // Decrease indentation
      const lineStart = content.lastIndexOf('\n', start - 1) + 1
      const line = content.slice(lineStart, content.indexOf('\n', start))
      
      if (line.startsWith('  ')) {
        const newContent = content.slice(0, lineStart) + 
          line.slice(2) + 
          content.slice(lineStart + line.length)
        handleContentChange(newContent)
      }
    } else {
      // Increase indentation
      const newContent = content.slice(0, start) + '  ' + content.slice(start)
      handleContentChange(newContent)
    }
  }

  const handleSmartNewline = (e: KeyboardEvent) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const content = editorState.content
    const lineStart = content.lastIndexOf('\n', start - 1) + 1
    const currentLine = content.slice(lineStart, start)

    // Auto-continue list items
    const listMatch = currentLine.match(/^(\s*)([-+*]|\d+[.)]\s+)/)
    if (listMatch) {
      e.preventDefault()
      const [, indent, marker] = listMatch
      const newContent = content.slice(0, start) + 
        '\n' + indent + marker + 
        content.slice(start)
      handleContentChange(newContent)
      
      // Set cursor position after the marker
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1 + indent!.length + marker!.length
      }, 0)
    }
  }

  const handleHeadlineShortcut = (level: number) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const content = editorState.content

    const stars = '*'.repeat(level)
    const selectedText = content.slice(start, end) || 'Headline'
    const newContent = content.slice(0, start) + 
      `${stars} ${selectedText}` + 
      content.slice(end)
    
    handleContentChange(newContent)
  }

  const handleInsertLink = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const content = editorState.content
    const selectedText = content.slice(start, end) || 'link text'

    const linkText = `[[url][${selectedText}]]`
    const newContent = content.slice(0, start) + linkText + content.slice(end)
    
    handleContentChange(newContent)
  }

  const handleInsertTimestamp = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const content = editorState.content
    const now = new Date()
    const timestamp = `<${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}>`

    const newContent = content.slice(0, start) + timestamp + content.slice(start)
    handleContentChange(newContent)
  }

  const renderHighlightedContent = (elements: readonly import('../../types/note.ts').OrgElement[], content: string): string => {
    if (elements.length === 0) {
      return escapeHtml(content)
    }

    let highlighted = content
    const replacements: Array<{ start: number; end: number; replacement: string }> = []

    // Sort elements by position to avoid conflicts
    const sortedElements = [...elements].sort((a, b) => a.startPosition - b.startPosition)

    for (const element of sortedElements) {
      const elementContent = content.slice(element.startPosition, element.endPosition)
      let replacement = ''

      switch (element.type) {
        case 'headline':
          replacement = `<span class="org-headline-${element.level || 1}">${escapeHtml(elementContent)}</span>`
          break
        case 'tag':
          replacement = elementContent.split(':').filter(Boolean)
            .map(tag => `<span class="org-tag">${escapeHtml(tag)}</span>`)
            .join('')
          break
        case 'timestamp':
          replacement = `<span class="org-timestamp">${escapeHtml(elementContent)}</span>`
          break
        case 'property':
          replacement = `<span class="org-property">${escapeHtml(elementContent)}</span>`
          break
        case 'drawer':
          replacement = `<span class="org-drawer">${escapeHtml(elementContent)}</span>`
          break
        case 'link':
          replacement = `<span class="org-link">${escapeHtml(elementContent)}</span>`
          break
        case 'code-block':
          if (element.properties?.inline === 'true') {
            replacement = `<span class="org-inline-code">${escapeHtml(elementContent)}</span>`
          } else {
            replacement = `<span class="org-code-block">${escapeHtml(elementContent)}</span>`
          }
          break
        default:
          replacement = escapeHtml(elementContent)
      }

      replacements.push({
        start: element.startPosition,
        end: element.endPosition,
        replacement,
      })
    }

    // Apply replacements in reverse order to maintain positions
    for (let i = replacements.length - 1; i >= 0; i--) {
      const { start, end, replacement } = replacements[i]!
      highlighted = highlighted.slice(0, start) + replacement + highlighted.slice(end)
    }

    return highlighted
  }

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  return (
    <div className="relative h-full flex flex-col bg-base-100">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-base-300">
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleSave}
            disabled={!editorState.isDirty}
            title="Save (Ctrl+S)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </button>
          
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleUndo}
            disabled={editorState.undoStack.length === 0}
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleRedo}
            disabled={editorState.redoStack.length === 0}
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-base-content/60">
          {/* Auto-save status */}
          {autoSave && noteId && (
            <AutoSaveStatusIndicator
              status={autoSaveHook.status}
              isAutoSaving={autoSaveHook.isAutoSaving}
              hasUnsavedChanges={autoSaveHook.hasUnsavedChanges}
              lastSaved={autoSaveHook.lastSaved}
            />
          )}
          
          {/* Manual save status */}
          {!autoSave && editorState.lastSaved && (
            <span>
              Saved {editorState.lastSaved.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}

          {parseError && (
            <span className="text-error" title={`Parse error: ${parseError}`}>
              ⚠️ Parse Error
            </span>
          )}
        </div>
      </div>

      {/* Editor Container */}
      <div className="relative flex-1 overflow-hidden">
        {/* Syntax Highlighting Layer */}
        <div
          ref={highlightRef}
          className="absolute inset-0 p-4 font-mono text-sm leading-6 pointer-events-none overflow-auto whitespace-pre-wrap break-words"
          style={{ color: 'transparent', zIndex: 1 }}
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
        />

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          className="absolute inset-0 w-full h-full p-4 bg-transparent resize-none outline-none font-mono text-sm leading-6 text-base-content placeholder-base-content/50"
          style={{ zIndex: 2 }}
          value={editorState.content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={readOnly ? '' : placeholder}
          readOnly={readOnly}
          spellCheck="false"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
        />
      </div>

      {/* Conflict Resolution Modal */}
      {showConflictModal && autoSaveHook.status.conflict && (
        <ConflictResolutionModal
          conflict={autoSaveHook.status.conflict}
          onResolve={async (resolution) => {
            await autoSaveHook.resolveConflict(resolution)
            setShowConflictModal(false)
          }}
          onCancel={() => {
            autoSaveHook.pauseAutoSave()
            setShowConflictModal(false)
          }}
        />
      )}
    </div>
  )
}