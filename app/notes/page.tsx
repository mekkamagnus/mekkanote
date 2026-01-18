import Link from "next/link";
import NotesList from "@/components/notes-list";
import { Button } from "@/components/ui/button";

export default function NotesPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Notes</h1>
        <Link href="/notes/create">
          <Button>Create New Note</Button>
        </Link>
      </div>
      <NotesList />
    </div>
  );
}