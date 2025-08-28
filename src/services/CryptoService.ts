/**
 * Cryptographic Service
 * End-to-end encryption for note content using Web Crypto API
 */

import { TaskEither } from '../utils/task-either.ts'
import { Reader, ReaderTaskEither } from '../utils/reader.ts'
import { pipe } from '../utils/pipeline.ts'

export interface CryptoError {
  readonly type: 'crypto_error' | 'key_error' | 'decryption_error' | 'encryption_error'
  readonly message: string
  readonly originalError?: Error
}

export interface EncryptionResult {
  readonly encryptedData: string
  readonly iv: string
  readonly salt: string
  readonly algorithm: string
  readonly keyDerivation: string
}

export interface DecryptionInput {
  readonly encryptedData: string
  readonly iv: string
  readonly salt: string
  readonly algorithm: string
  readonly keyDerivation: string
}

export interface CryptoDependencies {
  readonly crypto: Crypto
  readonly keyStorage: KeyStorage
}

export interface KeyStorage {
  readonly store: (keyId: string, encryptedKey: string) => Promise<void>
  readonly retrieve: (keyId: string) => Promise<string | null>
  readonly remove: (keyId: string) => Promise<void>
  readonly list: () => Promise<string[]>
}

export class CryptoService {
  private static readonly ALGORITHM = 'AES-GCM'
  private static readonly KEY_LENGTH = 256
  private static readonly IV_LENGTH = 12
  private static readonly SALT_LENGTH = 32
  private static readonly PBKDF2_ITERATIONS = 100000

  // Generate a new encryption key
  static generateKey(): ReaderTaskEither<CryptoDependencies, CryptoError, CryptoKey> {
    return Reader.of((deps: CryptoDependencies) =>
      TaskEither.tryCatch(
        async () => {
          return await deps.crypto.subtle.generateKey(
            {
              name: CryptoService.ALGORITHM,
              length: CryptoService.KEY_LENGTH,
            },
            true, // extractable
            ['encrypt', 'decrypt']
          )
        },
        (error) => ({
          type: 'key_error' as const,
          message: 'Failed to generate encryption key',
          originalError: error as Error
        })
      )
    )
  }

  // Derive key from password using PBKDF2
  static deriveKeyFromPassword(
    password: string, 
    salt?: Uint8Array
  ): ReaderTaskEither<CryptoDependencies, CryptoError, { key: CryptoKey; salt: Uint8Array }> {
    return Reader.of((deps: CryptoDependencies) =>
      TaskEither.tryCatch(
        async () => {
          const actualSalt = salt || deps.crypto.getRandomValues(new Uint8Array(CryptoService.SALT_LENGTH))
          
          // Import password as key material
          const keyMaterial = await deps.crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
          )

          // Derive actual encryption key
          const key = await deps.crypto.subtle.deriveKey(
            {
              name: 'PBKDF2',
              salt: actualSalt,
              iterations: CryptoService.PBKDF2_ITERATIONS,
              hash: 'SHA-256',
            },
            keyMaterial,
            { name: CryptoService.ALGORITHM, length: CryptoService.KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
          )

          return { key, salt: actualSalt }
        },
        (error) => ({
          type: 'key_error' as const,
          message: 'Failed to derive key from password',
          originalError: error as Error
        })
      )
    )
  }

  // Encrypt data with a key
  static encrypt(
    data: string, 
    key: CryptoKey
  ): ReaderTaskEither<CryptoDependencies, CryptoError, EncryptionResult> {
    return Reader.of((deps: CryptoDependencies) =>
      TaskEither.tryCatch(
        async () => {
          const iv = deps.crypto.getRandomValues(new Uint8Array(CryptoService.IV_LENGTH))
          const encodedData = new TextEncoder().encode(data)

          const encryptedBuffer = await deps.crypto.subtle.encrypt(
            {
              name: CryptoService.ALGORITHM,
              iv: iv,
            },
            key,
            encodedData
          )

          return {
            encryptedData: CryptoService.arrayBufferToBase64(encryptedBuffer),
            iv: CryptoService.arrayBufferToBase64(iv),
            salt: '', // Will be set by caller if using password derivation
            algorithm: CryptoService.ALGORITHM,
            keyDerivation: 'PBKDF2'
          }
        },
        (error) => ({
          type: 'encryption_error' as const,
          message: 'Failed to encrypt data',
          originalError: error as Error
        })
      )
    )
  }

