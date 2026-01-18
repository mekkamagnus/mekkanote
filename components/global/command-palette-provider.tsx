"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Note } from '@/types/note';
import CommandPalette from './command-palette';

interface CommandPaletteContextType {
  isOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
}

interface CommandPaletteProviderProps {
  children: ReactNode;
  notes: Note[];
}

export function CommandPaletteProvider({ children, notes }: CommandPaletteProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openPalette = () => setIsOpen(true);
  const closePalette = () => setIsOpen(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
      }
      
      // Check for Escape to close
      if (e.key === 'Escape' && isOpen) {
        closePalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <CommandPaletteContext.Provider value={{ isOpen, openPalette, closePalette }}>
      {children}
      <CommandPalette isOpen={isOpen} onClose={closePalette} notes={notes} />
    </CommandPaletteContext.Provider>
  );
}