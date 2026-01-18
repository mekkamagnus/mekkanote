import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

// Notes table schema
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Note links table schema for bi-directional linking
export const noteLinks = sqliteTable('note_links', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  sourceNoteId: text('source_note_id')
    .notNull()
    .references(() => notes.id, { onDelete: 'cascade' }),
  targetNoteId: text('target_note_id')
    .notNull()
    .references(() => notes.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Tags table schema
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  noteId: text('note_id')
    .notNull()
    .references(() => notes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Note embeddings table schema for AI vector search
export const noteEmbeddings = sqliteTable('note_embeddings', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  noteId: text('note_id')
    .notNull()
    .references(() => notes.id, { onDelete: 'cascade' }),
  embedding: text('embedding').notNull(), // Will store JSON array of numbers as text
  modelName: text('model_name').notNull().default('text-embedding-3-small'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});