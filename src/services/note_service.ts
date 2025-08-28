// src/services/note_service.ts
import { TaskEither, tryCatchWithLogging } from '../../utils/task_either.ts';
import { AppError } from '../../models/app_error.ts';
import { OrgDocument } from '../../models/org_document.ts';
import { logger } from '../../utils/logger.ts';
import { v4 } from 'https://deno.land/std/uuid/mod.ts';

interface NoteServiceDependencies {
  readonly fileSystem: {
    writeFile: (path: string, content: string) => Promise<void>;
    readFile: (path: string) => Promise<string>;
    exists: (path: string) => Promise<boolean>;
    mkdir: (path: string) => Promise<void>;
  };
}

export class NoteService {
  constructor(private readonly deps: NoteServiceDependencies) {}

  createNote(content: string): TaskEither<AppError, OrgDocument> {
    return tryCatchWithLogging(
      async () => {
        const uuid = v4.generate();
        const timestamp = new Date();
        const filename = this.generateFilename(timestamp, uuid);
        
        const orgDocument: OrgDocument = {
          id: uuid,
          title: this.extractTitle(content) || 'Untitled Note',
          content: this.applyDefaultTemplate(content),
          createdAt: timestamp,
          updatedAt: timestamp,
          filePath: filename
        };

        await this.ensureNotesDirectory();
        await this.deps.fileSystem.writeFile(filename, orgDocument.content);
        
        logger.info({ noteId: uuid }, 'Note created successfully');
        return orgDocument;
      },
      (error) => AppError.create('NOTE_CREATION_FAILED', `Failed to create note: ${error}`)
    );
  }

  getNote(id: string): TaskEither<AppError, OrgDocument> {
    return tryCatchWithLogging(
      async () => {
        const filename = this.findNoteFilename(id);
        if (!filename) {
          throw new Error(`Note with ID ${id} not found`);
        }

        const content = await this.deps.fileSystem.readFile(filename);
        
        return {
          id,
          title: this.extractTitle(content),
          content,
          createdAt: this.extractCreationDate(content) || new Date(),
          updatedAt: new Date(),
          filePath: filename
        };
      },
      (error) => AppError.create('NOTE_READ_FAILED', `Failed to read note: ${error}`)
    );
  }

  updateNote(id: string, content: string): TaskEither<AppError, OrgDocument> {
    return tryCatchWithLogging(
      async () => {
        const filename = this.findNoteFilename(id);
        if (!filename) {
          throw new Error(`Note with ID ${id} not found`);
        }

        const updatedContent = this.updateContentMetadata(content, new Date());
        await this.deps.fileSystem.writeFile(filename, updatedContent);

        return {
          id,
          title: this.extractTitle(updatedContent),
          content: updatedContent,
          createdAt: this.extractCreationDate(updatedContent) || new Date(),
          updatedAt: new Date(),
          filePath: filename
        };
      },
      (error) => AppError.create('NOTE_UPDATE_FAILED', `Failed to update note: ${error}`)
    );
  }

  private generateFilename(timestamp: Date, uuid: string): string {
    const dateStr = timestamp.toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    return `notes/${dateStr}-${uuid}.org`;
  }

  private applyDefaultTemplate(content: string): string {
    const timestamp = new Date().toISOString();
    const title = this.extractTitle(content) || 'Untitled Note';
    
    return `#+TITLE: ${title}
#+DATE: ${timestamp}
#+CREATED: ${timestamp}
#+ID: ${v4.generate()}

${content}`;
  }

  private extractTitle(content: string): string {
    const titleMatch = content.match(/^#\+TITLE:\s*(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : '';
  }

  private extractCreationDate(content: string): Date | null {
    const dateMatch = content.match(/^#\+CREATED:\s*(.+)$/m);
    return dateMatch ? new Date(dateMatch[1].trim()) : null;
  }

  private updateContentMetadata(content: string, updateTime: Date): string {
    const updated = content.replace(
      /^#\+LAST_MODIFIED:\s*.+$/m,
      `#+LAST_MODIFIED: ${updateTime.toISOString()}`
    );
    
    if (!updated.includes('#+LAST_MODIFIED:')) {
      return `${content}\n#+LAST_MODIFIED: ${updateTime.toISOString()}`;
    }
    
    return updated;
  }

  private async ensureNotesDirectory(): Promise<void> {
    const notesDirExists = await this.deps.fileSystem.exists('notes');
    if (!notesDirExists) {
      await this.deps.fileSystem.mkdir('notes');
    }
  }

  private async findNoteFilename(id: string): Promise<string | null> {
    // Implementation would search for files containing the ID
    // This is a simplified version
    const potentialFilename = `notes/*-${id}.org`;
    const exists = await this.deps.fileSystem.exists(potentialFilename);
    return exists ? potentialFilename : null;
  }
}