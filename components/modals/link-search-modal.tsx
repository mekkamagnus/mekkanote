import { useState, useEffect, useRef, useMemo } from 'react';
import { Note } from '@/types/note';

interface LinkSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (note: Note) => void;
  notes: Note[];
}

export default function LinkSearchModal({
  isOpen,
  onClose,
  onSelectNote,
  notes
}: LinkSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Compute filtered notes directly
  const filteredNotes = useMemo(() => {
    return searchTerm.trim() === ''
      ? notes
      : notes.filter(note =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
  }, [searchTerm, notes]);

  useEffect(() => {
    if (isOpen) {
      // Focus the input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    // Scroll to selected item
    if (listRef.current && selectedIndex >= 0) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredNotes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredNotes[selectedIndex]) {
        handleSelectNote(filteredNotes[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelectNote = (note: Note) => {
    onSelectNote(note);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-md rounded-lg border bg-popover p-0 text-popover-foreground shadow-md outline-none">
        <div className="flex items-center border-b px-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-4 w-4 shrink-0 opacity-50"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <input
            ref={inputRef}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes to link..."
            onKeyDown={handleKeyDown}
          />
        </div>
        <div
          ref={listRef}
          className="max-h-64 overflow-y-auto"
        >
          {filteredNotes.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">No notes found.</div>
          ) : (
            filteredNotes.map((note, index) => (
              <div
                key={note.id}
                className={`p-2 cursor-pointer ${
                  index === selectedIndex ? 'bg-accent' : ''
                }`}
                onClick={() => handleSelectNote(note)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{note.title}</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {note.content.substring(0, 100)}...
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}