import { openai } from '../ai/config';
import { db } from '../db';
import { noteEmbeddings, notes } from '../db/schema';
import { eq, inArray, not } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { Note, NoteWithSimilarity } from '../../types/note';

export class EmbeddingService {
  /**
   * Generates an embedding for a note using OpenAI's text-embedding-3-small model
   */
  async generateEmbedding(note: Note): Promise<void> {
    try {
      // Call OpenAI to generate the embedding
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: `${note.title}\n\n${note.content}`,
      });

      const embedding = response.data[0].embedding;

      // Store the embedding in the database
      await db.insert(noteEmbeddings).values({
        id: uuidv7(),
        noteId: note.id,
        embedding: JSON.stringify(embedding), // Store as JSON string
        modelName: 'text-embedding-3-small',
      });
    } catch (error) {
      console.error('Error generating embedding:', error);
      
      // Return empty array if API key is missing or invalid
      if (error instanceof Error && 
          (error.message.includes('401') || 
           error.message.includes('api_key') || 
           error.message.includes('authentication'))) {
        console.warn('OpenAI API error - check your API key');
        return;
      }
      
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Finds notes similar to the given note using vector similarity
   */
  async findSimilarNotes(noteId: string, limit: number = 5): Promise<NoteWithSimilarity[]> {
    try {
      // Get the note to find embeddings for
      const note = await db.select().from(notes).where(eq(notes.id, noteId)).get();
      if (!note) {
        throw new Error('Note not found');
      }

      // Get the embedding for this note
      const noteEmbeddingRecord = await db.select()
        .from(noteEmbeddings)
        .where(eq(noteEmbeddings.noteId, noteId))
        .get();
      
      if (!noteEmbeddingRecord) {
        // If no embedding exists, generate one
        await this.generateEmbedding(note);
        return []; // Return empty array since we just generated the embedding
      }

      // Parse the embedding
      const targetEmbedding = JSON.parse(noteEmbeddingRecord.embedding) as number[];

      // Get all other embeddings from the database
      const allEmbeddings = await db.select()
        .from(noteEmbeddings)
        .where((not(eq(noteEmbeddings.noteId, noteId))));

      // Calculate cosine similarity between the target embedding and all other embeddings
      const similarities = allEmbeddings.map(embeddingRecord => {
        const compareEmbedding = JSON.parse(embeddingRecord.embedding) as number[];
        const similarity = this.cosineSimilarity(targetEmbedding, compareEmbedding);

        return {
          noteId: embeddingRecord.noteId,
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
   * Calculates cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += Math.pow(vecA[i], 2);
      normB += Math.pow(vecB[i], 2);
    }

    if (normA === 0 || normB === 0) {
      return 0; // If one of the vectors is zero, similarity is 0
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}