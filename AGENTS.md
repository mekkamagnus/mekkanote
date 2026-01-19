# AGENTS.md - MekkaNote Development Patterns

## Technology Stack
- Next.js 16+ with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui for accessible UI components
- Bun as the JavaScript runtime and package manager
- SQLite with Drizzle ORM for database operations

## Project Structure
- `/app` - Next.js App Router pages and layouts
- `/components` - Reusable React components, including shadcn/ui components in `/components/ui`
- `/lib` - Utility functions and shared logic
- `/public` - Static assets
- `/types` - TypeScript declaration files

## Development Patterns
- Use `bun run dev` for development server
- Use `bun run build` for production builds
- Use `bun run type-check` for TypeScript checking
- Use `bun run lint` for code quality checks
- Module resolution should be set to "bundler" in tsconfig.json for compatibility with Next.js 16+
- When encountering missing type definition errors, create declaration files in `/types` directory

## Component Development
- shadcn/ui components should be placed in `/components/ui`
- Utility functions like `cn()` for class merging are in `/lib/utils.ts`
- Components use the `@/` alias for absolute imports from the project root

## Database Integration
- Drizzle ORM will be used for database operations
- SQLite will be the primary database
- Vector operations for AI features will use sqlite-vec extension

## AI Integration
- OpenAI SDK will be integrated for AI features
- Embeddings will be stored in the database for similarity search
- AI services will provide tag suggestions and link recommendations