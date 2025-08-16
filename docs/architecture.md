# MekkaNote Full-Stack Architecture Document

## Overview

This document provides a comprehensive technical architecture for MekkaNote, a mobile-first Progressive Web Application (PWA) that serves as a light org-mode implementation with AI-powered knowledge management capabilities.

## Architecture Philosophy

The architecture follows a **document-centric** approach where `.org` files are the source of truth, augmented by SQLite databases for enhanced functionality. This ensures:

- **Data portability** - users own their data
- **Version control friendly** - plain text files work with git
- **Future-proof** - no vendor lock-in
- **Performance** - local storage with intelligent caching

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │   PWA (HTMX)    │  │ Service Worker   │  │ Local Cache │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │   Web Server    │  │   AI Services    │  │ File System │ │
│  │   (Node.js)     │  │   (Python)       │  │   Manager   │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │   SQLite DB     │  │   .org Files     │  │   Assets    │ │
│  │   (Multi-type)  │  │   (Source)       │  │  (Images)   │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Architecture

- **Framework**: HTMX + Nunjucks templates
- **Styling**: Tailwind CSS + DaisyUI components
- **State Management**: Server-side with HTMX partials
- **PWA Features**: Service Worker for offline capability
- **Touch Events**: Custom touch handlers for mobile

### Backend Architecture

- **Runtime**: Node.js 18+ with TypeScript
- **Web Framework**: Fastify (high performance)
- **Template Engine**: Nunjucks for server-side rendering
- **File Operations**: Node.js fs with async/await
- **AI Integration**: Python microservices via HTTP API

### Database Architecture

- **Primary Storage**: `.org` files in local filesystem
- **SQLite Multi-type**:
  - **Relational**: Metadata, tags, links
  - **NoSQL**: JSON documents for flexible data
  - **Vector**: Embeddings for AI search
- **Caching**: Browser IndexedDB + Service Worker

## Component Design

### 1. File System Manager

```typescript
interface FileSystemManager {
  readOrgFile(uuid: string): Promise<OrgDocument>;
  writeOrgFile(document: OrgDocument): Promise<void>;
  createOrgFile(title: string, content: string): Promise<string>;
  listOrgFiles(): Promise<OrgFile[]>;
  moveFile(uuid: string, newPath: string): Promise<void>;
}
```

### 2. Org Parser

```typescript
interface OrgParser {
  parse(content: string): OrgDocument;
  serialize(document: OrgDocument): string;
  extractHeadlines(ast: OrgAST): Headline[];
  extractLinks(ast: OrgAST): Link[];
  extractTags(ast: OrgAST): string[];
}
```

### 3. Link Manager

```typescript
interface LinkManager {
  createLink(sourceUuid: string, targetUuid: string): Promise<void>;
  getBacklinks(uuid: string): Promise<Link[]>;
  getForwardLinks(uuid: string): Promise<Link[]>;
  updateLinks(oldUuid: string, newUuid: string): Promise<void>;
}
```

### 4. AI Service

```typescript
interface AIService {
  generateTags(content: string): Promise<string[]>;
  suggestLinks(
    content: string,
    existingNotes: Note[]
  ): Promise<LinkSuggestion[]>;
  generateHeadline(content: string): Promise<string>;
  createEmbedding(content: string): Promise<number[]>;
}
```

## Data Models

### Org Document Structure

```typescript
interface OrgDocument {
  uuid: string;
  title: string;
  content: string;
  ast: OrgAST;
  metadata: DocumentMetadata;
  createdAt: Date;
  updatedAt: Date;
  filePath: string;
}

interface DocumentMetadata {
  tags: string[];
  properties: Record<string, string>;
  headlines: Headline[];
  links: Link[];
  attachments: Attachment[];
}

interface Headline {
  level: number;
  title: string;
  tags: string[];
  properties: Record<string, string>;
  content: string;
  children: Headline[];
}

interface Link {
  type: "internal" | "external";
  url: string;
  title?: string;
  description?: string;
}

interface Attachment {
  filename: string;
  path: string;
  mimeType: string;
  size: number;
}
```
