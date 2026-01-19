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
    <div className="mobile-modal-overlay">
      <div className="mobile-modal-content">
        <input
          ref={inputRef}
          className="mobile-modal-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔗 Search for notes to link..."
          onKeyDown={handleKeyDown}
        />
        <div
          ref={listRef}
          style={{ maxHeight: '300px', overflowY: 'auto' }}
        >
          {filteredNotes.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderTop: '1px solid var(--border)',
              cursor: 'pointer',
            }}>
              <span>✨</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  + Create: "{searchTerm}"
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  No exact match found
                </div>
              </div>
            </div>
          ) : (
            filteredNotes.map((note, index) => (
              <div
                key={note.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  background: index === selectedIndex ? 'var(--bg-tertiary)' : 'transparent',
                }}
                onClick={() => handleSelectNote(note)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span>📄</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {note.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {note.content.substring(0, 60)}...
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{
          padding: '0.5rem 1rem',
          fontSize: '0.625rem',
          color: 'var(--text-secondary)',
          borderTop: '1px solid var(--border)',
        }}>
          Enter to select • Esc to close
        </div>
      </div>
    </div>
  );
}