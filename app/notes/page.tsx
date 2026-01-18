"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NotesList from "@/components/notes-list";
import { Button } from "@/components/ui/button";
import { CommandPaletteProvider } from "@/components/global/command-palette-provider";
import { Note } from "@/types/note";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Notes</h1>
          <div className="flex items-center space-x-2">
            <MobileNavigation />
            <Link href="/notes/create">
              <Button>Create New Note</Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <NotesList />
      </div>
    </CommandPaletteProvider>
  );
}