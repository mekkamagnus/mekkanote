# Chore: Fix "datatype mismatch" error when creating notes

## Chore Description
When attempting to create a new note through the UI at `/notes/create`, the application fails with a "datatype mismatch" error. The error originates from `note-service.ts:31` when trying to insert a new note into the database.

The error occurs because:
1. The schema was changed from `integer` IDs (auto-increment) to `text` UUIDs (using uuid v7)
2. The database migration may not have been applied correctly, or there's existing data with old integer IDs
3. Drizzle ORM is attempting to insert a UUID (text) into a column that may still be expecting integers

## Relevant Files
Use these files to resolve the chore:

- `lib/db/schema.ts` - Defines the notes table schema with text-based UUID primary key
- `lib/services/note-service.ts` - Contains the create() method that throws the error at line 31
- `app/api/notes/route.ts` - API endpoint that calls noteService.create()
- `drizzle/0001_slimy_whistler.sql` - Migration that attempted to convert integer IDs to text UUIDs
- `drizzle/meta/_journal.json` - Migration journal showing applied migrations
- `dev.db` - SQLite database file that may contain old schema or data

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Investigate the current database state
- Check if the `dev.db` file exists and has any existing data
- Examine the actual schema of the `notes` table in the database to see if it's using integer or text IDs
- Determine if there's existing data that conflicts with the new UUID-based schema
- Run `bunx drizzle-kit studio` or query the database directly to inspect the table structure

### 2. Fix the database schema mismatch
- If the database still has integer-based IDs, drop and recreate the `notes` table
- Run the migration to ensure the table uses text-based UUID primary keys
- Ensure the `id` column is defined as `text` type, not `integer`
- Verify the schema matches what's defined in `lib/db/schema.ts`

### 3. Ensure migrations are properly applied
- Check if all Drizzle migrations have been applied: `bunx drizzle-kit push`
- If migrations failed, manually apply them: `bun run db:generate` and `bun run db:push`
- Verify the migration journal reflects the correct state

### 4. Test note creation
- Restart the development server after fixing the database
- Attempt to create a note through the UI or API
- Verify the note is successfully inserted with a UUID (text format)
- Check that the `id` field contains a valid UUID string (e.g., "01234567-abcd-1234-5678-0123456789ab")

### 5. Handle localStorage error (secondary issue)
- The theme provider also has a localStorage error in `components/providers/theme-provider.tsx:17`
- This occurs because localStorage is being accessed during server-side rendering
- Add a check to ensure localStorage is only accessed on the client side (e.g., `if (typeof window !== 'undefined')`)

### 6. Validate the fix
- Create a new note via the UI at `/notes/create`
- Verify it appears in the notes list
- Edit the note and ensure updates work
- Delete the note and verify deletion works
- Check that all CRUD operations function correctly

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

- `bun run type-check` - Run TypeScript type checking to ensure no type errors
- `bun run lint` - Run ESLint to ensure code quality
- Test creating a note via curl: `curl -X POST http://localhost:8008/api/notes -H "Content-Type: application/json" -d '{"title":"Test Note","content":"Test content"}'`
- Test fetching notes: `curl http://localhost:8008/api/notes`
- Verify the response includes the newly created note with a valid UUID string as the `id` field

## Notes
- The root cause is likely a mismatch between the TypeScript schema (text UUIDs) and the actual database schema (possibly still integers)
- Migration `0001_slimy_whistler.sql` was supposed to convert the table but may not have been applied correctly
- The error "datatype mismatch" typically occurs in SQLite when trying to insert a text value into an integer column
- Consider clearing the database and starting fresh if data loss is acceptable: `rm -f dev.db && bun run db:push`
- If preserving data is important, export the data first, then recreate the schema with text IDs
- The localStorage error in theme-provider.tsx should also be fixed to prevent SSR issues
