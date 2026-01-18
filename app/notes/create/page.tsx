import NoteCreationForm from '@/components/note-creation-form';

export default function CreateNotePage() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Note</h1>
        <NoteCreationForm />
      </div>
    </div>
  );
}