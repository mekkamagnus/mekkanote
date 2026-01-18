"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

interface NoteFormData {
  title: string;
  content: string;
}

export default function NoteCreationForm() {
  const router = useRouter();
  // Pre-fill with current timestamp and default org-mode template
  const defaultContent = `#+TITLE:
#+DATE: ${new Date().toISOString().split('T')[0]}
#+AUTHOR:
#+DESCRIPTION:

* Introduction

* Main Content

* Conclusion

`;
  const [formData, setFormData] = useState<NoteFormData>({
    title: `Note ${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`,
    content: defaultContent
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create note');
      }

      const newNote = await response.json();
      
      // Reset form
      setFormData({ title: "", content: "" });
      
      // Redirect to the newly created note or notes list
      router.push(`/notes/${newNote.id}`);
      router.refresh(); // Refresh to update any cached data
    } catch (err) {
      console.error('Error creating note:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Note</CardTitle>
        <CardDescription>Add a title and content for your new note</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter note title"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your note content here..."
              required
              rows={8}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Note'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}