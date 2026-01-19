import { deepseek } from '../ai/config';
import { Note } from '../../types/note';

export class AIService {
  private readonly cache: Map<string, { tags: string[]; timestamp: number }> = new Map();

  /**
   * Generates tag suggestions for a note based on its content
   */
  async suggestTags(note: Note): Promise<string[]> {
    // Create a cache key based on note content
    const cacheKey = `${note.id}-${note.updatedAt.getTime()}`;
    
    // Check if we have a cached result
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
      return cached.tags;
    }

    try {
      // Prepare the prompt for tag generation
      const prompt = `
        Analyze the following note and suggest 3-5 relevant tags that would help categorize and organize it.
        The tags should be concise, descriptive, and relevant to the content.
        Respond with only the tags, separated by commas, nothing else.
        
        Note Title: ${note.title}
        Note Content: ${note.content.substring(0, 2000)}  // Limit content to avoid token issues
      `;

      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates relevant tags for notes. Respond with only comma-separated tags, nothing else.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
      });

      // Extract the tags from the response
      const rawResponse = response.choices[0]?.message?.content?.trim() || '';
      const tags = rawResponse
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 5); // Limit to 5 tags

      // Cache the result
      this.cache.set(cacheKey, { tags, timestamp: Date.now() });

      return tags;
    } catch (error) {
      console.error('Error generating tag suggestions:', error);
      
      // Return empty array if API key is missing or invalid
      if (error instanceof Error &&
          (error.message.includes('401') ||
           error.message.includes('api_key') ||
           error.message.includes('authentication'))) {
        console.warn('DeepSeek API error - check your API key');
        return [];
      }
      
      throw new Error(`Failed to generate tag suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}