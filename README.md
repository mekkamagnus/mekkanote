# MekkaNote

> AI-Powered Note-Taking Assistant

MekkaNote is a mobile-first Progressive Web Application (PWA) that serves as a light org-mode implementation with AI-powered knowledge management capabilities. Inspired by Zettelkasten, atomic notes, and evergreen note-taking philosophies, MekkaNote transforms personal note-taking from passive storage into an active, intelligent system.

## Features

### Core Note Management
- Create, edit, and save `.org` format notes
- Full org-mode syntax support including:
  - Headlines (H1-H6) with folding/unfolding
  - Dates and timestamps
  - Org-mode tags
  - Properties and property drawers
  - Bullet and numbered lists
  - Light org-mode syntax highlighting
  - Image storage using local file references

### Bi-directional Linking
- Manual linking with `[[` trigger for real-time note search modal
- Create new notes directly from search modal
- UUID-based link references (org-mode conventions)
- Automatic backlink creation
- Link visualization in note interface

### AI-Powered Features
- Automatic content-based tagging
- AI suggestions for new note connections
- Intelligent link recommendations

### Link Unfurling
- Automatic preview for social media links (Twitter, YouTube)
- Content preview including text and thumbnails

### Search
- Full-text search across note titles and content
- Real-time search results with highlighting

## Technology Stack

- **Runtime**: Deno with TypeScript
- **Frontend**: React 18, Hono framework
- **Styling**: Tailwind CSS + DaisyUI
- **Backend**: Hono web framework
- **Storage**: Local filesystem (.org files), SQLite (with vector extension for AI)
- **Architecture**: Document-centric approach with `.org` files as source of truth

## Installation

### Prerequisites

- **Deno** (v1.30 or higher)
  ```bash
  # Install Deno
  curl -fsSL https://deno.land/install.sh | sh
  ```

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mekkanote.git
   cd mekkanote
   ```

2. Verify Deno installation:
   ```bash
   deno --version
   ```

3. The application uses Deno's built-in dependency management - dependencies are resolved automatically from `deno.json`.

## Development

### Start Development Server

```bash
deno task dev
```

This starts the development server with hot-reload enabled at `http://localhost:8000`.

### Available Scripts

```bash
# Start development server with watch mode
deno task dev

# Build for production
deno task build

# Start production server
deno task start

# Run tests
deno task test

# Run tests in watch mode
deno task test:watch

# Lint code
deno task lint

# Format code
deno task fmt

# Type check code
deno task type-check
```

### Running with Permissions

The application requires the following Deno permissions:

```bash
deno run --allow-net --allow-read --allow-write --allow-env src/main.ts
```

## Usage

### Creating a Note

1. Click "New Note" or use the keyboard shortcut
2. Enter your note content using org-mode syntax
3. Notes auto-save every 30 seconds
4. Each note is saved as an individual `.org` file

### Linking Notes

1. Type `[[` in any note to trigger the search modal
2. Search results update in real-time as you type
3. Select an existing note or create a new one
4. Bidirectional links are created automatically
5. Backlinks appear in the referenced note

### Searching Notes

1. Press `Ctrl/Cmd+K` to open search
2. Type your query to search across titles and content
3. Results are ranked by relevance
4. Click any result to open the note

### AI Suggestions

- AI automatically suggests tags based on note content
- Link suggestions appear in the "Suggested Links" section
- Accept or dismiss suggestions as needed

## Project Structure

```
mekkanote/
├── src/                    # Source code
│   ├── hooks/             # React hooks (useAutoSave, useNotes, useAuth)
│   ├── services/          # Business logic services
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Functional programming utilities
│   ├── validation/        # Validation logic
│   ├── main.ts            # Application entry point
│   └── server.ts          # Hono server configuration
├── docs/                  # Project documentation
│   ├── prd.md             # Product Requirements Document
│   ├── architecture.md    # Technical architecture
│   ├── brief.md           # Project brief and vision
│   └── development_workflow.md
├── specs/                 # Feature specifications
├── public/                # Static assets
├── notes/                 # User note storage (created at runtime)
├── models/                # AI models configuration
├── utils/                 # Utility scripts
├── deno.json             # Deno configuration
├── CLAUDE.md              # Development guidelines (TDD, RDD)
└── README.md              # This file
```

## Documentation

- [Product Requirements Document](docs/prd.md) - Detailed feature specifications and requirements
- [Architecture Document](docs/architecture.md) - Technical architecture and design decisions
- [Project Brief](docs/brief.md) - Project vision, goals, and milestones
- [Development Workflow](docs/development_workflow.md) - Development setup and guidelines
- [Functional Patterns Guidelines](docs/functional-patterns-guidelines.md) - Functional programming patterns used in the codebase

## Contributing

### Development Philosophy

This project follows:
- **Test-Driven Development (TDD)**: Write failing tests first, implement to pass, then refactor
- **Readme-Driven Development (RDD)**: Document APIs and features before implementation
- **Functional Programming**: Immutable data, pure functions, explicit error handling

### Code Style

- TypeScript strict mode enabled
- 2 space indentation
- 100 character line width
- Single quotes for strings
- No semicolons
- Functional programming patterns (see [Functional Patterns Guidelines](docs/functional-patterns-guidelines.md))

### Testing

- Aim for 80% branch coverage
- Write deterministic tests
- Mock external dependencies
- Test behavior, not implementation

Before submitting changes:
1. Run `deno task lint` to check code style
2. Run `deno task fmt` to format code
3. Run `deno task type-check` to verify types
4. Run `deno task test` to ensure all tests pass

## License

[Specify your license here]

## Acknowledgments

Inspired by:
- **Obsidian** - Powerful linking and graph visualization
- **Logseq** - Outliner-based approach and daily journals
- **Apple Notes** - Simplicity and ease of use
