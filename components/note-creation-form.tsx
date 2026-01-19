"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ObsidianMarkdownEditor from "@/components/editor/obsidian-markdown-editor";

export default function NoteCreationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const defaultContent = `# ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

`;

  const handleSave = async (content: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
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
        throw new Error(errorData.error || 'Failed to create note');
      }

      const newNote = await response.json();
      router.push(`/notes/${newNote.id}`);
      router.refresh();
    } catch (err) {
      console.error('Error creating note:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ObsidianMarkdownEditor
      initialContent={defaultContent}
      onSave={handleSave}
      onCancel={() => router.push('/notes')}
      placeholder="# Start writing..."
    />
  );
}