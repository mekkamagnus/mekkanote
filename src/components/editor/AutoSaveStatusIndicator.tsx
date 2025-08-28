/**
 * Auto-Save Status Indicator Component
 * Visual feedback for auto-save status
 */

import React from 'react'
import { AutoSaveStatus } from '../../services/AutoSaveService.ts'

interface AutoSaveStatusIndicatorProps {
  readonly status: AutoSaveStatus
  readonly isAutoSaving: boolean
  readonly hasUnsavedChanges: boolean
  readonly lastSaved: Date | null
}

export const AutoSaveStatusIndicator: React.FC<AutoSaveStatusIndicatorProps> = ({
  status,
  isAutoSaving,
  hasUnsavedChanges,
  lastSaved,
}) => {
  // Helper function to format time
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Render based on status
  switch (status.status) {
    case 'pending':
    case 'retrying':
      return (
        <span className="flex items-center gap-1 text-amber-600">
          <div className="loading loading-spinner loading-xs" />
          {status.status === 'pending' ? 'Auto-saving...' : `Retrying... (${status.retryAttempt}/${3})`}
        </span>
      )

    case 'conflict':
      return (
        <span className="flex items-center gap-1 text-red-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Conflict detected
        </span>
      )

    case 'error':
      return (
        <span className="flex items-center gap-1 text-error">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Auto-save failed
        </span>
      )

    case 'saved':
    default:
      if (isAutoSaving) {
        return (
          <span className="flex items-center gap-1 text-amber-600">
            <div className="loading loading-spinner loading-xs" />
            Saving...
          </span>
        )
      }

      if (hasUnsavedChanges) {
        return (
          <span className="flex items-center gap-1 text-base-content/60">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Unsaved changes
          </span>
        )
      }

      if (lastSaved) {
        return (
          <span className="flex items-center gap-1 text-green-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Saved {formatTime(lastSaved)}
          </span>
        )
      }

      return (
        <span className="text-base-content/40">
          Auto-save enabled
        </span>
      )
  }
}