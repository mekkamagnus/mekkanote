import { NextRequest } from 'next/server';
import { AIService } from '@/lib/services/ai-service';
import { NoteService } from '@/lib/services/note-service';

const aiService = new AIService();
const noteService = new NoteService();

export async function POST(request: NextRequest) {
  try {
    const { noteId, noteContent, noteTitle } = await request.json();

    if (!noteId) {
      return new Response(JSON.stringify({ error: 'noteId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the note if content wasn't provided
    let note;
    if (noteContent && noteTitle) {
      // Use provided content
      note = {
        id: noteId,
        title: noteTitle,
        content: noteContent,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } else {
      // Fetch the note from the database
      note = await noteService.read(noteId);
      if (!note) {
        return new Response(JSON.stringify({ error: 'Note not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Generate tag suggestions
    const tags = await aiService.suggestTags(note);

    return new Response(JSON.stringify(tags), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating tag suggestions:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate tag suggestions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}