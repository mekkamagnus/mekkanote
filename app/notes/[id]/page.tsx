"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
      <div className="mobile-full-screen" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ color: 'var(--text-primary)' }}>Loading note...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-full-screen" style={{ background: 'var(--bg-primary)', padding: '1rem' }}>
        <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Error: {error}</div>
        <Link href="/notes">
          <button style={{
            padding: '0.5rem 1rem',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}>Back to Notes</button>
        </Link>
      </div>
    );
  }

  const handleAcceptLink = async (targetNoteId: string) => {
    try {
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

      setSuggestedLinks(prev => prev.filter(link => link.id !== targetNoteId));
    } catch (error) {
      console.error('Error accepting link:', error);
    }
  };

  const handleDismissLink = (targetNoteId: string) => {
    setSuggestedLinks(prev => prev.filter(link => link.id !== targetNoteId));
  };

  if (!note) {
    return (
      <div className="mobile-full-screen" style={{ background: 'var(--bg-primary)', padding: '1rem' }}>
        <div style={{ color: 'var(--warning)', marginBottom: '1rem' }}>Note not found</div>
        <Link href="/notes">
          <button style={{
            padding: '0.5rem 1rem',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}>Back to Notes</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mobile-full-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Minimal Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border)',
      }}>
        <Link href="/notes">
          <button style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '1.25rem',
            padding: '0.5rem',
          }}>←</button>
        </Link>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span style={{ fontSize: '1.25rem', cursor: 'pointer' }}>⋯</span>
        </div>
      </div>

      {/* Reading View */}
      <div className="mobile-content-area" style={{ padding: '1.5rem 1.5rem 1rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          {note.title}
        </h1>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {note.createdAt.toLocaleDateString()} • Edited {note.updatedAt.toLocaleDateString()}
        </div>

        <NoteContentRenderer content={note.content} />

        {/* AI Suggestions */}
        {suggestedLinks.length > 0 && (
          <div className="ai-suggestions" style={{ marginTop: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              marginBottom: '0.75rem',
              color: 'var(--accent)',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}>
              <span>🤖</span> AI Suggestions
            </div>
            {suggestedLinks.map((link, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem',
                background: 'var(--bg-secondary)',
                borderRadius: '6px',
                marginBottom: '0.375rem',
              }}>
                <div style={{ fontSize: '0.875rem' }}>
                  <strong>Connection:</strong> {link.title} ({(link.relevanceScore * 100).toFixed(0)}%)
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button
                    onClick={() => handleAcceptLink(link.id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--success)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >✓</button>
                  <button
                    onClick={() => handleDismissLink(link.id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--danger)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {suggestedTags.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>TAGS</h3>
            {suggestedTags.map((tag, index) => (
              <span key={index} className="tag suggested">+ {tag}</span>
            ))}
          </div>
        )}

        {/* Outbound Links */}
        {outboundLinks.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>LINKS TO</h3>
            {outboundLinks.map((link) => (
              <Link key={link.id} href={`/notes/${link.targetNoteId}`}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '6px',
                  marginBottom: '0.375rem',
                }}>
                  <span>📄</span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>
                    {link.targetNoteId}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Backlinks */}
        {backlinks.length > 0 && (
          <div style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>LINKED FROM</h3>
            {backlinks.map((link) => (
              <Link key={link.id} href={`/notes/${link.sourceNoteId}`}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '6px',
                  marginBottom: '0.375rem',
                }}>
                  <span>📄</span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>
                    {link.sourceNoteId}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        padding: '0.5rem 1rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <Link href={`/notes/${note.id}/edit`} style={{ flex: 1 }}>
          <button style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500,
          }}>✏️ Edit</button>
        </Link>
        <button style={{
          padding: '0.5rem 0.75rem',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}>[[ ]]</button>
        <button style={{
          padding: '0.5rem 0.75rem',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}>⋯</button>
      </div>
    </div>
  );
}