import { NextRequest } from 'next/server';
import { NoteService } from '@/lib/services/note-service';

const noteService = new NoteService();

export async function GET() {
  try {
    const allNotes = await noteService.getAll();
    return new Response(JSON.stringify(allNotes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch notes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json();

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newNote = await noteService.create(title, content);

    return new Response(JSON.stringify(newNote), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return new Response(JSON.stringify({ error: 'Failed to create note' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}