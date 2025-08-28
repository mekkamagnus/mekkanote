/**
 * Note List Component
 * Virtual scrolling list with swipe actions and search highlighting
 */

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { NoteListProps, Note } from '../../types/note.ts'

interface VirtualListItem {
  note: Note
  index: number
  height: number
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  onNoteSelect,
  onCreateNote,
  loading = false,
  hasMore = false,
  onLoadMore,
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })
  const [swipeStates, setSwipeStates] = useState<Record<string, { x: number; active: boolean }>>({})
  const listRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const ITEM_HEIGHT = 80
  const OVERSCAN = 5

  // Virtual scrolling calculation
  const virtualItems = useMemo(() => {
    const items: VirtualListItem[] = []
    const start = Math.max(0, visibleRange.start - OVERSCAN)
    const end = Math.min(notes.length, visibleRange.end + OVERSCAN)

    for (let i = start; i < end; i++) {
      items.push({
        note: notes[i]!,
        index: i,
        height: ITEM_HEIGHT,
      })
    }

    return items
  }, [notes, visibleRange])

  // Handle scroll for virtual scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return

      const scrollTop = listRef.current.scrollTop
      const containerHeight = listRef.current.clientHeight

      const start = Math.floor(scrollTop / ITEM_HEIGHT)
      const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT)
      const end = start + visibleCount

      setVisibleRange({ start, end })
    }

    const listElement = listRef.current
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      if (listElement) {
        listElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  // Intersection observer for infinite loading
  useEffect(() => {
    if (!hasMore || !onLoadMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loading) {
            handleLoadMore()
          }
        })
      },
      { threshold: 0.1 }
    )

    observerRef.current = observer
    return () => observer.disconnect()
  }, [hasMore, onLoadMore, loading])

  const handleLoadMore = async () => {
    if (!onLoadMore) return
    
    const result = await onLoadMore().run()
    if (result.isLeft()) {
      console.error('Load more error:', result.value)
    }
  }

  const handleNoteClick = async (noteId: string) => {
    const result = await onNoteSelect(noteId).run()
    if (result.isLeft()) {
      console.error('Note selection error:', result.value)
    }
  }

  const handleSwipeStart = (noteId: string, clientX: number) => {
    setSwipeStates(prev => ({
      ...prev,
      [noteId]: { x: clientX, active: true }
    }))
  }

  const handleSwipeMove = (noteId: string, clientX: number) => {
    const state = swipeStates[noteId]
    if (!state?.active) return

    const deltaX = clientX - state.x
    if (Math.abs(deltaX) > 10) {
      setSwipeStates(prev => ({
        ...prev,
        [noteId]: { ...state, x: clientX }
      }))
    }
  }

  const handleSwipeEnd = async (noteId: string, clientX: number) => {
    const state = swipeStates[noteId]
    if (!state?.active) return

    const deltaX = clientX - state.x
    const threshold = 80

    if (Math.abs(deltaX) > threshold) {
      // Swipe gesture detected, but no action buttons - just reset position
    }

    setSwipeStates(prev => {
      const newState = { ...prev }
      delete newState[noteId]
      return newState
    })
  }

  const formatDate = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const truncatePreview = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
  }

  if (notes.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" style={{backgroundColor: 'var(--bg-primary)'}}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4" style={{color: 'var(--text-tertiary)', opacity: '0.5'}}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
          </div>
          <h3 className="section-header" style={{marginBottom: '8px'}}>No notes in this folder</h3>
          <p className="note-preview" style={{marginBottom: '16px', textAlign: 'center'}}>Tap the ✏️ button to create<br />your first note</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{backgroundColor: 'var(--bg-primary)'}}>
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Apple Notes folder title and status */}
        <div className="px-4 py-3" style={{backgroundColor: 'var(--bg-primary)'}}>
          <h1 className="nav-header">All iCloud</h1>
        </div>
        
        {/* Pull to refresh indicator */}
        {loading && (
          <div className="p-4 text-center">
            <div className="loading loading-spinner loading-sm mr-2" style={{color: 'var(--kelly-green)'}} />
            <span className="metadata-text">Loading notes...</span>
          </div>
        )}
        
        {/* Pinned Section */}
        {notes.some(note => note.isPinned) && (
          <div className="px-4 py-2">
            <div className="section-header" style={{fontSize: '1.125rem', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              Pinned
              <svg className="w-4 h-4" style={{color: 'var(--text-tertiary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Today Section */}
        <div className="px-4 py-2">
          <div className="section-header" style={{fontSize: '1.125rem', marginBottom: '12px'}}>Today</div>
        </div>

        {/* Virtual list container */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto"
          style={{ height: '100%' }}
        >
          {/* Total height spacer for virtual scrolling */}
          <div style={{ height: notes.length * ITEM_HEIGHT, backgroundColor: 'var(--bg-primary)' }}>
            {/* Visible items */}
            {virtualItems.map(({ note, index }) => {
              const swipeState = swipeStates[note.id]
              const swipeOffset = swipeState ? swipeState.x - (swipeState.active ? swipeState.x : 0) : 0

              return (
                <div
                  key={note.id}
                  className="absolute w-full"
                  style={{
                    top: index * ITEM_HEIGHT,
                    height: ITEM_HEIGHT,
                    transform: `translateX(${swipeOffset}px)`,
                    transition: swipeState?.active ? 'none' : 'transform 0.2s ease-out',
                  }}
                  onTouchStart={(e) => handleSwipeStart(note.id, e.touches[0]?.clientX ?? 0)}
                  onTouchMove={(e) => handleSwipeMove(note.id, e.touches[0]?.clientX ?? 0)}
                  onTouchEnd={(e) => handleSwipeEnd(note.id, e.changedTouches[0]?.clientX ?? 0)}
                >

                  {/* Apple Notes style note item */}
                  <div
                    className="note-item h-full flex items-start cursor-pointer transition-colors touch-feedback px-4"
                    onClick={() => handleNoteClick(note.id)}
                    style={{backgroundColor: 'var(--bg-grouped)', borderBottomColor: 'var(--border-secondary)'}}
                  >
                    <div className="flex-1 min-w-0 py-3">
                      {/* Title and timestamp line */}
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="note-title truncate mr-2">
                          {note.title || 'Untitled Note'}
                        </h3>
                        <time className="metadata-text flex-shrink-0">
                          {formatDate(note.lastModified)}
                        </time>
                      </div>
                      
                      {/* Preview and metadata line */}
                      <div className="flex items-start justify-between mb-2">
                        <p className="note-preview line-clamp-2 mr-2 flex-1">
                          {truncatePreview(note.preview)}
                        </p>
                      </div>

                      {/* Tags and folder line */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          {note.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              {note.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="org-tag"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {note.tags.length > 2 && (
                                <span className="metadata-text">
                                  +{note.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {note.hasAttachments && (
                            <svg className="w-4 h-4" style={{color: 'var(--text-tertiary)'}} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        
                        <div className="metadata-text ml-2">
                          📁 All iCloud
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load more trigger */}
          {hasMore && onLoadMore && (
            <div
              ref={(el) => {
                if (el && observerRef.current) {
                  observerRef.current.observe(el)
                }
              }}
              className="h-10 flex items-center justify-center"
              style={{backgroundColor: 'var(--bg-primary)'}}
            >
              {loading ? (
                <div className="loading loading-spinner loading-sm" style={{color: 'var(--kelly-green)'}} />
              ) : (
                <span className="metadata-text">Load more...</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Footer - Apple Notes style (outside scrollable area) */}
      <div className="flex-shrink-0 px-4 py-3 border-t flex items-center justify-between" style={{borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-primary)', position: 'fixed', bottom: 0, left: 0, right: 0}}>
        <span className="metadata-text">{notes.length} Notes</span>
        <button 
          className="touch-target" 
          style={{color: 'var(--kelly-green)'}} 
          aria-label="Create new note"
          onClick={() => onCreateNote && onCreateNote().run()}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}