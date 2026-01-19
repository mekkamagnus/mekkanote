"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ObsidianMarkdownEditor from "@/components/editor/obsidian-markdown-editor";

export default function EditNotePage() {
  const { id } = useParams();
  const [initialContent, setInitialContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        if (typeof id !== 'string') {
          throw new Error('Invalid note ID');
        }

        const response = await fetch(`/api/notes/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Note not found');
          }
          throw new Error('Failed to fetch note');
        }

        const note = await response.json();
        setInitialContent(note.content);
      } catch (err) {
        console.error('Error fetching note:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNote();
    }
  }, [id]);

  const handleSave = async (content: string) => {
    if (typeof id !== 'string') {
      throw new Error('Invalid note ID');
    }

    const response = await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: content.split('\n')[0].replace(/^#\s+/, '') || 'Untitled Note',
        content,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update note');
    }

    window.location.href = `/notes/${id}`;
  };

  if (loading) {
    return (
      <div className="mobile-full-screen" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ color: 'var(--text-primary)' }}>Loading note...</div>
        </div>
      </div>
    );
  }

  return (
    <ObsidianMarkdownEditor
      initialContent={initialContent}
      onSave={handleSave}
      onCancel={() => window.history.back()}
      placeholder="# Start writing..."
    />
  );
}