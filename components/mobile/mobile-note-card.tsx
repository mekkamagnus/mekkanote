import Link from 'next/link';
import { Note } from '@/types/note';

interface MobileNoteCardProps {
  note: Note;
}

export default function MobileNoteCard({ note }: MobileNoteCardProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Link href={`/notes/${note.id}`} className="mobile-note-card">
      <span className="mobile-note-card-icon">📄</span>
      <div className="mobile-note-card-content">
        <div className="mobile-note-card-title">{note.title}</div>
        <div className="mobile-note-card-preview">
          {note.content.substring(0, 100)}
          {note.content.length > 100 ? '...' : ''}
        </div>
      </div>
      <div className="mobile-note-card-date">{formatDate(note.createdAt)}</div>
    </Link>
  );
}
