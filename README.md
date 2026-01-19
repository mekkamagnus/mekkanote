# MekkaNote

> AI-Powered Note-Taking Assistant with Zettelkasten-Style Knowledge Management

MekkaNote is a mobile-first Progressive Web Application (PWA) that serves as a lightweight note-taking system with AI-powered knowledge management capabilities. Inspired by Zettelkasten, atomic notes, and evergreen note-taking philosophies, MekkaNote transforms personal note-taking from passive storage into an active, intelligent system.

## Features

### Core Note Management
- **Obsidian-Style Editor**: Full-screen markdown editor with formatting toolbar
  - Bold, italic, headings (H1-H2), lists, checkboxes, quotes
  - Auto-save functionality with visual feedback
  - Auto-resize textarea based on content
  - Keyboard shortcuts (Ctrl+S to save)
- **UUID-based Notes**: Each note has a unique identifier
- **Auto-Generated Titles**: Title extracted from first heading

### Bi-directional Linking
- **`[[` Trigger**: Real-time note search modal when typing `[[`
- **Create New Notes**: Option to create new notes directly from search modal
- **UUID-Based Links**: Org-mode convention link references
- **Automatic Backlinks**: Shows all notes linking to the current note
- **Link Visualization**: Display both outbound links and inbound backlinks

### Search Functionality
- **Command Palette**: Open with `Ctrl/Cmd+K` for global search
- **Real-Time Results**: Search as you type
- **Full-Text Search**: Across titles and content
- **Keyboard Navigation**: Arrow keys and Enter to select notes
- **Result Highlighting**: Search terms highlighted in results

### AI-Powered Features
- **Automatic Tagging**: AI suggests relevant tags based on note content
- **Link Suggestions**: AI suggests related notes using Jaccard similarity
- **Accept/Dismiss**: Interactive UI for managing AI suggestions
- **DeepSeek Integration**: Uses deepseek-chat model for tag generation

