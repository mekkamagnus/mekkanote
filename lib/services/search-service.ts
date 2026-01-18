import { db } from '../db';
import { notes, tags } from '../db/schema';
import { eq, ilike, or } from 'drizzle-orm';
import { Note } from '../../types/note';

export class SearchService {
  /**
   * Searches notes by title, content, and tags
   */
  async searchNotes(query: string, limit: number = 20, offset: number = 0): Promise<Note[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      // Clean up the query string
      const searchTerm = `%${query.trim()}%`;

      // Search across title, content, and tags
      const results = await db.select().from(notes)
        .where(or(
          ilike(notes.title, searchTerm),
          ilike(notes.content, searchTerm)
        ))
        .orderBy(notes.title) // Prioritize title matches first
        .limit(limit)
        .offset(offset);

      return results;
    } catch (error) {
      throw new Error(`Failed to search notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Searches notes by tags
   */
  async searchByTags(tagNames: string[], limit: number = 20, offset: number = 0): Promise<Note[]> {
    if (!tagNames || tagNames.length === 0) {
      return [];
    }

    try {
      // Find notes that have any of the specified tags
      const noteIdsWithTags = await db.select({ noteId: tags.noteId }).from(tags)
        .where(
          or(...tagNames.map(tag => ilike(tags.name, `%${tag}%`)))
        );

      if (noteIdsWithTags.length === 0) {
        return [];
      }

      // Get the actual notes
      const noteIds = noteIdsWithTags.map((row: { noteId: string }) => row.noteId);
      const results = await db.select().from(notes)
        .where(
          or(...noteIds.map((id: string) => eq(notes.id, id)))
        )
        .orderBy(notes.title)
        .limit(limit)
        .offset(offset);

      return results;
    } catch (error) {
      throw new Error(`Failed to search notes by tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Full search combining text and tag search
   */
  async fullSearch(query: string, tagNames?: string[], limit: number = 20, offset: number = 0): Promise<Note[]> {
    if ((!query || query.trim().length === 0) && (!tagNames || tagNames.length === 0)) {
      return [];
    }

    try {
      const results: Note[] = [];

      // If there's a text query, search in notes
      if (query && query.trim().length > 0) {
        const textResults = await this.searchNotes(query, limit, offset);
        results.push(...textResults);
      }

      // If there are tags to search, search by tags
      if (tagNames && tagNames.length > 0) {
        const tagResults = await this.searchByTags(tagNames, limit, offset);
        // Combine results, avoiding duplicates
        const uniqueResults = [...results];
        for (const tagResult of tagResults) {
          if (!uniqueResults.some(note => note.id === tagResult.id)) {
            uniqueResults.push(tagResult);
          }
        }
        return uniqueResults;
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to perform full search: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}