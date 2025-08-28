/**
 * Secure Note Service
 * Encrypted note management with key derivation and secure storage
 */

import { TaskEither } from '../utils/task-either.ts'
import { Reader, ReaderTaskEither } from '../utils/reader.ts'
import { pipe } from '../utils/pipeline.ts'
import { NoteService, Dependencies as BaseDependencies } from './NoteService.ts'
import { CryptoService, CryptoDependencies, EncryptionResult, DecryptionInput, CryptoError } from './CryptoService.ts'
import { 
  Note, 
  NoteServiceError, 
  SecurityError,
  NoteCreateRequest,
  NoteUpdateRequest,
  EncryptedNote,
  SecurityConfig
} from '../types/note.ts'

export interface SecureDependencies extends BaseDependencies, CryptoDependencies {
  readonly security: SecurityConfig
  readonly userSession: UserSession
}

export interface UserSession {
  readonly userId: string
  readonly sessionKey: CryptoKey | null
  readonly isAuthenticated: boolean
  readonly lastActivity: Date
  readonly sessionTimeout: number
}

export interface PasswordStrengthResult {
  readonly score: number // 0-4
  readonly feedback: readonly string[]
  readonly isStrong: boolean
}

export class SecureNoteService {
  private static readonly MIN_PASSWORD_LENGTH = 12
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private static readonly KEY_ID_PREFIX = 'user-key-'

  // Initialize secure session
  static initializeSession(
    userId: string,
    password: string
  ): ReaderTaskEither<SecureDependencies, SecurityError, UserSession> {
    return Reader.of((deps: SecureDependencies) =>
      pipe
        .from(SecureNoteService.validatePassword(password))
        .step(() => SecureNoteService.deriveUserKey(userId, password).run(deps))
        .step(userKey => TaskEither.of({
          userId,
          sessionKey: userKey,
          isAuthenticated: true,
          lastActivity: new Date(),
          sessionTimeout: SecureNoteService.SESSION_TIMEOUT
        }))
        .build()
        .mapLeft(error => ({
          type: 'authentication_error' as const,
          message: 'Failed to initialize secure session',
          originalError: error
        }))
    )
  }

  // Create encrypted note
  static createSecureNote(
    request: NoteCreateRequest
  ): ReaderTaskEither<SecureDependencies, NoteServiceError, Note> {
    return Reader.of((deps: SecureDependencies) =>
      pipe
        .from(SecureNoteService.validateSession(deps))
        .step(() => SecureNoteService.encryptNoteContent(request.content, deps.userSession.sessionKey!).run(deps))
        .step(encryptedContent => {
          const secureRequest: NoteCreateRequest = {
            ...request,
            content: JSON.stringify(encryptedContent)
          }
          return NoteService.createNote(secureRequest).run(deps)
        })
        .step(encryptedNote => SecureNoteService.decryptNoteForUser(encryptedNote, deps))
        .build()
    )
  }

  // Update encrypted note
  static updateSecureNote(
    id: string,
    updates: NoteUpdateRequest
  ): ReaderTaskEither<SecureDependencies, NoteServiceError, Note> {
    return Reader.of((deps: SecureDependencies) =>
      pipe
        .from(SecureNoteService.validateSession(deps))
        .step(() => {
          if (updates.content) {
            return SecureNoteService.encryptNoteContent(updates.content, deps.userSession.sessionKey!).run(deps)
              .map(encryptedContent => ({
                ...updates,
                content: JSON.stringify(encryptedContent)
              }))
          }
          return TaskEither.of(updates)
        })
        .step(secureUpdates => NoteService.updateNote(id, secureUpdates).run(deps))
        .step(encryptedNote => SecureNoteService.decryptNoteForUser(encryptedNote, deps))
        .build()
    )
  }

  // Get decrypted note
  static getSecureNote(id: string): ReaderTaskEither<SecureDependencies, NoteServiceError, Note> {
    return Reader.of((deps: SecureDependencies) =>
      pipe
        .from(SecureNoteService.validateSession(deps))
        .step(() => NoteService.getNote(id).run(deps))
        .step(encryptedNote => SecureNoteService.decryptNoteForUser(encryptedNote, deps))
        .build()
    )
  }

  // Get multiple decrypted notes
  static getSecureNotes(
    folderId?: string,
    filter?: any,
    sort?: any,
    offset: number = 0,
    limit: number = 50
  ): ReaderTaskEither<SecureDependencies, NoteServiceError, readonly Note[]> {
    return Reader.of((deps: SecureDependencies) =>
      pipe
        .from(SecureNoteService.validateSession(deps))
        .step(() => NoteService.getNotes(folderId, filter, sort, offset, limit).run(deps))
        .step(encryptedNotes => 
          TaskEither.all(
            encryptedNotes.map(note => SecureNoteService.decryptNoteForUser(note, deps))
          )
        )
        .build()
    )
  }

