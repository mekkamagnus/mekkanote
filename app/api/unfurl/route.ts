import { NextRequest } from 'next/server';
import { LinkUnfurlService } from '@/lib/services/link-unfurl-service';

const unfurlService = new LinkUnfurlService();

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const preview = await unfurlService.fetchPreview(url);

    return new Response(JSON.stringify(preview), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error unfurling link:', error);
    return new Response(JSON.stringify({ error: 'Failed to unfurl link' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}