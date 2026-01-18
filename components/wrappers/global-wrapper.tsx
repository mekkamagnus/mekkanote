"use client";

import { useState, useEffect } from 'react';
import { CommandPaletteProvider } from '../global/command-palette-provider';
import { Note } from '@/types/note';

export default function GlobalWrapper({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);

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
        console.error('Error fetching notes for command palette:', error);
      }
    };

    fetchNotes();
  }, []);

  return (
    <CommandPaletteProvider notes={notes}>
      {children}
    </CommandPaletteProvider>
  );
}