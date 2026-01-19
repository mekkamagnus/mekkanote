const Database = require('better-sqlite3');
const db = new Database('dev.db');

console.log('=== Tables ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables);

console.log('\n=== Notes Schema ===');
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='notes'").get();
console.log(schema ? schema.sql : 'No notes table found');

console.log('\n=== Sample Notes ===');
try {
  const notes = db.prepare("SELECT * FROM notes LIMIT 3").all();
  console.log(notes);
  console.log('\nNote ID type:', notes.length > 0 ? typeof notes[0].id : 'no notes');
} catch(e) {
  console.log('Error:', e.message);
}

db.close();
