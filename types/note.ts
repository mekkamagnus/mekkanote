export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteWithSimilarity extends Note {
  similarity: number;
}

export interface NoteLink {
  id: string;
  sourceNoteId: string;
  targetNoteId: string;
  createdAt: Date;
}