  // Change user password
  static changePassword(
    oldPassword: string,
    newPassword: string
  ): ReaderTaskEither<SecureDependencies, SecurityError, void> {
    return Reader.of((deps: SecureDependencies) =>
      pipe
        .from(SecureNoteService.validatePassword(newPassword))
        .step(() => SecureNoteService.validateSession(deps))
        .step(() => SecureNoteService.verifyCurrentPassword(oldPassword, deps))
        .step(() => SecureNoteService.reencryptUserKey(oldPassword, newPassword, deps))
        .step(() => TaskEither.of(undefined))
        .build()
    )
  }

  // Export encrypted backup
  static exportSecureBackup(
    password: string
  ): ReaderTaskEither<SecureDependencies, SecurityError, string> {
    return Reader.of((deps: SecureDependencies) =>
      pipe
        .from(SecureNoteService.validateSession(deps))
        .step(() => SecureNoteService.validatePassword(password))
        .step(() => NoteService.getNotes().run(deps))
        .step(notes => SecureNoteService.createEncryptedBackup(notes, password, deps))
        .build()
        .mapLeft(error => ({
          type: 'backup_error' as const,
          message: 'Failed to create secure backup',
          originalError: error
        }))
    )
  }

  // Import encrypted backup
  static importSecureBackup(
    backupData: string,
    password: string
  ): ReaderTaskEither<SecureDependencies, SecurityError, void> {
    return Reader.of((deps: SecureDependencies) =>
      pipe
        .from(SecureNoteService.validateSession(deps))
        .step(() => SecureNoteService.decryptBackup(backupData, password, deps))
        .step(notes => SecureNoteService.restoreNotesFromBackup(notes, deps))
        .build()
        .mapLeft(error => ({
          type: 'restore_error' as const,
          message: 'Failed to restore from secure backup',
          originalError: error
        }))
    )
  }

  // Validate password strength
  static validatePassword(password: string): TaskEither<SecurityError, string> {
    return TaskEither.tryCatch(
      async () => {
        const strength = SecureNoteService.checkPasswordStrength(password)
        
        if (!strength.isStrong) {
          throw new Error(`Password is too weak: ${strength.feedback.join(', ')}`)
        }
        
        return password
      },
      (error) => ({
        type: 'password_error' as const,
        message: (error as Error).message
      })
    )
  }

  // Check password strength
  static checkPasswordStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = []
    let score = 0

    // Length check
    if (password.length < SecureNoteService.MIN_PASSWORD_LENGTH) {
      feedback.push(`Password must be at least ${SecureNoteService.MIN_PASSWORD_LENGTH} characters`)
    } else {
      score += 1
    }

    // Character variety checks
    if (!/[a-z]/.test(password)) {
      feedback.push('Include lowercase letters')
    } else {
      score += 0.5
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Include uppercase letters')
    } else {
      score += 0.5
    }

    if (!/[0-9]/.test(password)) {
      feedback.push('Include numbers')
    } else {
      score += 1
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push('Include special characters')
    } else {
      score += 1
    }

