"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Note } from "@/types/note";
import { NoteLink } from "@/types/link";
import NoteContentRenderer from "@/components/content/note-content-renderer";

export default function NoteDetailPage() {
  const { id } = useParams();
  const [note, setNote] = useState<Note | null>(null);
  const [outboundLinks, setOutboundLinks] = useState<NoteLink[]>([]);
  const [backlinks, setBacklinks] = useState<NoteLink[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedLinks, setSuggestedLinks] = useState<Array<{ id: string; title: string; relevanceScore: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNoteData = async () => {
      try {
        if (typeof id !== 'string') {
          throw new Error('Invalid note ID');
        }

        // Fetch the note
        const noteResponse = await fetch(`/api/notes/${id}`);
        if (!noteResponse.ok) {
          if (noteResponse.status === 404) {
            throw new Error('Note not found');
          }
          throw new Error('Failed to fetch note');
        }
        const noteData = await noteResponse.json();

        // Convert timestamp numbers to Date objects to match our Note type
        const noteWithDates: Note = {
          ...noteData,
          createdAt: new Date(noteData.createdAt),
          updatedAt: new Date(noteData.updatedAt),
        };

        setNote(noteWithDates);

        // Fetch backlinks for this note
        const backlinksResponse = await fetch(`/api/notes/${id}/backlinks`);
        if (backlinksResponse.ok) {
          const backlinksData = await backlinksResponse.json();
          setBacklinks(backlinksData);
        }

        // TODO: Fetch outbound links once we have an API for that
        // For now, we'll parse the note content to find [[id]] patterns
        const linkPattern = /\[\[([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\]\[([^\]]+)\]\]/g;
        const foundLinks = [...noteData.content.matchAll(linkPattern)];
        const linkIds = foundLinks.map(match => match[1]);

        // Fetch details for each linked note
        const linkDetailsPromises = linkIds.map(async (linkId) => {
          const response = await fetch(`/api/notes/${linkId}`);
          if (response.ok) {
            return await response.json();
          }
          return null;
        });

        const linkDetails = await Promise.all(linkDetailsPromises);
        const validLinks = linkDetails.filter(detail => detail !== null);

        // Convert to NoteLink format for display
        const outboundLinksTemp: NoteLink[] = validLinks.map(detail => ({
          id: detail.id,
          sourceNoteId: id,
          targetNoteId: detail.id,
          createdAt: new Date(detail.createdAt),
        }));

        setOutboundLinks(outboundLinksTemp);

        // Fetch AI tag suggestions
        try {
          const tagsResponse = await fetch('/api/ai/suggest-tags', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ noteId: id, noteTitle: noteWithDates.title, noteContent: noteWithDates.content }),
          });

          if (tagsResponse.ok) {
            const tagsData = await tagsResponse.json();
            setSuggestedTags(tagsData);
          }
        } catch (tagErr) {
          console.error('Error fetching tag suggestions:', tagErr);
          // Don't set an error state for tag suggestions since it's not critical
        }

        // Fetch AI link suggestions
        try {
          const linksResponse = await fetch('/api/ai/suggest-links', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ noteId: id }),
          });

          if (linksResponse.ok) {
            const linksData = await linksResponse.json();
            setSuggestedLinks(linksData);
          }
        } catch (linkErr) {
          console.error('Error fetching link suggestions:', linkErr);
          // Don't set an error state for link suggestions since it's not critical
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        console.error('Error fetching note data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNoteData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading note...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
        <div className="mt-4">
          <Link href="/notes">
            <Button>Back to Notes</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAcceptLink = async (targetNoteId: string) => {
    try {
      // Create a link between current note and the suggested note
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceNoteId: id as string,
          targetNoteId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create link');
      }

      // Remove the suggestion from the list
      setSuggestedLinks(prev => prev.filter(link => link.id !== targetNoteId));
    } catch (error) {
      console.error('Error accepting link:', error);
    }
  };

  const handleDismissLink = (targetNoteId: string) => {
    // Remove the suggestion from the list
    setSuggestedLinks(prev => prev.filter(link => link.id !== targetNoteId));
  };

  if (!note) {
    return (
      <div className="container mx-auto py-10">
        <div className="p-4 bg-yellow-100 text-yellow-700 rounded-md">
          Note not found
        </div>
        <div className="mt-4">
          <Link href="/notes">
            <Button>Back to Notes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>{note.title}</CardTitle>
          <div className="text-sm text-gray-500">
            Created: {note.createdAt.toLocaleString()} | Updated: {note.updatedAt.toLocaleString()}
          </div>
        </CardHeader>
        <CardContent>
          <NoteContentRenderer content={note.content} />

          {/* Outbound Links Section */}
          {outboundLinks.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Links</h3>
              <ul className="space-y-1">
                {outboundLinks.map((link) => (
                  <li key={link.id} className="ml-4">
                    <Link href={`/notes/${link.targetNoteId}`} className="text-blue-600 hover:underline">
                      {link.targetNoteId}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Backlinks Section */}
          {backlinks.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Backlinks</h3>
              <ul className="space-y-1">
                {backlinks.map((link) => (
                  <li key={link.id} className="ml-4">
                    <Link href={`/notes/${link.sourceNoteId}`} className="text-blue-600 hover:underline">
                      {link.sourceNoteId}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Suggested Tags Section */}
          {suggestedTags.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">AI Suggested Tags</h3>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggested Links Section */}
          {suggestedLinks.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Suggested Links</h3>
              <div className="space-y-2">
                {suggestedLinks.map((link, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <Link href={`/notes/${link.id}`} className="text-blue-600 hover:underline flex-grow">
                      {link.title}
                    </Link>
                    <div className="text-sm text-gray-500">
                      Relevance: {(link.relevanceScore * 100).toFixed(0)}%
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleAcceptLink(link.id)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDismissLink(link.id)}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/notes">
            <Button variant="outline">Back to Notes</Button>
          </Link>
          <Link href={`/notes/${note.id}/edit`}>
            <Button>Edit Note</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}