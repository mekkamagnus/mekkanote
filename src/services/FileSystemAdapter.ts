/**
 * File System Adapter
 * Platform-agnostic file system operations using Deno APIs
 */

import { FileSystemDependencies } from './NoteService.ts'

export class DenoFileSystemAdapter implements FileSystemDependencies {
  async readTextFile(path: string): Promise<string> {
    try {
      return await Deno.readTextFile(path)
    } catch (error) {
      throw new Error(`Failed to read file ${path}: ${error.message}`)
    }
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.substring(0, path.lastIndexOf('/'))
      await this.mkdir(dir, { recursive: true })
      await Deno.writeTextFile(path, content)
    } catch (error) {
      throw new Error(`Failed to write file ${path}: ${error.message}`)
    }
  }

  async readDir(path: string): Promise<string[]> {
    try {
      const entries: string[] = []
      for await (const dirEntry of Deno.readDir(path)) {
        entries.push(dirEntry.name)
      }
      return entries
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return []
      }
      throw new Error(`Failed to read directory ${path}: ${error.message}`)
    }
  }

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    try {
      await Deno.mkdir(path, options)
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw new Error(`Failed to create directory ${path}: ${error.message}`)
      }
    }
  }

  async stat(path: string): Promise<{ size: number; mtime: Date; isFile: boolean; isDirectory: boolean }> {
    try {
      const fileInfo = await Deno.stat(path)
      return {
        size: fileInfo.size,
        mtime: fileInfo.mtime || new Date(),
        isFile: fileInfo.isFile,
        isDirectory: fileInfo.isDirectory
      }
    } catch (error) {
      throw new Error(`Failed to stat ${path}: ${error.message}`)
    }
  }

  async remove(path: string, options?: { recursive?: boolean }): Promise<void> {
    try {
      await Deno.remove(path, options)
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw new Error(`Failed to remove ${path}: ${error.message}`)
      }
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await Deno.stat(path)
      return true
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return false
      }
      throw new Error(`Failed to check existence of ${path}: ${error.message}`)
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    try {
      await Deno.rename(oldPath, newPath)
    } catch (error) {
      throw new Error(`Failed to rename ${oldPath} to ${newPath}: ${error.message}`)
    }
  }
}

// Browser fallback adapter using OPFS (Origin Private File System)
export class BrowserFileSystemAdapter implements FileSystemDependencies {
  private async getFileSystem(): Promise<FileSystemDirectoryHandle> {
    if (!('navigator' in globalThis) || !navigator.storage?.getDirectory) {
      throw new Error('Origin Private File System not supported')
    }
    return await navigator.storage.getDirectory()
  }

  private async ensureDirectory(path: string): Promise<FileSystemDirectoryHandle> {
    const fs = await this.getFileSystem()
    const parts = path.split('/').filter(part => part.length > 0)
    
    let current = fs
    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create: true })
    }
    
    return current
  }

  async readTextFile(path: string): Promise<string> {
    try {
      const fs = await this.getFileSystem()
      const parts = path.split('/')
      const fileName = parts.pop()!
      const dirPath = parts.join('/')
      
      const dir = await this.ensureDirectory(dirPath)
      const fileHandle = await dir.getFileHandle(fileName)
      const file = await fileHandle.getFile()
      return await file.text()
    } catch (error) {
      throw new Error(`Failed to read file ${path}: ${error.message}`)
    }
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    try {
      const parts = path.split('/')
      const fileName = parts.pop()!
      const dirPath = parts.join('/')
      
      const dir = await this.ensureDirectory(dirPath)
      const fileHandle = await dir.getFileHandle(fileName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()
    } catch (error) {
      throw new Error(`Failed to write file ${path}: ${error.message}`)
    }
  }

  async readDir(path: string): Promise<string[]> {
    try {
      const dir = await this.ensureDirectory(path)
      const entries: string[] = []
      
      for await (const [name] of dir.entries()) {
        entries.push(name)
      }
      
      return entries
    } catch (error) {
      throw new Error(`Failed to read directory ${path}: ${error.message}`)
    }
  }

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    try {
      await this.ensureDirectory(path)
    } catch (error) {
      throw new Error(`Failed to create directory ${path}: ${error.message}`)
    }
  }

  async stat(path: string): Promise<{ size: number; mtime: Date; isFile: boolean; isDirectory: boolean }> {
    try {
      const parts = path.split('/')
      const fileName = parts.pop()!
      const dirPath = parts.join('/')
      
      const dir = await this.ensureDirectory(dirPath)
      
      try {
        const fileHandle = await dir.getFileHandle(fileName)
        const file = await fileHandle.getFile()
        return {
          size: file.size,
          mtime: new Date(file.lastModified),
          isFile: true,
          isDirectory: false
        }
      } catch {
        // Try as directory
        await dir.getDirectoryHandle(fileName)
        return {
          size: 0,
          mtime: new Date(),
          isFile: false,
          isDirectory: true
        }
      }
    } catch (error) {
      throw new Error(`Failed to stat ${path}: ${error.message}`)
    }
  }

  async remove(path: string, options?: { recursive?: boolean }): Promise<void> {
    try {
      const parts = path.split('/')
      const fileName = parts.pop()!
      const dirPath = parts.join('/')
      
      const dir = await this.ensureDirectory(dirPath)
      
      try {
        await dir.removeEntry(fileName, options)
      } catch (error) {
        if (error.name !== 'NotFoundError') {
          throw error
        }
      }
    } catch (error) {
      throw new Error(`Failed to remove ${path}: ${error.message}`)
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.stat(path)
      return true
    } catch {
      return false
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    try {
      // OPFS doesn't have native rename, so we copy and delete
      const content = await this.readTextFile(oldPath)
      await this.writeTextFile(newPath, content)
      await this.remove(oldPath)
    } catch (error) {
      throw new Error(`Failed to rename ${oldPath} to ${newPath}: ${error.message}`)
    }
  }
}

// Factory function to create appropriate adapter
export function createFileSystemAdapter(): FileSystemDependencies {
  if (typeof Deno !== 'undefined') {
    return new DenoFileSystemAdapter()
  } else if (typeof window !== 'undefined' && 'navigator' in window) {
    return new BrowserFileSystemAdapter()
  } else {
    throw new Error('No suitable file system adapter available')
  }
}