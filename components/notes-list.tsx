"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Note } from "@/types/note";

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
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        Error: {error}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium">No notes yet</h3>
        <p className="text-muted-foreground">Get started by creating a new note.</p>
        <Link href="/notes/create">
          <Button className="mt-4">Create Note</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Link key={note.id} href={`/notes/${note.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>{note.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 line-clamp-2">
                {note.content.substring(0, 150)}
                {note.content.length > 150 ? '...' : ''}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Created: {new Date(note.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}