### UI/UX Features
- **Mobile-First Design**: Optimized for touch interfaces
- **Dark Theme Primary**: Developer-focused dark mode (#0a0a0a background)
- **Minimal Header**: Clean navigation with hamburger menu and create button
- **Mobile Note Cards**: Horizontal layout with document icons
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Navigation Drawer**: Slide-out sidebar for navigation
- **PWA Capabilities**: Installable on supported devices

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **React**: Version 19 with Server Components
- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with custom CSS variables
- **UI Components**: shadcn/ui + Radix UI primitives
- **Database**: SQLite with better-sqlite3
- **ORM**: Drizzle ORM for type-safe database operations
- **AI Integration**: DeepSeek API for tag suggestions
- **Link Matching**: Jaccard similarity for offline link suggestions

## Installation

### Prerequisites

- **Bun** (v1.3 or higher)
- **Node.js** compatible environment

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mekkamagnus/mekkanote.git
   cd mekkanote
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables (if needed):
   ```bash
   # Create .env.local for AI features
   cp .env.example .env.local
   # Add your DeepSeek API key
   ```

4. Initialize the database:
   ```bash
   bun run db:push
   ```

## Development

### Start Development Server

```bash
bun run dev
```

This starts the development server at `http://localhost:8008`.

### Available Scripts

```bash
# Start development server (port 8008)
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Run ESLint
bun run lint

# Run TypeScript type check
bun run type-check

# Generate database migrations
bun run db:generate

# Run database migrations
bun run db:migrate

# Push database schema changes
bun run db:push
```

## Project Structure

```
mekkanote/
├── app/                          # Next.js App Router pages
│   ├── globals.css               # Global styles and CSS variables
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page (notes list)
│   ├── notes/
│   │   ├── page.tsx              # Notes list view
│   │   ├── create/
│   │   │   └── page.tsx          # Create note page
│   │   └── [id]/
│   │       ├── page.tsx          # Note detail view
│   │       └── edit/
│   │           └── page.tsx      # Edit note page
│   └── api/                      # API routes
│       ├── notes/                # Note CRUD endpoints
│       ├── search/               # Search endpoint
│       ├── ai/                   # AI suggestion endpoints
│       └── links/                # Link management endpoints
├── components/                   # Reusable React components
│   ├── global/                   # Global components
│   │   ├── command-palette.tsx  # Command palette modal
│   │   └── command-palette-provider.tsx
│   ├── navigation/               # Navigation components
│   │   └── mobile-navigation.tsx # Navigation drawer
│   ├── notes-list.tsx            # Notes list component
│   ├── ui/                       # shadcn/ui components
│   ├── editors/                  # Editor components
│   │   └── obsidian-markdown-editor.tsx
│   └── mobile/                   # Mobile-specific components
│       └── mobile-note-card.tsx
├── lib/                          # Utility functions
│   ├── db.ts                     # Database connection
│   └── utils.ts                  # Helper functions
├── drizzle/                      # Database schema and migrations
│   ├── schema.ts                 # Database tables
│   └── migrations/               # Migration files
├── notes-org/                    # Org file storage
│   └── 2026/                     # Organized by date
├── public/                       # Static assets
│   └── manifest.json             # PWA manifest
├── .gitignore
├── components.json               # shadcn/ui configuration
├── next.config.ts                # Next.js configuration
├── package.json
├── tsconfig.json                 # TypeScript configuration
├── drizzle.config.ts             # Drizzle ORM configuration
└── README.md
```

## Usage

### Keyboard Shortcuts

- **`Ctrl/Cmd + K`**: Open command palette for search
- **`Escape`**: Close modals and command palette
- **`Ctrl/Cmd + S`**: Save note (in editor)
- **`Arrow Keys`**: Navigate search results
- **`Enter`**: Select note or confirm action

### Creating Notes

1. Click the **+** button in the header
2. Start writing in the Obsidian-style editor
3. Use the formatting toolbar for markdown styling
4. Note auto-saves every 30 seconds
5. Title is auto-generated from the first heading

### Linking Notes

1. Type `[[` in the editor
2. Search modal opens automatically
3. Type to search for existing notes
4. Select a note to create the link
5. Or choose "Create new note" to create a linked note

### AI Suggestions

- **Tag Suggestions**: Appear automatically after creating content
- **Link Suggestions**: Displayed in note detail view
- Click **✓** to accept suggestions
- Click **✕** to dismiss suggestions

## Contributing

### Development Philosophy

This project follows:
- **Mobile-First Design**: Prioritize mobile experience, enhance for desktop
- **TypeScript Strict Mode**: Full type safety across the application
- **Component Reusability**: Build composable, reusable components
- **Accessibility First**: WCAG 2.1 AA compliance with keyboard navigation

### Code Style

- TypeScript strict mode enabled
- 2 space indentation
- 100 character line width (where practical)
- Single quotes for strings
- Functional programming patterns where appropriate
- Client components marked with `"use client"` directive

### Adding Features

1. Create a new branch: `git checkout -b feature/your-feature`
2. Implement your feature following the existing patterns
3. Test on both mobile and desktop viewports
4. Run type checking: `bun run type-check`
5. Build production version: `bun run build`
6. Submit a pull request

## Documentation

- **UI Design System**: See `docs/ui.md` for comprehensive design specifications
- **Product Requirements**: See `docs/prd.md` for feature requirements and implementation status
- **Claude Commands Guide**: See `docs/claude-commands.md` for available slash commands

## Roadmap

### Current (v1.0)
- ✅ Core note management with Obsidian-style editor
- ✅ Bi-directional linking with `[[` trigger
- ✅ Command palette search
- ✅ AI-powered tag suggestions (DeepSeek)
- ✅ AI link suggestions (Jaccard similarity)
- ✅ Mobile-first dark theme
- ✅ PWA capabilities

### Future Enhancements
- [ ] Full org-mode syntax highlighting
- [ ] Advanced AI features (summarization, natural language queries)
- [ ] Graph view for note connections
- [ ] Offline mode capabilities
- [ ] Export to different formats (PDF, Markdown, Org)
- [ ] Cloud sync capabilities

## License

MIT License - See LICENSE file for details