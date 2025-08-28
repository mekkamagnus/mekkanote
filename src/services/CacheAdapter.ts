/**
 * Cache Adapter
 * Memory-based caching with TTL support
 */

import { CacheDependencies } from './NoteService.ts'

interface CacheEntry<T> {
  readonly value: T
  readonly expiresAt: number
}

export class MemoryCacheAdapter implements CacheDependencies {
  private readonly cache = new Map<string, CacheEntry<any>>()
  private readonly cleanupInterval: number
  private cleanupTimer?: number

  constructor(cleanupIntervalMs: number = 60000) {
    this.cleanupInterval = cleanupIntervalMs
    this.startCleanup()
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.value as T
  }

  async set<T>(key: string, value: T, ttl: number = 300000): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl
    }
    
    this.cache.set(key, entry)
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  // Manual cleanup of expired entries
  cleanup(): void {
    const now = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval) as unknown as number
  }

  // Clean shutdown
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.cache.clear()
  }
}

// Browser-based cache using IndexedDB for persistence
export class IndexedDBCacheAdapter implements CacheDependencies {
  private readonly dbName: string
  private readonly version: number
  private db?: IDBDatabase

  constructor(dbName: string = 'mekkanote-cache', version: number = 1) {
    this.dbName = dbName
    this.version = version
  }

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
        
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' })
          store.createIndex('expiresAt', 'expiresAt', { unique: false })
        }
      }
    })
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDatabase()
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cache'], 'readonly')
        const store = transaction.objectStore('cache')
        const request = store.get(key)
        
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const entry = request.result
          
          if (!entry) {
            resolve(null)
            return
          }
          
          if (Date.now() > entry.expiresAt) {
            // Clean up expired entry
            this.delete(key)
            resolve(null)
            return
          }
          
          resolve(entry.value as T)
        }
      })
    } catch (error) {
      console.warn('IndexedDB cache get failed, falling back to null:', error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttl: number = 300000): Promise<void> {
    try {
      const db = await this.getDatabase()
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cache'], 'readwrite')
        const store = transaction.objectStore('cache')
        
        const entry = {
          key,
          value,
          expiresAt: Date.now() + ttl,
          createdAt: Date.now()
        }
        
        const request = store.put(entry)
        
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.warn('IndexedDB cache set failed:', error)
      // Silently fail for cache operations
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const db = await this.getDatabase()
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cache'], 'readwrite')
        const store = transaction.objectStore('cache')
        const request = store.delete(key)
        
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.warn('IndexedDB cache delete failed:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDatabase()
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cache'], 'readwrite')
        const store = transaction.objectStore('cache')
        const request = store.clear()
        
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.warn('IndexedDB cache clear failed:', error)
    }
  }

  // Clean up expired entries
  async cleanup(): Promise<void> {
    try {
      const db = await this.getDatabase()
      const now = Date.now()
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['cache'], 'readwrite')
        const store = transaction.objectStore('cache')
        const index = store.index('expiresAt')
        
        // Get all entries that have expired
        const range = IDBKeyRange.upperBound(now)
        const request = index.openCursor(range)
        
        request.onerror = () => reject(request.error)
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          
          if (cursor) {
            cursor.delete()
            cursor.continue()
          } else {
            resolve()
          }
        }
      })
    } catch (error) {
      console.warn('IndexedDB cache cleanup failed:', error)
    }
  }
}

// Factory function to create appropriate cache adapter
export function createCacheAdapter(): CacheDependencies {
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    return new IndexedDBCacheAdapter()
  } else {
    return new MemoryCacheAdapter()
  }
}