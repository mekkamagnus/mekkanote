import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { notes } from '../lib/db/schema.ts';

const db = new Database('dev.db');
const drizzleDb = drizzle(db);

console.log('Testing Drizzle insert...');

// Test insert without passing id (let defaultFn handle it)
try {
  console.log('Test 1: Insert without id (using defaultFn)');
  const result1 = await drizzleDb.insert(notes).values({
    title: 'Drizzle Test 1',
    content: 'Testing without id'
  }).returning();

  console.log('Success!', result1);
} catch (e) {
  console.error('Error:', e.message);
  console.error('Stack:', e.stack);
}

// Test insert with explicit id
try {
  console.log('\nTest 2: Insert with explicit id');
  const { v7: uuidv7 } = await import('uuid');
  const testId = uuidv7();
  const result2 = await drizzleDb.insert(notes).values({
    id: testId,
    title: 'Drizzle Test 2',
    content: 'Testing with explicit id'
  }).returning();

  console.log('Success!', result2);
} catch (e) {
  console.error('Error:', e.message);
  console.error('Stack:', e.stack);
}

process.exit(0);
