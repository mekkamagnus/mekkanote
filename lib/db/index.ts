import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';

// Create database instance
const sqlite = new Database('dev.db', { create: true });

// Initialize Drizzle ORM
export const db = drizzle(sqlite);

// Export the database instance for direct access if needed
export { sqlite };