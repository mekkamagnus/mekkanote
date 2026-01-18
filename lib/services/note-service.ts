import { v7 as uuidv7 } from 'uuid';
import { db } from '../db';
import { notes } from '../db/schema';
import { eq } from 'drizzle-orm';
import { Note } from '../../types/note';
import { OrgFileService } from './org-file-service';

const orgFileService = new OrgFileService('./notes-org');

export class NoteService {
  /**
   * Creates a new note
   */
  async create(title: string, content: string): Promise<Note> {
    try {
      const id = uuidv7();
      const [newNote] = await db.insert(notes).values({
        id,
        title,
        content,
      }).returning();

      // Save to org file as well
      await orgFileService.saveNote(id, title, content);

      return newNote;
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('A note with this ID already exists');
      }
      throw new Error(`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieves a note by ID
   */
  async read(id: string): Promise<Note | null> {
    try {
      const note = await db.select().from(notes).where(eq(notes.id, id)).get();
      return note || null;
    } catch (error) {
      throw new Error(`Failed to read note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates an existing note
   */
  async update(id: string, title?: string, content?: string): Promise<Note | null> {
    try {
      const updates: Partial<Note> = {};

      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;

      updates.updatedAt = new Date();

      const [updatedNote] = await db.update(notes)
        .set(updates)
        .where(eq(notes.id, id))
        .returning();

      if (updatedNote) {
        // Update the org file as well
        await orgFileService.saveNote(
          id,
          title !== undefined ? title : updatedNote.title,
          content !== undefined ? content : updatedNote.content
        );
      }

      return updatedNote || null;
    } catch (error) {
      throw new Error(`Failed to update note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes a note by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Delete the org file first
      await orgFileService.deleteNote(id);

      // Then delete from the database
      const result = await db.delete(notes).where(eq(notes.id, id));

      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to delete note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieves all notes
   */
  async getAll(): Promise<Note[]> {
    try {
      return await db.select().from(notes).orderBy(notes.createdAt);
    } catch (error) {
      throw new Error(`Failed to retrieve notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}