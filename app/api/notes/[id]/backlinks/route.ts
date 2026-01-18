import { NextRequest } from 'next/server';
import { LinkService } from '@/lib/services/link-service';

const linkService = new LinkService();

// GET backlinks for a specific note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return new Response(JSON.stringify({ error: 'Invalid note ID format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const backlinks = await linkService.getBacklinks(id);

    return new Response(JSON.stringify(backlinks), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching backlinks:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch backlinks' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}