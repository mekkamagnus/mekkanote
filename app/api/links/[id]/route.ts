import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { noteLinks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// DELETE a link by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return new Response(JSON.stringify({ error: 'Invalid link ID format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete the link by ID
    const result = await db.delete(noteLinks)
      .where(eq(noteLinks.id, id));

    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: 'Link not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Link deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting link:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete link' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}