import { AppError } from '../models/app_error.ts';
import { OrgDocument } from '../models/org_document.ts';
import { TaskEither, tryCatchWithLogging } from './task_either.ts';
import { isLeft } from './either.ts';
// Using crypto.randomUUID() which is native

// Define the interface as per architecture.md
interface FileSystemManagerInterface {
  readOrgFile(uuid: string): TaskEither<AppError, OrgDocument>;
  writeOrgFile(document: OrgDocument): TaskEither<AppError, void>;
  createOrgFile(title: string, content: string): TaskEither<AppError, string>;
  listOrgFiles(): TaskEither<AppError, OrgFile[]>;
  moveFile(uuid: string, newPath: string): TaskEither<AppError, void>;
}

export class FileSystemManager implements FileSystemManagerInterface {
  private notesDirectory: string;

  constructor(notesDirectory: string = "./notes") {
    this.notesDirectory = notesDirectory;
    Deno.mkdirSync(this.notesDirectory, { recursive: true });
  }

  private generateOrgFilePath(uuid: string, createdAt: Date): string {
    const datePart = createdAt.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const timePart = createdAt.toISOString().slice(11, 19).replace(/:/g, ''); // HHMMSS
    return `${this.notesDirectory}/${datePart}-${timePart}-${uuid}.org`;
  }

  private parseOrgFileName(fileName: string): { date: string; time: string; uuid: string } | null {
    // Try 6-digit time format first (HHMMSS)
    let match = fileName.match(/^(\d{8})-(\d{6})-([a-f0-9-]+)\.org$/);
    if (match) {
      return { date: match[1], time: match[2], uuid: match[3] };
    }
    
    // Fallback to 4-digit time format (HHMM)
    match = fileName.match(/^(\d{8})-(\d{4})-([a-f0-9-]+)\.org$/);
    if (match) {
      return { date: match[1], time: match[2], uuid: match[3] };
    }
    
    return null;
  }

  private parseOrgDate(dateStr: string): Date {
    // Parse format like "2025-08-28 Thu 13:51"
    const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})\s+\w{3}\s+(\d{2}:\d{2})$/);
    if (match) {
      return new Date(`${match[1]}T${match[2]}:00`);
    }
    return new Date(dateStr);
  }

  readOrgFile(uuid: string): TaskEither<AppError, OrgDocument> {
    return tryCatchWithLogging(
      async () => {
        // Find the file by searching for UUID in filenames
        let foundFilePath: string | null = null;
        
        for await (const dirEntry of Deno.readDir(this.notesDirectory)) {
          if (dirEntry.isFile && dirEntry.name.endsWith('.org') && dirEntry.name.includes(uuid)) {
            foundFilePath = `${this.notesDirectory}/${dirEntry.name}`;
            break;
          }
        }
        
        if (!foundFilePath) {
          throw new Error(`Note with UUID ${uuid} not found`);
        }
        
        const content = await Deno.readTextFile(foundFilePath);
        // Parse the org-mode properties format
        const idMatch = content.match(/:ID:\s+([A-F0-9-]+)/);
        const titleMatch = content.match(/^#\+title: (.+)$/m);
        const createdMatch = content.match(/:CREATED:\s+\[(.+?)\]/);
        const updatedMatch = content.match(/:UPDATED:\s+\[(.+?)\]/);
        const contentMatch = content.match(/\n\n([\s\S]*)$/);
        
        // Extract UUID from ID property or fallback to filename
        const uuidFromId = idMatch ? idMatch[1].toLowerCase() : uuid;

        return {
          uuid: uuidFromId,
          title: titleMatch ? titleMatch[1] : 'Untitled',
          content: contentMatch ? contentMatch[1].trim() : '',
          ast: {},
          metadata: { tags: [], properties: {}, headlines: [], links: [], attachments: [] },
          createdAt: createdMatch ? this.parseOrgDate(createdMatch[1]) : new Date(),
          updatedAt: updatedMatch ? this.parseOrgDate(updatedMatch[1]) : new Date(),
          filePath: foundFilePath,
        };
      },
      (error: unknown) => ({
        code: 'FILE_READ_ERROR',
        message: 'Failed to read Org file',
        originalError: error instanceof Error ? error : new Error(String(error)),
      })
    );
  }

  writeOrgFile(document: OrgDocument): TaskEither<AppError, void> {
    return tryCatchWithLogging(
      async () => {
        const filePath = this.generateOrgFilePath(document.uuid, document.createdAt);
        const orgContent = `:PROPERTIES:\n:ID:       ${document.uuid.toUpperCase()}\n:CREATED:  [${document.createdAt.toISOString().slice(0, 10)} ${document.createdAt.toLocaleDateString('en-US', { weekday: 'short' })} ${document.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}]\n:UPDATED:  [${document.updatedAt.toISOString().slice(0, 10)} ${document.updatedAt.toLocaleDateString('en-US', { weekday: 'short' })} ${document.updatedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}]\n:END:\n#+title: ${document.title}\n\n${document.content}`;
        await Deno.writeTextFile(filePath, orgContent);
        document.filePath = filePath; // Update document with its path
      },
      (error: unknown) => ({
        code: 'FILE_WRITE_ERROR',
        message: 'Failed to write Org file',
        originalError: error instanceof Error ? error : new Error(String(error)),
      })
    );
  }

  createOrgFile(title: string, content: string): TaskEither<AppError, string> {
    return tryCatchWithLogging(
      async () => {
        const newUuid = crypto.randomUUID();
        const now = new Date();
        const newDoc: OrgDocument = {
          uuid: newUuid,
          title,
          content,
          ast: {},
          metadata: { tags: [], properties: {}, headlines: [], links: [], attachments: [] },
          createdAt: now,
          updatedAt: now,
          filePath: '', // Will be set by writeOrgFile
        };
        const writeResult = await this.writeOrgFile(newDoc)();
        if (isLeft(writeResult)) {
          throw writeResult.left;
        }
        return newUuid;
      },
      (error: unknown) => ({
        code: 'FILE_CREATE_ERROR',
        message: 'Failed to create Org file',
        originalError: error instanceof Error ? error : new Error(String(error)),
      })
    );
  }

  listOrgFiles(): TaskEither<AppError, OrgFile[]> {
    return tryCatchWithLogging(
      async () => {
        const files: OrgFile[] = [];
        for await (const dirEntry of Deno.readDir(this.notesDirectory)) {
          if (dirEntry.isFile && dirEntry.name.endsWith('.org')) {
            const parsed = this.parseOrgFileName(dirEntry.name);
            if (parsed) {
              // In a real scenario, we'd read the file to get title and other metadata
              files.push({ uuid: parsed.uuid, name: dirEntry.name });
            }
          }
        }
        return files;
      },
      (error: unknown) => ({
        code: 'FILE_LIST_ERROR',
        message: 'Failed to list Org files',
        originalError: error instanceof Error ? error : new Error(String(error)),
      })
    );
  }

  moveFile(uuid: string, newPath: string): TaskEither<AppError, void> {
    // This is a placeholder implementation
    return tryCatchWithLogging(
      async () => {
        // In a real scenario, find the file by UUID and move it
        console.log(`Moving file with UUID ${uuid} to ${newPath}`);
      },
      (error: unknown) => ({
        code: 'FILE_MOVE_ERROR',
        message: 'Failed to move Org file',
        originalError: error instanceof Error ? error : new Error(String(error)),
      })
    );
  }
}

// Define OrgFile for listOrgFiles return type
interface OrgFile {
  uuid: string;
  name: string;
}
