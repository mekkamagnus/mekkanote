/**
 * Main Application Component
 * Entry point demonstrating the complete note-taking application
 */

import React, { useState, useEffect } from 'react'
import { MobileHeader, HeaderActions } from './components/layout/MobileHeader.tsx'
import { NavigationDrawer } from './components/navigation/NavigationDrawer.tsx'
import { NoteList } from './components/note/NoteList.tsx'
import { OrgModeEditor } from './components/editor/OrgModeEditor.tsx'
import { LoginForm } from './components/auth/LoginForm.tsx'
import { SecuritySettings } from './components/settings/SecuritySettings.tsx'
import { 
  useAppInitialization, 
  useNotes, 
  useNote, 
  useCreateNote, 
  useDeleteNote, 
  useFolders,
  useSearch
} from './hooks/useNotes.ts'
import { useAuth } from './hooks/useAuth.ts'
import { TaskEither } from './utils/task-either.ts'
import { ActionError, NoteCreateRequest, SearchQuery } from './types/note.ts'

interface AppState {
  readonly currentView: 'list' | 'editor' | 'search' | 'settings'
  readonly selectedNoteId: string | null
  readonly drawerOpen: boolean
  readonly searchQuery: string
}

export const App: React.FC = () => {
  // Authentication
  const { authState } = useAuth()

  // App initialization
  const { initialized, loading: initLoading, error: initError } = useAppInitialization()

  // App state
  const [state, setState] = useState<AppState>({
    currentView: 'list',
    selectedNoteId: null,
    drawerOpen: false,
    searchQuery: ''
  })

  // Folders
  const { folders, loading: foldersLoading } = useFolders()
  const [currentFolderId, setCurrentFolderId] = useState<string>('default')

  // Notes
  const { 
    notes, 
    loading: notesLoading, 
    error: notesError, 
    loadMore, 
    refresh: refreshNotes 
  } = useNotes(currentFolderId)

  // Selected note
  const { note, loading: noteLoading, saveNote } = useNote(state.selectedNoteId)

  // Note operations
  const { createNote } = useCreateNote()
  const { deleteNote } = useDeleteNote()
  
  // Search
  const { results: searchResults, loading: searchLoading, search, clearSearch } = useSearch()

  // Show loading during initialization
  if (initLoading || !initialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-base-100">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-kelly-green mb-4" />
          <h2 className="text-xl font-semibold text-base-content mb-2">
            {initLoading ? 'Initializing mekkanote...' : 'Loading...'}
          </h2>
          {initError && (
            <p className="text-error">{initError}</p>
          )}
        </div>
      </div>
    )
  }

  // Show authentication if not logged in
  if (!authState.isAuthenticated) {
    return <LoginForm onSuccess={() => {
      setState(prev => ({ ...prev, currentView: 'list' }))
    }} />
  }

  // Handle navigation actions
  const handleMenuClick = (): TaskEither<ActionError, void> =>
    TaskEither.tryCatch(
      async () => {
        setState(prev => ({ ...prev, drawerOpen: true }))
      },
      (error) => ({
        type: 'ui_error' as const,
        message: `Failed to open menu: ${(error as Error).message}`
      })
    )

  const handleSearchClick = (): TaskEither<ActionError, void> =>
    TaskEither.tryCatch(
      async () => {
        setState(prev => ({ 
          ...prev, 
          currentView: prev.currentView === 'search' ? 'list' : 'search'
        }))
        if (state.currentView === 'search') {
          clearSearch()
        }
      },
      (error) => ({
        type: 'ui_error' as const,
        message: `Failed to toggle search: ${(error as Error).message}`
      })
    )

  const handleCreateNoteClick = (): TaskEither<ActionError, void> =>
    TaskEither.tryCatch(
      async () => {
        const request: NoteCreateRequest = {
          title: 'New Note',
          content: '',
          folderId: currentFolderId,
          tags: []
        }
        
        const result = await createNote(request).run()
        if (result.isRight()) {
          setState(prev => ({
            ...prev,
            currentView: 'editor',
            selectedNoteId: result.value.id
          }))
          await refreshNotes().run()
        }
      },
      (error) => ({
        type: 'note_error' as const,
        message: `Failed to create note: ${(error as Error).message}`
      })
    )

  // Handle drawer actions
  const handleDrawerClose = (): TaskEither<ActionError, void> =>
    TaskEither.tryCatch(
      async () => {
        setState(prev => ({ ...prev, drawerOpen: false }))
      },
      (error) => ({
        type: 'ui_error' as const,
        message: `Failed to close drawer: ${(error as Error).message}`
      })
    )

  const handleFolderSelect = (folderId: string): TaskEither<ActionError, void> =>
    TaskEither.tryCatch(
      async () => {
        setCurrentFolderId(folderId)
        setState(prev => ({ 
          ...prev, 
          currentView: 'list',
          selectedNoteId: null,
          drawerOpen: false
        }))
      },
      (error) => ({
        type: 'ui_error' as const,
        message: `Failed to select folder: ${(error as Error).message}`
      })
    )

  // Handle note actions
  const handleNoteSelect = (noteId: string): TaskEither<ActionError, void> =>
    TaskEither.tryCatch(
      async () => {
        setState(prev => ({
          ...prev,
          currentView: 'editor',
          selectedNoteId: noteId
        }))
      },
      (error) => ({
        type: 'note_error' as const,
        message: `Failed to select note: ${(error as Error).message}`
      })
    )

  const handleNoteDelete = (noteId: string): TaskEither<ActionError, void> =>
    TaskEither.tryCatch(
      async () => {
        const result = await deleteNote(noteId).run()
        if (result.isRight()) {
          await refreshNotes().run()
          if (state.selectedNoteId === noteId) {
            setState(prev => ({
              ...prev,
              currentView: 'list',
              selectedNoteId: null
            }))
          }
        }
      },
      (error) => ({
        type: 'note_error' as const,
        message: `Failed to delete note: ${(error as Error).message}`
      })
    )

  const handleNoteShare = (noteId: string): TaskEither<ActionError, void> =>
    TaskEither.tryCatch(
      async () => {
        // Simplified share implementation - would use Web Share API
        const noteToShare = notes.find(n => n.id === noteId)
        if (noteToShare && navigator.share) {
          await navigator.share({
            title: noteToShare.title,
            text: noteToShare.preview,
            url: window.location.href
          })
        } else {
          // Fallback: copy to clipboard
          const text = noteToShare ? `${noteToShare.title}\n\n${noteToShare.content}` : ''
          await navigator.clipboard.writeText(text)
        }
      },
      (error) => ({
        type: 'share_error' as const,
        message: `Failed to share note: ${(error as Error).message}`
      })
    )

  // Handle back navigation
  const handleBack = (): TaskEither<ActionError, void> =>
    TaskEither.tryCatch(
      async () => {
        if (state.currentView === 'editor') {
          setState(prev => ({
            ...prev,
            currentView: 'list',
            selectedNoteId: null
          }))
        } else if (state.currentView === 'search') {
          setState(prev => ({ ...prev, currentView: 'list' }))
          clearSearch()
        }
      },
      (error) => ({
        type: 'ui_error' as const,
        message: `Failed to navigate back: ${(error as Error).message}`
      })
    )

  // Handle search
  const handleSearchSubmit = (query: string) => {
    if (query.trim().length >= 2) {
      const searchQuery: SearchQuery = {
        term: query.trim(),
        includeContent: true,
        includeTags: true,
        folderId: currentFolderId
      }
      search(searchQuery)
    }
  }

  // Get current view title
  const getTitle = (): string => {
    switch (state.currentView) {
      case 'editor':
        return note?.title || 'Loading...'
      case 'search':
        return 'Search Notes'
      case 'settings':
        return 'Security Settings'
      case 'list':
      default:
        const folder = folders.find(f => f.id === currentFolderId)
        return folder?.name || 'Notes'
    }
  }

  // Get current view actions
  const getLeftAction = () => {
    switch (state.currentView) {
      case 'list':
        return {
          ...HeaderActions.menu,
          onClick: handleMenuClick
        }
      default:
        return null
    }
  }

  const getRightAction = () => {
    switch (state.currentView) {
      case 'list':
        return state.searchQuery ? null : {
          ...HeaderActions.add,
          onClick: handleCreateNoteClick
        }
      case 'search':
        return {
          ...HeaderActions.search,
          onClick: handleSearchClick
        }
      default:
        return null
    }
  }

  return (
    <div className="h-screen bg-base-100 flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader
        title={getTitle()}
        leftAction={getLeftAction()}
        rightAction={getRightAction()}
        showBackButton={state.currentView !== 'list'}
        onBack={state.currentView !== 'list' ? handleBack : undefined}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Drawer */}
        <NavigationDrawer
          isOpen={state.drawerOpen}
          onClose={handleDrawerClose}
          folders={folders}
          currentFolder={currentFolderId}
          onFolderSelect={handleFolderSelect}
          onSettingsSelect={() => 
            TaskEither.tryCatch(
              async () => {
                setState(prev => ({ 
                  ...prev, 
                  currentView: 'settings',
                  drawerOpen: false
                }))
              },
              (error) => ({
                type: 'ui_error' as const,
                message: `Failed to open settings: ${(error as Error).message}`
              })
            )
          }
        />

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {state.currentView === 'list' && (
            <NoteList
              notes={notes}
              onNoteSelect={handleNoteSelect}
              onNoteDelete={handleNoteDelete}
              onNoteShare={handleNoteShare}
              loading={notesLoading}
              hasMore={false} // Simplified for demo
              onLoadMore={loadMore}
            />
          )}

          {state.currentView === 'search' && (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-base-300">
                <div className="form-control">
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Search notes..."
                      className="input input-bordered flex-1"
                      value={state.searchQuery}
                      onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchSubmit(state.searchQuery)
                        }
                      }}
                    />
                    <button
                      className="btn btn-square"
                      onClick={() => handleSearchSubmit(state.searchQuery)}
                      disabled={searchLoading || state.searchQuery.trim().length < 2}
                    >
                      {searchLoading ? (
                        <div className="loading loading-spinner loading-xs" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {searchResults && (
                <NoteList
                  notes={searchResults.notes}
                  onNoteSelect={handleNoteSelect}
                  onNoteDelete={handleNoteDelete}
                  onNoteShare={handleNoteShare}
                  loading={searchLoading}
                  hasMore={false}
                />
              )}

              {!searchResults && !searchLoading && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-base-content/70">
                    <div className="w-16 h-16 mx-auto mb-4 opacity-50">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p>Enter at least 2 characters to search</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {state.currentView === 'editor' && note && (
            <OrgModeEditor
              noteId={note.id}
              initialContent={note.content}
              onContentChange={(content) => {
                // Content changes are handled by auto-save hook
              }}
              placeholder="Start writing your note..."
              autoSave={true}
              debounceMs={2000}
            />
          )}

          {state.currentView === 'editor' && !note && noteLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="loading loading-spinner loading-lg text-kelly-green" />
            </div>
          )}

          {state.currentView === 'settings' && (
            <SecuritySettings
              onClose={() => setState(prev => ({ ...prev, currentView: 'list' }))}
            />
          )}
        </main>
      </div>

      {/* Error Toast - Simple implementation */}
      {(notesError || initError) && (
        <div className="toast toast-end">
          <div className="alert alert-error">
            <span>{notesError || initError}</span>
          </div>
        </div>
      )}
    </div>
  )
}