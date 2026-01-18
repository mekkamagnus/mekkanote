import { db } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// GET a single note by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noteId = parseInt(id, 10);

    if (isNaN(noteId)) {
      return new Response(JSON.stringify({ error: 'Invalid note ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const note = await db.select().from(notes).where(eq(notes.id, noteId)).get();

    if (!note) {
      return new Response(JSON.stringify({ error: 'Note not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(note), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch note' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PUT (update) a single note by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noteId = parseInt(id, 10);

    if (isNaN(noteId)) {
      return new Response(JSON.stringify({ error: 'Invalid note ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { title, content } = await request.json();

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [updatedNote] = await db.update(notes)
      .set({
        title,
        content,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, noteId))
      .returning();

    if (!updatedNote) {
      return new Response(JSON.stringify({ error: 'Note not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updatedNote), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating note:', error);
    return new Response(JSON.stringify({ error: 'Failed to update note' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE a single note by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noteId = parseInt(id, 10);

    if (isNaN(noteId)) {
      return new Response(JSON.stringify({ error: 'Invalid note ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const deletedRows = await db.delete(notes).where(eq(notes.id, noteId));

    if (deletedRows.changes === 0) {
      return new Response(JSON.stringify({ error: 'Note not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Note deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete note' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}