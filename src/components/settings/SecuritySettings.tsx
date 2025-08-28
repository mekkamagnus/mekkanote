/**
 * Security Settings Component
 * Password management, backup, and security configuration
 */

import React, { useState, useRef } from 'react'
import { useAuth, usePasswordValidation } from '../../hooks/useAuth.ts'

interface SecuritySettingsProps {
  readonly onClose?: () => void
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ onClose }) => {
  const { authState, changePassword, exportBackup, importBackup, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'password' | 'backup' | 'session'>('password')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const { 
    password: newPassword, 
    setPassword: setNewPassword,
    confirmPassword,
    setConfirmPassword,
    validation
  } = usePasswordValidation()
  
  // Backup state
  const [backupPassword, setBackupPassword] = useState('')
  const [backupData, setBackupData] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const showMessage = (message: string, isError: boolean = false) => {
    if (isError) {
      setErrorMessage(message)
      setSuccessMessage('')
    } else {
      setSuccessMessage(message)
      setErrorMessage('')
    }
    
    setTimeout(() => {
      setSuccessMessage('')
      setErrorMessage('')
    }, 5000)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validation.isValid) return

    setIsChangingPassword(true)
    
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showMessage('Password changed successfully')
    } catch (error) {
      showMessage((error as Error).message, true)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleExportBackup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!backupPassword.trim()) return

    setIsExporting(true)
    
    try {
      const result = await exportBackup(backupPassword).run({} as any)
      
      if (result.isLeft()) {
        throw new Error(result.value.message)
      }

      // Create download
      const blob = new Blob([result.value], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mekkanote-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setBackupPassword('')
      showMessage('Backup exported successfully')
    } catch (error) {
      showMessage((error as Error).message, true)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportBackup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!importFile || !backupPassword.trim()) return

    setIsImporting(true)
    
    try {
      const backupContent = await importFile.text()
      const result = await importBackup(backupContent, backupPassword).run({} as any)
      
      if (result.isLeft()) {
        throw new Error(result.value.message)
      }

      setImportFile(null)
      setBackupPassword('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      showMessage('Backup imported successfully')
    } catch (error) {
      showMessage((error as Error).message, true)
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/json') {
      setImportFile(file)
    }
  }

  const formatSessionExpiry = (date: Date): string => {
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes <= 0) return 'Expired'
    if (diffMinutes < 60) return `${diffMinutes} minutes`
    
    const diffHours = Math.floor(diffMinutes / 60)
    const remainingMinutes = diffMinutes % 60
    
    return remainingMinutes > 0 
      ? `${diffHours}h ${remainingMinutes}m`
      : `${diffHours} hours`
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Security Settings</h2>
          <p className="text-base-content/70">Manage your account security and data protection</p>
        </div>
        {onClose && (
          <button className="btn btn-ghost btn-square" onClick={onClose}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="alert alert-success mb-4">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error mb-4">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs tabs-bordered mb-6">
        <button
          className={`tab tab-lg ${activeTab === 'password' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          Password
        </button>
        <button
          className={`tab tab-lg ${activeTab === 'backup' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          Backup & Restore
        </button>
        <button
          className={`tab tab-lg ${activeTab === 'session' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('session')}
        >
          Session
        </button>
      </div>

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Change Password</h3>
              <p className="text-base-content/70 mb-4">
                Update your password to keep your account secure. Choose a strong password.
              </p>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isChangingPassword}
                    required
                  />
                </div>

                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isChangingPassword}
                    required
                  />
                  {validation.strength.feedback.length > 0 && (
                    <div className="mt-2 text-sm text-base-content/60">
                      <p className="mb-1">Password requirements:</p>
                      <ul className="space-y-1">
                        {validation.strength.feedback.map((feedback, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="text-warning">•</span>
                            {feedback}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    className={`input input-bordered w-full ${
                      !validation.match ? 'input-error' : ''
                    }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isChangingPassword}
                    required
                  />
                  {!validation.match && confirmPassword && (
                    <p className="text-error text-sm mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!validation.isValid || isChangingPassword}
                >
                  {isChangingPassword && <div className="loading loading-spinner loading-xs mr-2" />}
                  Change Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Export Backup */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Export Backup</h3>
              <p className="text-base-content/70 mb-4">
                Create an encrypted backup of all your notes. The backup will be protected with a password.
              </p>

              <form onSubmit={handleExportBackup} className="space-y-4">
                <div>
                  <label className="label">Backup Password</label>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    placeholder="Enter a strong password for the backup"
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    disabled={isExporting}
                    required
                  />
                  <p className="text-xs text-base-content/60 mt-1">
                    This password will be needed to restore the backup. Keep it safe!
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!backupPassword.trim() || isExporting}
                >
                  {isExporting && <div className="loading loading-spinner loading-xs mr-2" />}
                  Export Backup
                </button>
              </form>
            </div>
          </div>

          {/* Import Backup */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Import Backup</h3>
              <p className="text-base-content/70 mb-4">
                Restore notes from an encrypted backup file. This will merge with your existing notes.
              </p>

              <form onSubmit={handleImportBackup} className="space-y-4">
                <div>
                  <label className="label">Backup File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="file-input file-input-bordered w-full"
                    onChange={handleFileSelect}
                    disabled={isImporting}
                  />
                </div>

                <div>
                  <label className="label">Backup Password</label>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    placeholder="Enter the backup password"
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    disabled={isImporting}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!importFile || !backupPassword.trim() || isImporting}
                >
                  {isImporting && <div className="loading loading-spinner loading-xs mr-2" />}
                  Import Backup
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Session Tab */}
      {activeTab === 'session' && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Session Information</h3>
              <p className="text-base-content/70 mb-4">
                Manage your current authentication session.
              </p>

              <div className="space-y-4">
                <div className="stats shadow">
                  <div className="stat">
                    <div className="stat-title">User ID</div>
                    <div className="stat-value text-lg">{authState.userId}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Session Status</div>
                    <div className="stat-value text-lg">
                      {authState.isAuthenticated ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Time Remaining</div>
                    <div className="stat-value text-lg">
                      {authState.sessionExpiresAt 
                        ? formatSessionExpiry(authState.sessionExpiresAt)
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>

                <div className="alert alert-info">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">Security Notice</p>
                    <p className="text-sm">
                      Your session will automatically expire after 30 minutes of inactivity. 
                      Activity is tracked when you interact with notes.
                    </p>
                  </div>
                </div>

                <button
                  className="btn btn-error"
                  onClick={logout}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}