/**
 * Navigation Drawer Component
 * Main application navigation with folder hierarchy and settings
 */

import React, { useEffect, useRef } from 'react'
import { NavigationDrawerProps } from '../../types/note.ts'

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  folders,
  currentFolder,
  onFolderSelect,
  onSettingsSelect,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Handle ESC key and outside clicks
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(e.target as Node) &&
        backdropRef.current?.contains(e.target as Node)
      ) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden' // Prevent scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  // Handle swipe gesture for close
  useEffect(() => {
    let startX = 0
    let currentX = 0
    let isDragging = false

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0]?.clientX ?? 0
      isDragging = true
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      currentX = e.touches[0]?.clientX ?? 0
      
      const deltaX = currentX - startX
      if (deltaX < -50) { // Swipe left threshold
        e.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      if (!isDragging) return
      
      const deltaX = currentX - startX
      if (deltaX < -50) { // Swipe left to close
        handleClose()
      }
      
      isDragging = false
      startX = 0
      currentX = 0
    }

    const drawer = drawerRef.current
    if (drawer && isOpen) {
      drawer.addEventListener('touchstart', handleTouchStart, { passive: false })
      drawer.addEventListener('touchmove', handleTouchMove, { passive: false })
      drawer.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      if (drawer) {
        drawer.removeEventListener('touchstart', handleTouchStart)
        drawer.removeEventListener('touchmove', handleTouchMove)
        drawer.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isOpen])

  const handleClose = async () => {
    const result = await onClose().run()
    if (result.isLeft()) {
      console.error('Navigation close error:', result.value)
    }
  }

  const handleFolderClick = async (folderId: string) => {
    const result = await onFolderSelect(folderId).run()
    if (result.isLeft()) {
      console.error('Folder selection error:', result.value)
      return
    }
    // Close drawer after successful folder selection on mobile
    if (window.innerWidth < 768) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className={`fixed inset-0 bg-black transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backdropFilter: 'blur(4px)' }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed left-0 top-0 h-full w-80 max-w-[80vw] shadow-xl
          transform transition-transform duration-300 ease-out overflow-y-auto
          lg:relative lg:w-64 lg:shadow-none lg:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{backgroundColor: 'var(--bg-primary)'}}
      >
        {/* Header - Apple Notes style navigation */}
        <div className="apple-nav-bar flex items-center justify-between px-4 border-b" style={{borderColor: 'var(--border-secondary)'}}>
          <h2 className="nav-header">Folders</h2>
          <button
            className="btn btn-ghost btn-square btn-sm lg:hidden"
            onClick={handleClose}
            aria-label="Close navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Content - Apple Notes folder list layout */}
        <nav className="flex-1" style={{backgroundColor: 'var(--bg-primary)'}}>
          {/* Quick Notes Section */}
          <div className="px-4 py-3">
            <button 
              className="folder-item w-full flex items-center touch-feedback"
              style={{background: 'var(--bg-grouped)', borderRadius: '8px', marginBottom: '8px'}}
            >
              <div className="folder-item-icon">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <span className="folder-name flex-1 text-left">Quick Notes</span>
              <span className="folder-count">1</span>
              <svg className="w-5 h-5 ml-2" style={{color: 'var(--text-tertiary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button 
              className="folder-item w-full flex items-center touch-feedback"
              style={{background: 'var(--bg-grouped)', borderRadius: '8px'}}
            >
              <div className="folder-item-icon">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <span className="folder-name flex-1 text-left">Shared</span>
              <span className="folder-count">80</span>
              <svg className="w-5 h-5 ml-2" style={{color: 'var(--text-tertiary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* iCloud Section */}
          <div className="px-4 py-3">
            <div className="section-header" style={{fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              iCloud
              <svg className="w-4 h-4" style={{color: 'var(--text-tertiary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            <div className="space-y-2">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  className={`folder-item w-full flex items-center touch-feedback ${
                    currentFolder === folder.id ? 'folder-item-active' : ''
                  }`}
                  style={{
                    background: currentFolder === folder.id 
                      ? 'color-mix(in srgb, var(--kelly-green) 10%, var(--bg-grouped))'
                      : 'var(--bg-grouped)', 
                    borderRadius: '8px',
                    color: currentFolder === folder.id ? 'var(--kelly-green)' : 'var(--text-primary)'
                  }}
                  onClick={() => handleFolderClick(folder.id)}
                >
                  <div className={`folder-item-icon ${folder.id === 'personal' ? 'user-folder' : ''}`}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
                      <path d={getFolderIcon(folder.icon)} />
                    </svg>
                  </div>
                  <span className="folder-name flex-1 text-left truncate">{folder.name}</span>
                  <span className="folder-count mr-2">{folder.noteCount}</span>
                  <svg className="w-4 h-4" style={{color: 'var(--text-tertiary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

        </nav>

        {/* Footer */}
        <div className="p-4 border-t" style={{borderColor: 'var(--border-secondary)'}}>
          <button 
            className="folder-item w-full flex items-center touch-feedback"
            style={{background: 'var(--bg-grouped)', borderRadius: '8px'}}
            onClick={async () => {
              if (onSettingsSelect) {
                const result = await onSettingsSelect().run()
                if (result.isLeft()) {
                  console.error('Settings navigation error:', result.value)
                }
              }
            }}
          >
            <div className="folder-item-icon">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="folder-name flex-1 text-left">Security Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper function to get folder icons
function getFolderIcon(iconName: string): string {
  const icons: Record<string, string> = {
    folder: 'M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z',
    archive: 'M4 7v10c0 2.21 3.79 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.79 4 8 4s8-1.79 8-4M4 7c0-2.21 3.79-4 8-4s8 1.79 8 4',
    star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  }
  return icons[iconName] ?? icons.folder
}