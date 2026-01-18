"use client";

import { useState, useEffect } from 'react';
import { LinkPreview } from '@/lib/services/link-unfurl-service';

interface UnfurledLinkProps {
  url: string;
}

export default function UnfurledLink({ url }: UnfurledLinkProps) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await fetch('/api/unfurl', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error('Failed to unfurl link');
        }

        const data = await response.json();
        setPreview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error unfurling link:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (loading) {
    return (
      <div className="my-4 p-4 border rounded-lg bg-gray-50">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="my-4 p-4 border rounded-lg bg-gray-50">
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
          {url}
        </a>
      </div>
    );
  }

  return (
    <div className="my-4 p-4 border rounded-lg bg-white shadow-sm">
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block no-underline hover:no-underline"
      >
        {preview.thumbnail && (
          <div className="mb-3">
            <img
              src={preview.thumbnail}
              alt={preview.title || 'Preview thumbnail'}
              className="w-full h-auto rounded-md max-h-60 object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="space-y-1">
          <h4 className="font-semibold text-gray-900">{preview.title}</h4>
          <p className="text-sm text-gray-600 line-clamp-2">{preview.description}</p>
          <div className="text-xs text-gray-500 flex items-center">
            {preview.siteName && <span>{preview.siteName}</span>}
            {!preview.siteName && <span className="truncate">{new URL(url).hostname}</span>}
          </div>
        </div>
      </a>
    </div>
  );
}