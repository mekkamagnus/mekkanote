/**
 * Conflict Resolution Modal Component
 * Handle merge conflicts from auto-save system
 */

import React, { useState } from 'react'
import { ConflictResolutionData } from '../../services/AutoSaveService.ts'

interface ConflictInfo {
  readonly noteId: string
  readonly localVersion: number
  readonly serverVersion: number
  readonly localContent: string
  readonly serverContent: string
  readonly timestamp: Date
}

interface ConflictResolutionModalProps {
  readonly conflict: ConflictInfo
  readonly onResolve: (resolution: ConflictResolutionData) => Promise<void>
  readonly onCancel: () => void
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  onResolve,
  onCancel,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<'local_wins' | 'server_wins' | 'manual_merge'>('local_wins')
  const [mergedContent, setMergedContent] = useState(conflict.localContent)
  const [isResolving, setIsResolving] = useState(false)
  const [showDiff, setShowDiff] = useState(false)

  const handleResolve = async () => {
    setIsResolving(true)
    
    try {
      const resolution: ConflictResolutionData = {
        strategy: selectedStrategy,
        mergedContent: selectedStrategy === 'manual_merge' ? mergedContent : undefined
      }
      
      await onResolve(resolution)
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
    } finally {
      setIsResolving(false)
    }
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleString()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-xl font-semibold text-base-content">
            Resolve Editing Conflict
          </h2>
          <button
            className="btn btn-ghost btn-square btn-sm"
            onClick={onCancel}
            disabled={isResolving}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {/* Conflict Info */}
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="font-medium text-amber-800 dark:text-amber-200">
                  Conflicting changes detected
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Your local changes conflict with newer changes saved at {formatTime(conflict.timestamp)}.
                </p>
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Local version: {conflict.localVersion} • Server version: {conflict.serverVersion}
                </div>
              </div>
            </div>
          </div>

          {/* Resolution Strategy */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-base-content mb-3">
              Choose resolution strategy:
            </h3>
            
            <div className="space-y-3">
              {/* Keep local changes */}
              <label className="flex items-start gap-3 p-3 border border-base-300 rounded cursor-pointer hover:bg-base-50">
                <input
                  type="radio"
                  name="strategy"
                  value="local_wins"
                  checked={selectedStrategy === 'local_wins'}
                  onChange={(e) => setSelectedStrategy(e.target.value as 'local_wins')}
                  className="radio radio-primary mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-base-content">Keep my changes</div>
                  <div className="text-sm text-base-content/70">
                    Overwrite the server version with your local changes
                  </div>
                </div>
              </label>

              {/* Keep server changes */}
              <label className="flex items-start gap-3 p-3 border border-base-300 rounded cursor-pointer hover:bg-base-50">
                <input
                  type="radio"
                  name="strategy"
                  value="server_wins"
                  checked={selectedStrategy === 'server_wins'}
                  onChange={(e) => setSelectedStrategy(e.target.value as 'server_wins')}
                  className="radio radio-primary mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-base-content">Use server version</div>
                  <div className="text-sm text-base-content/70">
                    Discard your local changes and use the server version
                  </div>
                </div>
              </label>

              {/* Manual merge */}
              <label className="flex items-start gap-3 p-3 border border-base-300 rounded cursor-pointer hover:bg-base-50">
                <input
                  type="radio"
                  name="strategy"
                  value="manual_merge"
                  checked={selectedStrategy === 'manual_merge'}
                  onChange={(e) => setSelectedStrategy(e.target.value as 'manual_merge')}
                  className="radio radio-primary mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-base-content">Manual merge</div>
                  <div className="text-sm text-base-content/70">
                    Combine both versions manually
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Manual merge editor */}
          {selectedStrategy === 'manual_merge' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-base-content">Merged content:</h4>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => setShowDiff(!showDiff)}
                >
                  {showDiff ? 'Hide' : 'Show'} diff
                </button>
              </div>
              
              {showDiff && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 className="text-sm font-medium text-base-content mb-2">Your version:</h5>
                    <div className="bg-base-200 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{conflict.localContent}</pre>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-base-content mb-2">Server version:</h5>
                    <div className="bg-base-200 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{conflict.serverContent}</pre>
                    </div>
                  </div>
                </div>
              )}

              <textarea
                className="textarea textarea-bordered w-full h-48 font-mono text-sm"
                value={mergedContent}
                onChange={(e) => setMergedContent(e.target.value)}
                placeholder="Edit the merged content here..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-base-300">
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isResolving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleResolve}
            disabled={isResolving || (selectedStrategy === 'manual_merge' && !mergedContent.trim())}
          >
            {isResolving && <div className="loading loading-spinner loading-xs mr-2" />}
            Resolve Conflict
          </button>
        </div>
      </div>
    </div>
  )
}