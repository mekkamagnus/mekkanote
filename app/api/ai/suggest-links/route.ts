import { NextRequest } from 'next/server';
import { EmbeddingService } from '@/lib/services/embedding-service';
import { NoteService } from '@/lib/services/note-service';

const embeddingService = new EmbeddingService();
const noteService = new NoteService();

export async function POST(request: NextRequest) {
  try {
    const { noteId, limit = 5 } = await request.json();

    if (!noteId) {
      return new Response(JSON.stringify({ error: 'noteId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify the note exists
    const note = await noteService.read(noteId);
    if (!note) {
      return new Response(JSON.stringify({ error: 'Note not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find similar notes using embeddings
    const similarNotes = await embeddingService.findSimilarNotes(noteId, limit);

    // Format the response with relevance scores
    const suggestions = similarNotes.map(note => ({
      id: note.id,
      title: note.title,
      relevanceScore: note.similarity,
    }));

    return new Response(JSON.stringify(suggestions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating link suggestions:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate link suggestions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}