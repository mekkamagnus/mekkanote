/**
 * Authentication and Security React Hook
 * Manages user authentication, session, and security features
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { SecureNoteService } from '../services/SecureNoteService.ts'
import { CryptoService, createCryptoDependencies } from '../services/CryptoService.ts'
import { createFileSystemAdapter } from '../services/FileSystemAdapter.ts'
import { createCacheAdapter } from '../services/CacheAdapter.ts'
import { TaskEither } from '../utils/task-either.ts'
import { 
  SecurityError, 
  SecurityConfig, 
  UserCredentials,
  Note,
  NoteCreateRequest,
  NoteUpdateRequest
} from '../types/note.ts'

interface AuthState {
  readonly isAuthenticated: boolean
  readonly isLoading: boolean
  readonly error: string | null
  readonly userId: string | null
  readonly sessionExpiresAt: Date | null
}

interface UseAuthResult {
  readonly authState: AuthState
  readonly login: (credentials: UserCredentials) => Promise<void>
  readonly logout: () => Promise<void>
  readonly changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  readonly checkPasswordStrength: (password: string) => { score: number; feedback: string[]; isStrong: boolean }
  readonly extendSession: () => Promise<void>
  readonly createSecureNote: (request: NoteCreateRequest) => TaskEither<SecurityError, Note>
  readonly updateSecureNote: (id: string, updates: NoteUpdateRequest) => TaskEither<SecurityError, Note>
  readonly getSecureNote: (id: string) => TaskEither<SecurityError, Note>
  readonly getSecureNotes: () => TaskEither<SecurityError, readonly Note[]>
  readonly exportBackup: (password: string) => TaskEither<SecurityError, string>
  readonly importBackup: (backupData: string, password: string) => TaskEither<SecurityError, void>
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  encryptionEnabled: true,
  passwordMinLength: 12,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  keyDerivationIterations: 100000,
  backupEncryption: true
}

export function useAuth(config: Partial<SecurityConfig> = {}): UseAuthResult {
  const securityConfig = { ...DEFAULT_SECURITY_CONFIG, ...config }
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    userId: null,
    sessionExpiresAt: null
  })

  const userSessionRef = useRef<any>(null)
  const depsRef = useRef<any>(null)
  const sessionCheckInterval = useRef<number | null>(null)

  // Initialize dependencies
  useEffect(() => {
    const basePath = './mekkanote-data'
    const cryptoDeps = createCryptoDependencies()
    
    depsRef.current = {
      fs: createFileSystemAdapter(),
      cache: createCacheAdapter(),
      basePath,
      indexPath: `${basePath}/index.json`,
      security: securityConfig,
      userSession: {
        userId: '',
        sessionKey: null,
        isAuthenticated: false,
        lastActivity: new Date(),
        sessionTimeout: securityConfig.sessionTimeout
      },
      ...cryptoDeps
    }
  }, [])

  // Session monitoring
  useEffect(() => {
    if (authState.isAuthenticated) {
      sessionCheckInterval.current = setInterval(() => {
        checkSessionValidity()
      }, 60000) as unknown as number // Check every minute

      return () => {
        if (sessionCheckInterval.current) {
          clearInterval(sessionCheckInterval.current)
        }
      }
    }
  }, [authState.isAuthenticated])

  const checkSessionValidity = useCallback(() => {
    if (!authState.sessionExpiresAt) return

    const now = new Date()
    if (now >= authState.sessionExpiresAt) {
      logout()
    }
  }, [authState.sessionExpiresAt])

  const login = useCallback(async (credentials: UserCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const sessionResult = await SecureNoteService.initializeSession(
        credentials.username,
        credentials.password
      ).run(depsRef.current)

      if (sessionResult.isLeft()) {
        throw new Error(sessionResult.value.message)
      }

      const session = sessionResult.value
      userSessionRef.current = session
      depsRef.current.userSession = session

      const expiresAt = new Date(Date.now() + securityConfig.sessionTimeout)

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
        userId: credentials.username,
        sessionExpiresAt: expiresAt
      })

      // Store session info in secure storage (not implemented here)
      localStorage.setItem('auth_user', credentials.username)
      localStorage.setItem('auth_expires', expiresAt.toISOString())

    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message
      }))
    }
  }, [securityConfig.sessionTimeout])

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }))

    try {
      if (userSessionRef.current) {
        await SecureNoteService.invalidateSession().run(depsRef.current)
      }

      userSessionRef.current = null
      if (depsRef.current) {
        depsRef.current.userSession = {
          userId: '',
          sessionKey: null,
          isAuthenticated: false,
          lastActivity: new Date(),
          sessionTimeout: securityConfig.sessionTimeout
        }
      }

      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_expires')

      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
        sessionCheckInterval.current = null
      }

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        userId: null,
        sessionExpiresAt: null
      })

    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message
      }))
    }
  }, [securityConfig.sessionTimeout])

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    if (!authState.isAuthenticated) {
      throw new Error('Not authenticated')
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await SecureNoteService.changePassword(oldPassword, newPassword).run(depsRef.current)

      if (result.isLeft()) {
        throw new Error(result.value.message)
      }

      setAuthState(prev => ({ ...prev, isLoading: false }))

    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message
      }))
      throw error
    }
  }, [authState.isAuthenticated])

  const checkPasswordStrength = useCallback((password: string) => {
    return SecureNoteService.checkPasswordStrength(password)
  }, [])

  const extendSession = useCallback(async () => {
    if (!authState.isAuthenticated) return

    try {
      const result = await SecureNoteService.extendSession().run(depsRef.current)

      if (result.isRight()) {
        const newExpiresAt = new Date(Date.now() + securityConfig.sessionTimeout)
        setAuthState(prev => ({
          ...prev,
          sessionExpiresAt: newExpiresAt
        }))

        localStorage.setItem('auth_expires', newExpiresAt.toISOString())
      }

    } catch (error) {
      console.error('Failed to extend session:', error)
    }
  }, [authState.isAuthenticated, securityConfig.sessionTimeout])

  // Secure note operations
  const createSecureNote = useCallback((request: NoteCreateRequest) => {
    return SecureNoteService.createSecureNote(request)
  }, [])

  const updateSecureNote = useCallback((id: string, updates: NoteUpdateRequest) => {
    return SecureNoteService.updateSecureNote(id, updates)
  }, [])

  const getSecureNote = useCallback((id: string) => {
    return SecureNoteService.getSecureNote(id)
  }, [])

  const getSecureNotes = useCallback(() => {
    return SecureNoteService.getSecureNotes()
  }, [])

  const exportBackup = useCallback((password: string) => {
    return SecureNoteService.exportSecureBackup(password)
  }, [])

  const importBackup = useCallback((backupData: string, password: string) => {
    return SecureNoteService.importSecureBackup(backupData, password)
  }, [])

  // Auto-login on mount if session exists
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user')
    const storedExpires = localStorage.getItem('auth_expires')

    if (storedUser && storedExpires) {
      const expiresAt = new Date(storedExpires)
      const now = new Date()

      if (now < expiresAt) {
        // Session is still valid, but we need the password to restore the key
        // In a real app, you'd have a refresh token or similar mechanism
        setAuthState(prev => ({
          ...prev,
          userId: storedUser,
          sessionExpiresAt: expiresAt
          // Note: not setting isAuthenticated=true because we need the password
        }))
      } else {
        // Session expired, clean up
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_expires')
      }
    }
  }, [])

  return {
    authState,
    login,
    logout,
    changePassword,
    checkPasswordStrength,
    extendSession,
    createSecureNote,
    updateSecureNote,
    getSecureNote,
    getSecureNotes,
    exportBackup,
    importBackup
  }
}

// Hook for password validation
export function usePasswordValidation() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validation, setValidation] = useState({
    strength: { score: 0, feedback: [], isStrong: false },
    match: true,
    isValid: false
  })

  useEffect(() => {
    const strength = SecureNoteService.checkPasswordStrength(password)
    const match = password === confirmPassword || confirmPassword === ''
    
    setValidation({
      strength,
      match,
      isValid: strength.isStrong && match && password.length > 0
    })
  }, [password, confirmPassword])

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    validation
  }
}