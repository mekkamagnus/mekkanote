"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Note } from '@/types/note';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
}

export default function CommandPalette({ isOpen, onClose, notes }: CommandPaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      // Focus the input when palette opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

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
    router.push(`/notes/${note.id}`);
    onClose();
  };

  // Function to highlight search terms in text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-black">
          {part}
        </mark>
      ) : (
        part
      )
    );
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
          placeholder="🔍 Search notes..."
          onKeyDown={handleKeyDown}
        />
        <div
          ref={listRef}
          style={{ maxHeight: '300px', overflowY: 'auto' }}
        >
          {filteredNotes.length === 0 ? (
            <div style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              No notes found
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
                    {highlightText(note.title, searchTerm)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {highlightText(note.content.substring(0, 60) + '...', searchTerm)}
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