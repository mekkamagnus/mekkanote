import { v7 as uuidv7 } from 'uuid';
import { db } from '../db';
import { noteLinks, notes } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { NoteLink } from '../../types/link';

export class LinkService {
  /**
   * Creates a link from source note to target note
   * The bi-directional aspect is handled by querying backlinks (when note is a target)
   */
  async createLink(sourceNoteId: string, targetNoteId: string): Promise<NoteLink> {
    try {
      // Check if notes exist
      const sourceNote = await db.select().from(notes).where(eq(notes.id, sourceNoteId)).get();
      const targetNote = await db.select().from(notes).where(eq(notes.id, targetNoteId)).get();

      if (!sourceNote || !targetNote) {
        throw new Error('Source or target note does not exist');
      }

      // Check if link already exists
      const existingLink = await db.select().from(noteLinks)
        .where(and(
          eq(noteLinks.sourceNoteId, sourceNoteId),
          eq(noteLinks.targetNoteId, targetNoteId)
        ))
        .get();

      if (existingLink) {
        throw new Error('Link already exists');
      }

      // Check for circular reference (self-link)
      if (sourceNoteId === targetNoteId) {
        throw new Error('Cannot create link to the same note');
      }

      // Create the link
      const [newLink] = await db.insert(noteLinks).values({
        id: uuidv7(),
        sourceNoteId,
        targetNoteId,
      }).returning();

      return newLink;
    } catch (error) {
      if (error instanceof Error && error.message.includes('does not exist')) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('same note')) {
        throw error;
      }
      throw new Error(`Failed to create link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes a link between two notes
   */
  async deleteLink(sourceNoteId: string, targetNoteId: string): Promise<boolean> {
    try {
      const result = await db.delete(noteLinks)
        .where(and(
          eq(noteLinks.sourceNoteId, sourceNoteId),
          eq(noteLinks.targetNoteId, targetNoteId)
        ));
        
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to delete link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets all backlinks for a note (notes that link to this note)
   */
  async getBacklinks(noteId: string): Promise<NoteLink[]> {
    try {
      const backlinks = await db.select().from(noteLinks)
        .where(eq(noteLinks.targetNoteId, noteId));
        
      return backlinks;
    } catch (error) {
      throw new Error(`Failed to get backlinks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets all outbound links from a note (notes this note links to)
   */
  async getOutboundLinks(noteId: string): Promise<NoteLink[]> {
    try {
      const outboundLinks = await db.select().from(noteLinks)
        .where(eq(noteLinks.sourceNoteId, noteId));
        
      return outboundLinks;
    } catch (error) {
      throw new Error(`Failed to get outbound links: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}