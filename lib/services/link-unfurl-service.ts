import axios from 'axios';

export interface LinkPreview {
  title: string;
  description: string;
  thumbnail?: string;
  siteName?: string;
  type?: string;
}

export class LinkUnfurlService {
  private readonly cache: Map<string, { data: LinkPreview; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetches metadata for a URL
   */
  async fetchPreview(url: string): Promise<LinkPreview | null> {
    // Validate URL
    try {
      new URL(url);
    } catch {
      console.error('Invalid URL provided:', url);
      return null;
    }

    // Check cache first
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Check if it's a Twitter/X URL
      if (this.isTwitterUrl(url)) {
        const twitterPreview = await this.fetchTwitterPreview(url);
        if (twitterPreview) {
          this.cache.set(url, { data: twitterPreview, timestamp: Date.now() });
          return twitterPreview;
        }
      }
      
      // Check if it's a YouTube URL
      if (this.isYouTubeUrl(url)) {
        const youtubePreview = await this.fetchYouTubePreview(url);
        if (youtubePreview) {
          this.cache.set(url, { data: youtubePreview, timestamp: Date.now() });
          return youtubePreview;
        }
      }

      // For other URLs, we could implement generic metadata extraction
      // For now, return null if we don't have specific handling
      return null;
    } catch (err) {
      console.error('Error fetching link preview:', err);
      return null;
    }
  }

  private isTwitterUrl(url: string): boolean {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.includes('twitter.com') || parsedUrl.hostname.includes('x.com');
  }

  private isYouTubeUrl(url: string): boolean {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be');
  }

  private async fetchTwitterPreview(url: string): Promise<LinkPreview | null> {
    try {
      // Use Twitter's oEmbed API to get tweet info
      const response = await axios.get(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`, {
        timeout: 2000, // 2 second timeout
      });

      const data = response.data;
      return {
        title: 'Twitter Post',
        description: data.author_name,
        siteName: 'Twitter',
        type: 'social',
      };
    } catch (error) {
      console.error('Error fetching Twitter preview:', error);
      // Return a fallback preview
      return {
        title: 'Twitter Post',
        description: 'Twitter post preview',
        siteName: 'Twitter',
        type: 'social',
      };
    }
  }

  private async fetchYouTubePreview(url: string): Promise<LinkPreview | null> {
    // Extract video ID from YouTube URL
    const videoId = this.extractYouTubeVideoId(url);
    if (!videoId) {
      return null;
    }

    try {
      // Use oEmbed API to get video info
      const response = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
        timeout: 2000, // 2 second timeout
      });

      const data = response.data;
      return {
        title: data.title,
        description: data.author_name,
        thumbnail: data.thumbnail_url,
        siteName: 'YouTube',
        type: 'video',
      };
    } catch (error) {
      console.error('Error fetching YouTube preview:', error);
      // Return a fallback preview
      return {
        title: 'YouTube Video',
        description: 'YouTube video preview',
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        siteName: 'YouTube',
        type: 'video',
      };
    }
  }

  private extractYouTubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    return null;
  }
}