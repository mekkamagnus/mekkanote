import { NextRequest } from 'next/server';
import { LinkService } from '@/lib/services/link-service';

const linkService = new LinkService();

export async function POST(request: NextRequest) {
  try {
    const { sourceNoteId, targetNoteId } = await request.json();

    if (!sourceNoteId || !targetNoteId) {
      return new Response(JSON.stringify({ error: 'sourceNoteId and targetNoteId are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sourceNoteId) || !uuidRegex.test(targetNoteId)) {
      return new Response(JSON.stringify({ error: 'Invalid note ID format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newLink = await linkService.createLink(sourceNoteId, targetNoteId);

    return new Response(JSON.stringify(newLink), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating link:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create link' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}