    // Common patterns
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeated characters')
      score -= 0.5
    }

    if (/123|abc|qwe/i.test(password)) {
      feedback.push('Avoid common patterns')
      score -= 0.5
    }

    return {
      score: Math.max(0, Math.min(4, score)),
      feedback,
      isStrong: score >= 3 && feedback.length === 0
    }
  }

  // Session management
  static extendSession(): ReaderTaskEither<SecureDependencies, SecurityError, UserSession> {
    return Reader.of((deps: SecureDependencies) =>
      pipe
        .from(SecureNoteService.validateSession(deps))
        .step(() => TaskEither.of({
          ...deps.userSession,
          lastActivity: new Date()
        }))
        .build()
    )
  }

  static invalidateSession(): ReaderTaskEither<SecureDependencies, SecurityError, void> {
    return Reader.of((deps: SecureDependencies) =>
      TaskEither.of(undefined) // Session invalidation would be handled by the calling code
    )
  }

  // Private implementation methods

  private static validateSession(deps: SecureDependencies): TaskEither<SecurityError, UserSession> {
    return TaskEither.tryCatch(
      async () => {
        if (!deps.userSession.isAuthenticated) {
          throw new Error('User not authenticated')
        }

        if (!deps.userSession.sessionKey) {
          throw new Error('No session key available')
        }

        const now = new Date()
        const timeSinceActivity = now.getTime() - deps.userSession.lastActivity.getTime()
        
        if (timeSinceActivity > deps.userSession.sessionTimeout) {
          throw new Error('Session expired')
        }

        return deps.userSession
      },
      (error) => ({
        type: 'session_error' as const,
        message: (error as Error).message
      })
    )
  }

  private static deriveUserKey(
    userId: string,
    password: string
  ): ReaderTaskEither<CryptoDependencies, CryptoError, CryptoKey> {
    const keyId = SecureNoteService.KEY_ID_PREFIX + userId
    
    return Reader.of((deps: CryptoDependencies) =>
      pipe
        .from(CryptoService.retrieveKeyWithPassword(keyId, password).run(deps))
        .step(key => TaskEither.of(key))
        .build()
        .orElse(() => 
          // Generate new key if not found
          pipe
            .from(CryptoService.generateKey().run(deps))
            .step(key => CryptoService.storeKeyWithPassword(keyId, key, password).run(deps).map(() => key))
            .build()
        )
    )
  }

  private static encryptNoteContent(
    content: string,
    key: CryptoKey
  ): ReaderTaskEither<CryptoDependencies, CryptoError, EncryptionResult> {
    return CryptoService.encrypt(content, key)
  }

  private static decryptNoteForUser(
    note: Note,
    deps: SecureDependencies
  ): TaskEither<NoteServiceError, Note> {
    return TaskEither.tryCatch(
      async () => {
        try {
          const encryptionResult = JSON.parse(note.content) as DecryptionInput
          const decryptResult = await CryptoService.decrypt(encryptionResult, deps.userSession.sessionKey!).run(deps)
          
          if (decryptResult.isLeft()) {
            throw new Error(`Decryption failed: ${decryptResult.value.message}`)
          }

          return {
            ...note,
            content: decryptResult.value,
            preview: SecureNoteService.generateSecurePreview(decryptResult.value)
          }
        } catch (error) {
          // If JSON parsing fails, assume content is not encrypted
          return note
        }
      },
      (error) => ({
        type: 'decryption_error' as const,
        message: `Failed to decrypt note: ${(error as Error).message}`,
        noteId: note.id
      })
    )
  }

  private static generateSecurePreview(content: string): string {
    const plainText = content
      .replace(/#+\s+/g, '') // Remove headings
      .replace(/\*+([^*]+)\*+/g, '$1') // Remove emphasis
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim()
    
    return plainText.length > 100 
      ? plainText.substring(0, 100).trim() + '...'
      : plainText
  }

  private static verifyCurrentPassword(
    password: string,
    deps: SecureDependencies
  ): TaskEither<SecurityError, void> {
    const keyId = SecureNoteService.KEY_ID_PREFIX + deps.userSession.userId
    
    return CryptoService.retrieveKeyWithPassword(keyId, password)
      .run(deps)
      .mapLeft(() => ({
        type: 'authentication_error' as const,
        message: 'Current password is incorrect'
      }))
      .map(() => undefined)
  }

  private static reencryptUserKey(
    oldPassword: string,
    newPassword: string,
    deps: SecureDependencies
  ): TaskEither<SecurityError, void> {
    const keyId = SecureNoteService.KEY_ID_PREFIX + deps.userSession.userId
    
    return pipe
      .from(CryptoService.retrieveKeyWithPassword(keyId, oldPassword).run(deps))
      .step(key => CryptoService.storeKeyWithPassword(keyId, key, newPassword).run(deps))
      .build()
      .mapLeft(error => ({
        type: 'key_error' as const,
        message: 'Failed to re-encrypt user key',
        originalError: error
      }))
  }

  private static createEncryptedBackup(
    notes: readonly Note[],
    password: string,
    deps: CryptoDependencies
  ): TaskEither<CryptoError, string> {
    return TaskEither.tryCatch(
      async () => {
        const backup = {
          version: '1.0',
          createdAt: new Date().toISOString(),
          notes: notes,
          metadata: {
            totalNotes: notes.length,
            encrypted: true
          }
        }

        const backupJson = JSON.stringify(backup)
        const encryptResult = await CryptoService.encryptWithPassword(backupJson, password).run(deps)
        
        if (encryptResult.isLeft()) {
          throw new Error(encryptResult.value.message)
        }

        return JSON.stringify(encryptResult.value)
      },
      (error) => ({
        type: 'encryption_error' as const,
        message: `Failed to create encrypted backup: ${(error as Error).message}`
      })
    )
  }

  private static decryptBackup(
    backupData: string,
    password: string,
    deps: CryptoDependencies
  ): TaskEither<CryptoError, readonly Note[]> {
    return TaskEither.tryCatch(
      async () => {
        const encryptionResult = JSON.parse(backupData) as DecryptionInput
        const decryptResult = await CryptoService.decryptWithPassword(encryptionResult, password).run(deps)
        
        if (decryptResult.isLeft()) {
          throw new Error(decryptResult.value.message)
        }

        const backup = JSON.parse(decryptResult.value)
        
        if (!backup.version || !backup.notes) {
          throw new Error('Invalid backup format')
        }

        return backup.notes
      },
      (error) => ({
        type: 'decryption_error' as const,
        message: `Failed to decrypt backup: ${(error as Error).message}`
      })
    )
  }

  private static restoreNotesFromBackup(
    notes: readonly Note[],
    deps: SecureDependencies
  ): TaskEither<NoteServiceError, void> {
    return TaskEither.tryCatch(
      async () => {
        // This would implement the restoration logic
        // For now, simplified implementation
        console.log(`Would restore ${notes.length} notes`)
      },
      (error) => ({
        type: 'restore_error' as const,
        message: `Failed to restore notes: ${(error as Error).message}`
      })
    )
  }
}