import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database(process.env.NODE_ENV === 'production' ? './db.sqlite' : './dev.db');
export const db = drizzle(sqlite);