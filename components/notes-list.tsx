"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Note } from "@/types/note";
import MobileNoteCard from "@/components/mobile/mobile-note-card";

export default function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch('/api/notes');
        if (!response.ok) {
          throw new Error('Failed to fetch notes');
        }
        const data = await response.json();
        // Define the API response type (before conversion)
        type ApiNote = {
          id: string;
          title: string;
          content: string;
          createdAt: number; // Timestamp from DB
          updatedAt: number; // Timestamp from DB
        };

        // Convert timestamp numbers to Date objects to match our Note type
        const notesWithDates = data.map((note: ApiNote) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));
        setNotes(notesWithDates);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        console.error('Error fetching notes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  if (loading) {
    return (
      <div>
        {[...Array(5)].map((_, index) => (
          <div key={index} className="mobile-note-card">
            <Skeleton className="h-6 w-6" />
            <div style={{ flex: 1 }}>
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', color: 'var(--danger)' }}>
        Error: {error}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>No notes yet</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Get started by creating a new note.
        </p>
        <Link href="/notes/create">
          <Button style={{ fontSize: '0.875rem' }}>Create Note</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {notes.map((note) => (
        <MobileNoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}