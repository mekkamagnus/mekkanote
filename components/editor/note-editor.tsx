"use client";

import { useState, useEffect, useRef } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAutoSave } from '@/hooks/use-autosave';
import LinkSearchModal from '@/components/modals/link-search-modal';
import { Note } from '@/types/note';

interface NoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  noteId?: string;
  onSave?: (value: string) => Promise<void>;
}

export default function NoteEditor({
  value,
  onChange,
  placeholder = "Write your note content here using org-mode syntax...",
  label = "Content",
  autoFocus = true,
  disabled = false,
  noteId,
  onSave
}: NoteEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [lastTwoChars, setLastTwoChars] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local value when prop changes
  if (localValue !== value) {
    setLocalValue(value);
  }

  // Fetch notes for the modal
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch('/api/notes');
        if (response.ok) {
          type ApiNote = {
            id: string;
            title: string;
            content: string;
            createdAt: number;
            updatedAt: number;
          };

          const data: ApiNote[] = await response.json();
          // Convert timestamp numbers to Date objects to match our Note type
          const notesWithDates = data.map((note: ApiNote) => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
          }));
          setNotes(notesWithDates);
        }
      } catch (error) {
        console.error('Error fetching notes for link modal:', error);
      }
    };

    fetchNotes();
  }, []);

  // Define save function if not provided
  const handleSave = async (content: string) => {
    if (onSave) {
      await onSave(content);
    } else if (noteId) {
      // Default save implementation - fetch current note to preserve title
      const noteResponse = await fetch(`/api/notes/${noteId}`);
      if (!noteResponse.ok) {
        throw new Error('Could not fetch existing note data');
      }

      const noteData = await noteResponse.json();

      // Update the note with both title and new content
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: noteData.title,
          content
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save note');
      }
    }
  };

  const { status, error, handleBlur } = useAutoSave({
    value: localValue,
    onSave: handleSave,
    delay: 30000, // 30 seconds
    onError: (err) => console.error('Auto-save error:', err)
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // Track the last two characters before the cursor position
    if (cursorPosition >= 2) {
      setLastTwoChars(newValue.substring(cursorPosition - 2, cursorPosition));
    } else {
      setLastTwoChars("");
    }

    setLocalValue(newValue);
    onChange(newValue); // Still notify parent of changes
  };

  // Effect to detect [[ trigger
  useEffect(() => {
    if (lastTwoChars === '[[' && textareaRef.current) {
      // Remove the [[ from the text since we'll add the selected link
      const cursorPos = textareaRef.current.selectionStart;
      const newText = localValue.substring(0, cursorPos - 2) + localValue.substring(cursorPos);
      setLocalValue(newText);
      onChange(newText);

      // Update cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(cursorPos - 2, cursorPos - 2);
        }
      }, 0);

      // Show modal after state updates
      setTimeout(() => {
        setShowLinkModal(true);
      }, 0);
    }
  }, [lastTwoChars, localValue, onChange]);

  const handleSelectNote = (selectedNote: Note) => {
    if (textareaRef.current) {
      const cursorPos = textareaRef.current.selectionStart;
      const textBefore = localValue.substring(0, cursorPos);
      const textAfter = localValue.substring(cursorPos);
      const newText = `${textBefore}[[${selectedNote.id}][${selectedNote.title}]]${textAfter}`;

      setLocalValue(newText);
      onChange(newText);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-2">
        {label && (
          <Label htmlFor="note-editor">{label}</Label>
        )}
        <Textarea
          ref={textareaRef}
          id="note-editor"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          rows={15}
          autoFocus={autoFocus}
          disabled={disabled}
          onBlur={handleBlur}
          className="font-mono text-sm"
        />
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {localValue.length} characters
          </div>
          <div className="text-xs text-gray-500">
            {status === 'saving' && 'Saving...'}
            {status === 'saved' && 'Saved ✓'}
            {error && <span className="text-red-500">Error: {error.message}</span>}
          </div>
        </div>
      </CardContent>
      <LinkSearchModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onSelectNote={handleSelectNote}
        notes={notes}
      />
    </Card>
  );
}