import { db } from '../db';
import { noteEmbeddings, notes } from '../db/schema';
import { eq, inArray, not, or, like } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { Note, NoteWithSimilarity } from '../../types/note';

export class EmbeddingService {
  /**
   * Generates an embedding for a note
   * Note: DeepSeek doesn't provide embeddings API, so this is a placeholder
   * For production, consider using OpenAI embeddings or a local embedding model
   */
  async generateEmbedding(note: Note): Promise<void> {
    // DeepSeek doesn't have an embeddings API
    // For now, we'll skip embedding generation and use text-based similarity
    console.warn('Embedding generation skipped - DeepSeek does not provide embeddings API');
    return;
  }

  /**
   * Finds notes similar to the given note using text-based similarity
   * Note: Since DeepSeek doesn't provide embeddings, we use text matching
   */
  async findSimilarNotes(noteId: string, limit: number = 5): Promise<NoteWithSimilarity[]> {
    try {
      // Get the target note
      const targetNote = await db.select().from(notes).where(eq(notes.id, noteId)).get();
      if (!targetNote) {
        throw new Error('Note not found');
      }

      // Extract keywords from title and content
      const keywords = this.extractKeywords(targetNote.title + ' ' + targetNote.content);

      // Find other notes that contain these keywords
      const allNotes = await db.select().from(notes).where(not(eq(notes.id, noteId)));

      // Calculate similarity scores based on keyword overlap
      const similarities = allNotes.map(note => {
        const noteText = (note.title + ' ' + note.content).toLowerCase();
        const targetText = (targetNote.title + ' ' + targetNote.content).toLowerCase();

        // Simple Jaccard similarity
        const noteWords = new Set(noteText.split(/\s+/));
        const targetWords = new Set(targetText.split(/\s+/));

        const intersection = new Set([...noteWords].filter(x => targetWords.has(x)));
        const union = new Set([...noteWords, ...targetWords]);

        const similarity = union.size > 0 ? intersection.size / union.size : 0;

        return {
          noteId: note.id,
          similarity
        };
      });

      // Sort by similarity (descending) and take top results
      similarities.sort((a, b) => b.similarity - a.similarity);
      const topSimilarities = similarities.slice(0, limit);

      // Get the full note data for the similar notes
      const similarNoteIds = topSimilarities.map(sim => sim.noteId);

      if (similarNoteIds.length === 0) {
        return [];
      }

      // Use inArray to efficiently query for multiple specific note IDs
      const resultNotes = await db.select().from(notes)
        .where(inArray(notes.id, similarNoteIds));

      // Sort results to match the similarity order and include similarity scores
      const resultWithScores = resultNotes.map(note => {
        const similarityObj = topSimilarities.find(sim => sim.noteId === note.id);
        return {
          ...note,
          similarity: similarityObj?.similarity || 0
        };
      });

      // Sort by similarity score
      return resultWithScores.sort((a, b) => {
        return topSimilarities.findIndex(sim => sim.noteId === b.id) -
               topSimilarities.findIndex(sim => sim.noteId === a.id);
      });
    } catch (error) {
      console.error('Error finding similar notes:', error);
      throw new Error(`Failed to find similar notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extracts meaningful keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction: remove common words, lowercase, split
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
  }
}