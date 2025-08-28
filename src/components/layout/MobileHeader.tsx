/**
 * Mobile Header Component
 * Primary navigation and context-aware actions with safe area support
 */

import React from 'react'
import { MobileHeaderProps } from '../../types/note.ts'

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  leftAction,
  rightAction,
  showBackButton = false,
  onBack,
}) => {
  const handleBackClick = async () => {
    if (onBack) {
      const result = await onBack().run()
      if (result.isLeft()) {
        console.error('Navigation error:', result.value)
        // Handle navigation error (could show toast, etc.)
      }
    }
  }

  const handleActionClick = async (action: () => TaskEither<ActionError, void>) => {
    const result = await action().run()
    if (result.isLeft()) {
      console.error('Action error:', result.value)
      // Handle action error
    }
  }

  return (
    <header className="safe-area-top sticky top-0 z-50" style={{backgroundColor: 'var(--bg-primary)', borderBottomColor: 'var(--border-secondary)'}}>
      <div className="apple-nav-bar px-4 flex items-center justify-between" style={{borderBottom: '0.5pt solid var(--border-secondary)'}}>
        {/* Left section */}
        <div className="flex items-center">
          {showBackButton ? (
            <button
              className="touch-target touch-feedback mr-2 flex items-center"
              onClick={handleBackClick}
              aria-label="Go back"
              style={{color: 'var(--kelly-green)', minHeight: '44pt', minWidth: '44pt', background: 'transparent', border: 'none', borderRadius: '8px'}}
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="metadata-text" style={{color: 'var(--kelly-green)'}}>Folders</span>
            </button>
          ) : leftAction ? (
            <button
              className="touch-target touch-feedback mr-2"
              onClick={() => handleActionClick(leftAction.onClick)}
              aria-label={leftAction.label}
              style={{color: 'var(--kelly-green)', minHeight: '44pt', minWidth: '44pt', background: 'transparent', border: 'none', borderRadius: '8px'}}
            >
              <svg className="w-6 h-6" style={{color: 'var(--text-primary)'}} dangerouslySetInnerHTML={{ __html: leftAction.icon }} />
            </button>
          ) : null}
        </div>

        {/* Center title - Apple Notes style */}
        <h1 className="note-title truncate mx-4 flex-1 text-center">
          {title}
        </h1>

        {/* Right section */}
        <div className="flex items-center">
          {rightAction && (
            <button
              className="touch-target touch-feedback"
              onClick={() => handleActionClick(rightAction.onClick)}
              aria-label={rightAction.label}
              style={{color: 'var(--kelly-green)', minHeight: '44pt', minWidth: '44pt', background: 'transparent', border: 'none', borderRadius: '8px'}}
            >
              <svg className="w-6 h-6" style={{color: 'var(--kelly-green)'}} dangerouslySetInnerHTML={{ __html: rightAction.icon }} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

// Common header actions for reuse
export const HeaderActions = {
  menu: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>',
    label: 'Open navigation menu',
  },
  search: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>',
    label: 'Search notes',
  },
  add: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>',
    label: 'Create new note',
  },
  more: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>',
    label: 'More options',
  },
  settings: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>',
    label: 'Settings',
  },
}

// Import types
import { ActionError } from '../../types/note.ts'
import { TaskEither } from '../../utils/task-either.ts'