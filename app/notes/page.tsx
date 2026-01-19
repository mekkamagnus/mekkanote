"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NotesList from "@/components/notes-list";
import { CommandPaletteProvider } from "@/components/global/command-palette-provider";
import { Note } from "@/types/note";
import MobileNavigation from "@/components/navigation/mobile-navigation";

export default function NotesPage() {
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
      <div className="mobile-full-screen" style={{ background: 'var(--bg-primary)' }}>
        {/* Minimal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MobileNavigation />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>MekkaNote</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/notes/create">
              <span style={{ fontSize: '1.25rem', cursor: 'pointer' }}>+</span>
            </Link>
          </div>
        </div>

        {/* Notes List */}
        <div className="mobile-content-area">
          <NotesList />
        </div>
      </div>
    </CommandPaletteProvider>
  );
}