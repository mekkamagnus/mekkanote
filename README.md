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

- **Framework**: Next.js 14+ with App Router
- **Runtime**: Bun
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Storage**: SQLite (with vector extension for AI)
- **AI Integration**: OpenAI SDK

## Installation

### Prerequisites

- **Bun** (v1.3 or higher)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mekkanote.git
   cd mekkanote
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

## Development

### Start Development Server

```bash
bun run dev
```

This starts the development server at `http://localhost:3000`.

### Available Scripts

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Run ESLint
bun run lint

# Run TypeScript type check
bun run type-check
```

## Project Structure

```
mekkanote/
├── app/                    # Next.js App Router pages
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable React components
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utility functions
│   └── utils.ts            # Helper functions
├── public/                 # Static assets
├── .gitignore
├── components.json         # shadcn/ui configuration
├── next.config.ts          # Next.js configuration
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── ...
```

## Contributing

### Development Philosophy

This project follows:
- **Test-Driven Development (TDD)**: Write failing tests first, implement to pass, then refactor
- **Functional Programming**: Immutable data, pure functions, explicit error handling

### Code Style

- TypeScript strict mode enabled
- 2 space indentation
- 100 character line width
- Single quotes for strings
- No semicolons
- Functional programming patterns