  // Decrypt data with a key
  static decrypt(
    encryptionResult: DecryptionInput, 
    key: CryptoKey
  ): ReaderTaskEither<CryptoDependencies, CryptoError, string> {
    return Reader.of((deps: CryptoDependencies) =>
      TaskEither.tryCatch(
        async () => {
          if (encryptionResult.algorithm !== CryptoService.ALGORITHM) {
            throw new Error(`Unsupported algorithm: ${encryptionResult.algorithm}`)
          }

          const encryptedData = CryptoService.base64ToArrayBuffer(encryptionResult.encryptedData)
          const iv = CryptoService.base64ToArrayBuffer(encryptionResult.iv)

          const decryptedBuffer = await deps.crypto.subtle.decrypt(
            {
              name: CryptoService.ALGORITHM,
              iv: iv,
            },
            key,
            encryptedData
          )

          return new TextDecoder().decode(decryptedBuffer)
        },
        (error) => ({
          type: 'decryption_error' as const,
          message: 'Failed to decrypt data',
          originalError: error as Error
        })
      )
    )
  }

  // Encrypt data with password
  static encryptWithPassword(
    data: string, 
    password: string
  ): ReaderTaskEither<CryptoDependencies, CryptoError, EncryptionResult> {
    return Reader.of((deps: CryptoDependencies) =>
      pipe
        .from(CryptoService.deriveKeyFromPassword(password).run(deps))
        .step(({ key, salt }) =>
          CryptoService.encrypt(data, key).run(deps).flatMap(result =>
            TaskEither.of({
              ...result,
              salt: CryptoService.arrayBufferToBase64(salt)
            })
          )
        )
        .build()
    )
  }

  // Decrypt data with password
  static decryptWithPassword(
    encryptionResult: DecryptionInput, 
    password: string
  ): ReaderTaskEither<CryptoDependencies, CryptoError, string> {
    return Reader.of((deps: CryptoDependencies) =>
      pipe
        .from(TaskEither.tryCatch(
          async () => CryptoService.base64ToArrayBuffer(encryptionResult.salt),
          (error) => ({
            type: 'crypto_error' as const,
            message: 'Invalid salt format',
            originalError: error as Error
          })
        ))
        .step(salt => CryptoService.deriveKeyFromPassword(password, new Uint8Array(salt)).run(deps))
        .step(({ key }) => CryptoService.decrypt(encryptionResult, key).run(deps))
        .build()
    )
  }

  // Export key for storage
  static exportKey(key: CryptoKey): ReaderTaskEither<CryptoDependencies, CryptoError, string> {
    return Reader.of((deps: CryptoDependencies) =>
      TaskEither.tryCatch(
        async () => {
          const exportedKey = await deps.crypto.subtle.exportKey('raw', key)
          return CryptoService.arrayBufferToBase64(exportedKey)
        },
        (error) => ({
          type: 'key_error' as const,
          message: 'Failed to export key',
          originalError: error as Error
        })
      )
    )
  }

