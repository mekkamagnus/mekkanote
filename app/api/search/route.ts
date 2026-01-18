import { NextRequest } from 'next/server';
import { SearchService } from '@/lib/services/search-service';

const searchService = new SearchService();

export async function GET(request: NextRequest) {
  try {
    // Extract query parameter from URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');
    
    if (!query || query.trim().length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Optional parameters for pagination
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Perform the search
    const results = await searchService.searchNotes(query, limit, offset);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error searching notes:', error);
    return new Response(JSON.stringify({ error: 'Failed to search notes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}