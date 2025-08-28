/**
 * Note types and interfaces following functional programming patterns
 */

export interface Note {
  readonly id: string
  readonly title: string
  readonly content: string
  readonly preview: string
  readonly lastModified: Date
  readonly created: Date
  readonly tags: readonly string[]
  readonly wordCount: number
  readonly hasAttachments: boolean
  readonly filePath?: string
}

export interface Folder {
  readonly id: string
  readonly name: string
  readonly icon: string
  readonly noteCount: number
  readonly isSystem?: boolean
  readonly color?: string
}

// Error types for explicit error handling
export type NoteSelectionError = 'NOTE_NOT_FOUND' | 'NOTE_CORRUPTED' | 'NOTE_PERMISSION_DENIED'
export type NoteDeletionError = 'NOTE_NOT_FOUND' | 'DELETE_PERMISSION_DENIED' | 'NOTE_IN_USE'
export type NoteShareError = 'SHARE_PERMISSION_DENIED' | 'SHARE_SERVICE_UNAVAILABLE' | 'NOTE_TOO_LARGE'
export type LoadError = 'NETWORK_ERROR' | 'STORAGE_FULL' | 'INVALID_REQUEST'
export type NavigationError = 'NAVIGATION_BLOCKED' | 'UNSAVED_CHANGES'
export type ActionError = 'ACTION_FAILED' | 'UNAUTHORIZED'
export type FolderSelectionError = 'FOLDER_NOT_FOUND' | 'FOLDER_PERMISSION_DENIED' | 'FOLDER_CORRUPTED'
export type EditorError = 'CONTENT_INVALID' | 'EDITOR_LOCKED' | 'SYNTAX_ERROR'
export type SaveError = 'SAVE_PERMISSION_DENIED' | 'STORAGE_FULL' | 'NETWORK_ERROR'

// Application state types
export interface AppState {
  readonly notes: NotesState
  readonly editor: EditorState
  readonly navigation: NavigationState
  readonly settings: SettingsState
  readonly sync: SyncState
}

export interface NotesState {
  readonly items: Readonly<Record<string, Note>>
  readonly lists: Readonly<Record<string, readonly string[]>>
  readonly loading: boolean
  readonly error?: AppError
  readonly searchResults?: readonly string[]
  readonly currentFolder?: string
}

export interface EditorState {
  readonly activeNoteId?: string
  readonly content: string
  readonly isDirty: boolean
  readonly lastSaved?: Date
  readonly autoSaveEnabled: boolean
  readonly cursorPosition: number
  readonly selection?: TextSelection
  readonly undoStack: readonly string[]
  readonly redoStack: readonly string[]
}

export interface NavigationState {
  readonly currentView: 'list' | 'editor' | 'settings'
  readonly drawerOpen: boolean
  readonly searchOpen: boolean
  readonly searchQuery: string
}

export interface SettingsState {
  readonly theme: 'auto' | 'light' | 'dark'
  readonly fontSize: number
  readonly autoSave: boolean
  readonly autoSaveInterval: number
  readonly language: string
}

export interface SyncState {
  readonly lastSync?: Date
  readonly syncing: boolean
  readonly error?: string
  readonly conflicts: readonly string[]
}

// Application error types
export type AppError = 
  | { readonly type: 'NETWORK_ERROR'; readonly message: string }
  | { readonly type: 'STORAGE_ERROR'; readonly message: string }
  | { readonly type: 'VALIDATION_ERROR'; readonly errors: readonly string[] }
  | { readonly type: 'SYNC_ERROR'; readonly message: string }
  | { readonly type: 'PERMISSION_ERROR'; readonly message: string }

// Org-mode types
export interface OrgElement {
  readonly type: OrgElementType
  readonly content: string
  readonly level?: number
  readonly properties?: Readonly<Record<string, string>>
  readonly tags?: readonly string[]
  readonly timestamp?: Date
  readonly children?: readonly OrgElement[]
  readonly startPosition: number
  readonly endPosition: number
}

export enum OrgElementType {
  HEADLINE = 'headline',
  PARAGRAPH = 'paragraph',
  LIST_ITEM = 'list-item',
  CODE_BLOCK = 'code-block',
  TIMESTAMP = 'timestamp',
  TAG = 'tag',
  PROPERTY = 'property',
  DRAWER = 'drawer',
  LINK = 'link',
  TABLE = 'table',
  FOOTNOTE = 'footnote'
}

export type ParseError = 'SYNTAX_ERROR' | 'INVALID_STRUCTURE' | 'PARSE_TIMEOUT'

// UI component interfaces
export interface MobileHeaderProps {
  readonly title: string
  readonly leftAction?: HeaderAction
  readonly rightAction?: HeaderAction
  readonly showBackButton?: boolean
  readonly onBack?: () => TaskEither<NavigationError, void>
}

export interface HeaderAction {
  readonly icon: string
  readonly label: string
  readonly onClick: () => TaskEither<ActionError, void>
}

export interface NavigationDrawerProps {
  readonly isOpen: boolean
  readonly onClose: () => TaskEither<NavigationError, void>
  readonly folders: readonly Folder[]
  readonly currentFolder?: string
  readonly onFolderSelect: (folderId: string) => TaskEither<FolderSelectionError, void>
  readonly onSettingsSelect?: () => TaskEither<NavigationError, void>
}

export interface NoteListProps {
  readonly notes: readonly Note[]
  readonly onNoteSelect: (noteId: string) => TaskEither<NoteSelectionError, void>
  readonly onNoteDelete: (noteId: string) => TaskEither<NoteDeletionError, void>
  readonly onNoteShare: (noteId: string) => TaskEither<NoteShareError, void>
  readonly onCreateNote?: () => TaskEither<ActionError, void>
  readonly loading?: boolean
  readonly hasMore?: boolean
  readonly onLoadMore?: () => TaskEither<LoadError, readonly Note[]>
}

export interface OrgModeEditorProps {
  readonly noteId: string | null
  readonly initialContent: string
  readonly onContentChange?: (content: string) => void
  readonly onSave?: (content: string) => TaskEither<SaveError, void>
  readonly readOnly?: boolean
  readonly placeholder?: string
  readonly autoSave?: boolean
  readonly debounceMs?: number
}

// Security and Encryption Types
export interface SecurityError {
  readonly type: 'authentication_error' | 'authorization_error' | 'session_error' | 'password_error' | 'key_error' | 'backup_error' | 'restore_error'
  readonly message: string
  readonly originalError?: any
}

export interface EncryptedNote extends Omit<Note, 'content'> {
  readonly content: string // Encrypted JSON
  readonly isEncrypted: boolean
}

export interface SecurityConfig {
  readonly encryptionEnabled: boolean
  readonly passwordMinLength: number
  readonly sessionTimeout: number
  readonly keyDerivationIterations: number
  readonly backupEncryption: boolean
}

export interface UserCredentials {
  readonly username: string
  readonly password: string
}

export interface AuthSession {
  readonly sessionId: string
  readonly userId: string
  readonly createdAt: Date
  readonly expiresAt: Date
  readonly isActive: boolean
}

// Auto-Save Error Types
export interface AutoSaveError {
  readonly type: 'auto_save_error'
  readonly message: string
  readonly noteId: string
  readonly conflict?: ConflictInfo
}

interface ConflictInfo {
  readonly noteId: string
  readonly localVersion: number
  readonly serverVersion: number
  readonly localContent: string
  readonly serverContent: string
  readonly timestamp: Date
}

export type ConflictResolutionStrategy = 'user_wins' | 'server_wins' | 'manual'

// Import TaskEither type
import { TaskEither } from '../utils/task-either.ts'