  // Import key from storage
  static importKey(keyData: string): ReaderTaskEither<CryptoDependencies, CryptoError, CryptoKey> {
    return Reader.of((deps: CryptoDependencies) =>
      TaskEither.tryCatch(
        async () => {
          const keyBuffer = CryptoService.base64ToArrayBuffer(keyData)
          return await deps.crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: CryptoService.ALGORITHM },
            true,
            ['encrypt', 'decrypt']
          )
        },
        (error) => ({
          type: 'key_error' as const,
          message: 'Failed to import key',
          originalError: error as Error
        })
      )
    )
  }

  // Store encrypted key with password protection
  static storeKeyWithPassword(
    keyId: string,
    key: CryptoKey,
    password: string
  ): ReaderTaskEither<CryptoDependencies, CryptoError, void> {
    return Reader.of((deps: CryptoDependencies) =>
      pipe
        .from(CryptoService.exportKey(key).run(deps))
        .step(exportedKey => CryptoService.encryptWithPassword(exportedKey, password).run(deps))
        .step(encryptedKey => TaskEither.tryCatch(
          async () => {
            await deps.keyStorage.store(keyId, JSON.stringify(encryptedKey))
          },
          (error) => ({
            type: 'key_error' as const,
            message: 'Failed to store encrypted key',
            originalError: error as Error
          })
        ))
        .build()
    )
  }

  // Retrieve and decrypt key with password
  static retrieveKeyWithPassword(
    keyId: string,
    password: string
  ): ReaderTaskEither<CryptoDependencies, CryptoError, CryptoKey> {
    return Reader.of((deps: CryptoDependencies) =>
      pipe
        .from(TaskEither.tryCatch(
          async () => {
            const encryptedKeyData = await deps.keyStorage.retrieve(keyId)
            if (!encryptedKeyData) {
              throw new Error(`Key not found: ${keyId}`)
            }
            return JSON.parse(encryptedKeyData) as DecryptionInput
          },
          (error) => ({
            type: 'key_error' as const,
            message: 'Failed to retrieve encrypted key',
            originalError: error as Error
          })
        ))
        .step(encryptedKey => CryptoService.decryptWithPassword(encryptedKey, password).run(deps))
        .step(keyData => CryptoService.importKey(keyData).run(deps))
        .build()
    )
  }

  // Generate secure random string for IDs, salts, etc.
  static generateSecureId(length: number = 32): ReaderTaskEither<CryptoDependencies, CryptoError, string> {
    return Reader.of((deps: CryptoDependencies) =>
      TaskEither.tryCatch(
        async () => {
          const randomBytes = deps.crypto.getRandomValues(new Uint8Array(length))
          return Array.from(randomBytes)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('')
        },
        (error) => ({
          type: 'crypto_error' as const,
          message: 'Failed to generate secure ID',
          originalError: error as Error
        })
      )
    )
  }

  // Hash data using SHA-256
  static hash(data: string): ReaderTaskEither<CryptoDependencies, CryptoError, string> {
    return Reader.of((deps: CryptoDependencies) =>
      TaskEither.tryCatch(
        async () => {
          const encodedData = new TextEncoder().encode(data)
          const hashBuffer = await deps.crypto.subtle.digest('SHA-256', encodedData)
          return CryptoService.arrayBufferToBase64(hashBuffer)
        },
        (error) => ({
          type: 'crypto_error' as const,
          message: 'Failed to hash data',
          originalError: error as Error
        })
      )
    )
  }

  // Verify data integrity
  static verifyIntegrity(
    data: string,
    expectedHash: string
  ): ReaderTaskEither<CryptoDependencies, CryptoError, boolean> {
    return Reader.of((deps: CryptoDependencies) =>
      CryptoService.hash(data).run(deps).map(actualHash => actualHash === expectedHash)
    )
  }

  // Utility methods
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!)
    }
    return btoa(binary)
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const buffer = new ArrayBuffer(binary.length)
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return buffer
  }
}

// Memory-based key storage (for development)
export class MemoryKeyStorage implements KeyStorage {
  private readonly keys = new Map<string, string>()

  async store(keyId: string, encryptedKey: string): Promise<void> {
    this.keys.set(keyId, encryptedKey)
  }

  async retrieve(keyId: string): Promise<string | null> {
    return this.keys.get(keyId) || null
  }

  async remove(keyId: string): Promise<void> {
    this.keys.delete(keyId)
  }

  async list(): Promise<string[]> {
    return Array.from(this.keys.keys())
  }
}

// IndexedDB-based key storage (for production)
export class IndexedDBKeyStorage implements KeyStorage {
  private readonly dbName = 'mekkanote-keys'
  private readonly version = 1
  private db?: IDBDatabase

  private async getDatabase(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains('keys')) {
          const store = db.createObjectStore('keys', { keyPath: 'keyId' })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })
  }

  async store(keyId: string, encryptedKey: string): Promise<void> {
    const db = await this.getDatabase()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['keys'], 'readwrite')
      const store = transaction.objectStore('keys')
      
      const request = store.put({
        keyId,
        encryptedKey,
        createdAt: Date.now()
      })
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async retrieve(keyId: string): Promise<string | null> {
    const db = await this.getDatabase()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['keys'], 'readonly')
      const store = transaction.objectStore('keys')
      const request = store.get(keyId)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.encryptedKey : null)
      }
    })
  }

  async remove(keyId: string): Promise<void> {
    const db = await this.getDatabase()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['keys'], 'readwrite')
      const store = transaction.objectStore('keys')
      const request = store.delete(keyId)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async list(): Promise<string[]> {
    const db = await this.getDatabase()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['keys'], 'readonly')
      const store = transaction.objectStore('keys')
      const request = store.getAllKeys()
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result as string[])
    })
  }
}

// Factory function to create appropriate key storage
export function createKeyStorage(): KeyStorage {
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    return new IndexedDBKeyStorage()
  } else {
    return new MemoryKeyStorage()
  }
}

// Factory function to create crypto dependencies
export function createCryptoDependencies(): CryptoDependencies {
  if (typeof crypto !== 'undefined') {
    return {
      crypto,
      keyStorage: createKeyStorage()
    }
  } else {
    throw new Error('Web Crypto API not available')
  }
}