# PRD: MekkaNote MVP - AI-Powered Note-Taking Assistant

**Document Version:** 2.1
**Date:** January 18, 2026
**Status:** Restructured & Updated - Tech Stack Migration to Next.js

---

## 1. Introduction/Overview

MekkaNote is an AI-powered note-taking application designed to transform personal knowledge management from passive storage into an active, intelligent system. The MVP focuses on delivering core note-taking functionality with AI-assisted features that reduce friction in creating and connecting notes, following Zettelkasten and evergreen note-taking philosophies.

**Problem:** Current note-taking tools require manual effort to organize and connect ideas, leading to forgotten insights and disorganized knowledge bases.

**Solution:** An intelligent system that automatically suggests connections, uses AI-powered tagging, and provides frictionless bi-directional linking to create a self-organizing knowledge base.

---

## 2. Goals

- **Reduce Friction:** Decrease time and effort required to create and link notes by 70%
- **Increase Insight:** Generate at least one new, unexpected connection between ideas weekly
- **Drive Adoption:** Achieve consistent daily use as primary note-taking tool within 30 days
- **Validate AI Value:** Demonstrate clear user value from AI-powered suggestions and automation
- **Engagement:** Daily active usage for 30+ consecutive days
- **Efficiency:** Average time to create and link a new note < 2 minutes

---

## 3. Target Users & Personas

### Primary User Persona: "The Knowledge Worker"

- **Profile:** Developer/thinker building long-term personal knowledge base
- **Behaviors:** Consumes information from multiple sources, works on multiple projects, values deep thinking
- **Pain Points:** Manual linking overhead, forgotten insights, disorganized note systems
- **Needs:** Frictionless note creation, automatic connection discovery, simple but powerful interface
- **Technical Proficiency:** High (developers, researchers, knowledge workers)
- **Note-taking Volume:** 5-20 notes per day
- **Device Usage:** Primarily desktop/laptop, mobile for capture
- **Knowledge Management Philosophy:** Follows or interested in Zettelkasten, atomic notes, evergreen notes

---

## 4. User Stories

### US-001: Create New Note
**Description:** As a knowledge worker, I want to quickly create a new note so that I can capture ideas without friction.

**Acceptance Criteria:**
- [ ] New note creation accessible within 2 clicks/taps from any screen
- [ ] New note opens within 1 second of clicking "New Note" button
- [ ] Default note template with proper org-mode structure provided
- [ ] Auto-generated UUID for each new note
- [ ] Creation timestamp automatically added
- [ ] Note auto-saves every 30 seconds
- [ ] Changes saved automatically when navigating away
- [ ] Typecheck/lint passes

### US-002: Edit Note with Org-Mode Syntax
**Description:** As a knowledge worker, I want to edit notes using org-mode syntax so that I can structure my thoughts effectively.

**Acceptance Criteria:**
- [ ] Support for H1-H6 headlines with folding/unfolding
- [ ] Dates and timestamps supported
- [ ] Org-mode tags with #+TAGS: syntax
- [ ] Properties and property drawers supported
- [ ] Bullet and numbered lists supported
- [ ] Light org-mode syntax highlighting applied
- [ ] Image storage using local file references supported
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-003: Link Notes Bi-directionally
**Description:** As a knowledge worker, I want to easily link related notes so that I can build connections between ideas.

**Acceptance Criteria:**
- [ ] Typing [[ triggers real-time search modal
- [ ] Search results update as user types
- [ ] Option to create new note directly from search modal if no match found
- [ ] Links use UUID-based references (org-mode conventions)
- [ ] Automatic backlink creation in referenced notes
- [ ] Links displayed as clickable text with visual indicator
- [ ] Backlinks section shows all incoming links
- [ ] Broken links highlighted in red
- [ ] Hover preview for linked notes
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-004: Search Notes
**Description:** As a knowledge worker, I want to quickly find relevant notes so that I can retrieve information when needed.

**Acceptance Criteria:**
- [ ] Search box accessible via keyboard shortcut (Ctrl/Cmd+K)
- [ ] Real-time search results as user types
- [ ] Search covers titles, content, and tags
- [ ] Results ranked by relevance
- [ ] Search result highlighting applied
- [ ] Clicking a result opens the note immediately
- [ ] Empty state allows creating new note with search term
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-005: Automatic AI Tagging
**Description:** As a knowledge worker, I want AI to suggest relevant tags so that I don't have to manually categorize notes.

**Acceptance Criteria:**
- [ ] Tags suggested within 5 seconds of content creation
- [ ] User can accept, modify, or reject suggested tags
- [ ] Tags follow org-mode conventions (#+TAGS:)
- [ ] No more than 5 tags suggested per note
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-006: AI Link Suggestions
**Description:** As a knowledge worker, I want AI to suggest connections between notes so that I can discover unexpected relationships.

**Acceptance Criteria:**
- [ ] Suggestions appear in dedicated "Suggested Links" section
- [ ] Each suggestion includes relevance score (1-100)
- [ ] User can accept or dismiss suggestions
- [ ] Accepting a suggestion creates a bi-directional link
- [ ] Dismissed suggestions don't reappear
- [ ] Suggestions update as note content changes
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-007: Link Unfurling for Social Media
**Description:** As a knowledge worker, I want to see previews of social media links so that I can understand linked content without leaving my note.

**Acceptance Criteria:**
- [ ] Twitter links show tweet content and author
- [ ] YouTube links show thumbnail, title, and duration
- [ ] Previews load within 2 seconds
- [ ] Fallback text shown if preview unavailable
- [ ] Previews seamlessly integrate with note content
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-008: Store Notes as Org Files
**Description:** As a developer, I need notes stored as .org files so that data remains portable and interoperable.

**Acceptance Criteria:**
- [ ] Each note saved as individual .org file
- [ ] File naming convention: YYYYMMDD-HHMMSS-uuid.org
- [ ] UTF-8 encoding for all files
- [ ] Proper org-mode header with title and metadata
- [ ] Files stored in organized directory structure
- [ ] Typecheck/lint passes

---

## 5. Functional Requirements

### 5.1 Note Management (FR-001 to FR-003)

**FR-001:** The system must allow users to create new notes within 2 clicks/taps from any screen
**FR-002:** The system must provide a default org-mode template with proper structure for new notes
**FR-003:** The system must auto-save changes every 30 seconds without blocking the UI

### 5.2 Org-Mode Editor (FR-004 to FR-010)

**FR-004:** The system must support H1-H6 headlines with folding/unfolding functionality
**FR-005:** The system must support org-mode tags using #+TAGS: syntax
**FR-006:** The system must support properties and property drawers
**FR-007:** The system must support bullet and numbered lists
**FR-008:** The system must provide light org-mode syntax highlighting
**FR-009:** The system must support image storage using local file references
**FR-010:** The system must support dates and timestamps in org-mode format

### 5.3 Bi-directional Linking (FR-011 to FR-018)

**FR-011:** The system must trigger a real-time search modal when user types [[
**FR-012:** The system must update search results in real-time as user types
**FR-013:** The system must allow creating new notes directly from the search modal
**FR-014:** The system must use UUID-based references for all links (org-mode conventions)
**FR-015:** The system must automatically create backlinks in referenced notes
**FR-016:** The system must display links as clickable text with visual indicator
**FR-017:** The system must show all incoming links in a backlinks section
**FR-018:** The system must highlight broken links in red

### 5.4 Search (FR-019 to FR-024)

**FR-019:** The system must provide search box accessible via keyboard shortcut (Ctrl/Cmd+K)
**FR-020:** The system must display search results in real-time as user types
**FR-021:** The system must search across note titles, content, and tags
**FR-022:** The system must rank search results by relevance
**FR-023:** The system must highlight matching text in search results
**FR-024:** The system must allow creating new note from empty search results

### 5.5 AI Features (FR-025 to FR-030)

**FR-025:** The system must suggest tags within 5 seconds of note content creation
**FR-026:** The system must allow users to accept, modify, or reject AI-suggested tags
**FR-027:** The system must suggest no more than 5 tags per note
**FR-028:** The system must display AI-suggested note connections with relevance scores
**FR-029:** The system must allow users to accept or dismiss link suggestions
**FR-030:** The system must update link suggestions as note content changes

### 5.6 Link Unfurling (FR-031 to FR-034)

**FR-031:** The system must generate automatic previews for Twitter links showing content and author
**FR-032:** The system must generate automatic previews for YouTube links showing thumbnail, title, and duration
**FR-033:** The system must load previews within 2 seconds
**FR-034:** The system must display fallback text if preview unavailable

### 5.7 Storage (FR-035 to FR-039)

**FR-035:** The system must save each note as an individual .org file
**FR-036:** The system must use file naming convention: YYYYMMDD-HHMMSS-uuid.org
**FR-037:** The system must use UTF-8 encoding for all files
**FR-038:** The system must include proper org-mode header with title and metadata
**FR-039:** The system must auto-generate UUID for each new note

---

## 6. Non-Goals (Out of Scope)

The following features are explicitly **NOT** part of the MVP:

- Advanced AI features (summarization, natural language queries)
- Real-time collaboration or multi-user features
- Third-party application integrations (beyond social media link unfurling)
- Advanced search filters or faceted search
- Offline mode capabilities
- Mobile native application (beyond PWA)
- Advanced org-mode features (tables, formulas, source code blocks)
- Visual graph view of connections (post-MVP feature)
- Cloud sync capabilities (post-MVP feature)
- Plugin system (post-MVP feature)

---

## 7. Design Considerations

### UI/UX Requirements

- **Mobile Responsive:** Fully functional on screens 320px and wider
- **Touch Targets:** All interactive elements minimum 44x44px
- **Keyboard Navigation:** Full keyboard navigation support
- **Accessibility:** WCAG 2.1 AA compliance
- **Dark Mode:** Support for dark/light theme switching

### Relevant Components

- Use shadcn/ui components: Badge, Dialog (Modal), Keyboard Shortcuts, Command (search)
- Reuse badge component with color variants for tags
- Dialog component for link search and creation
- Command palette (shadcn) for search with keyboard shortcuts
- Auto-save indicator component to show user when last save occurred

---

## 8. Technical Considerations

### Frontend Stack

- **Framework:** Next.js 14+ with App Router for React Server Components
- **Styling:** Tailwind CSS for utility-first styling
- **UI Components:** shadcn/ui for accessible, customizable component library
- **State Management:** React hooks and Server Components for state
- **Client Storage:** Browser localStorage for client-side caching

### Backend Stack

- **Runtime:** Bun with TypeScript (fast JavaScript runtime)
- **Framework:** Next.js API Routes (App Router)
- **Database:** SQLite with better-sqlite3 for data persistence
- **ORM:** Drizzle ORM for type-safe database queries
- **File Storage:** Local filesystem for .org files
- **AI Database:** SQLite with vector extension (sqlite-vec) for embeddings

### AI Integration

- **Provider:** OpenAI GPT-4 for content analysis (Bun/TypeScript implementation)
- **Embeddings:** OpenAI text-embedding-3-small for vector search
- **Fallback:** Local models for offline capability (future enhancement)
- **Rate Limiting:** 60 requests per minute per user
- **Caching:** AI responses cached for 24 hours using in-memory cache or Redis

### Performance Requirements

- **Page Load Time:** Initial app load < 3 seconds on 3G connection
- **Search Response:** Search results appear within 100ms of typing
- **AI Processing:** Tag suggestions appear within 5 seconds of note creation
- **Auto-save:** Changes saved every 30 seconds without blocking UI

### Browser Compatibility

- **Supported Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Progressive Enhancement:** Server Components provide core functionality without client-side JavaScript
- **PWA Support:** Installable as Progressive Web App using next-pwa plugin

### Security Requirements

- **Data Encryption:** All data encrypted at rest using AES-256
- **HTTPS Only:** All communications over HTTPS
- **Input Validation:** All user inputs sanitized to prevent XSS
- **File Upload:** Only images allowed, scanned for malware

---

## 9. Success Metrics

### User Engagement

- Daily active usage for 30+ consecutive days
- Average time to create and link a new note < 2 minutes
- Number of AI-suggested connections accepted by user

### Performance

- Initial app load < 3 seconds on 3G connection
- Search results appear within 100ms of typing
- AI tag suggestions appear within 5 seconds
- Zero data loss during auto-save operations

### Quality

- 80% branch coverage from automated tests
- Zero critical security vulnerabilities
- WCAG 2.1 AA compliance verified
- Cross-browser compatibility validated

---

## 10. Open Questions

1. **Priority & Ordering:** Should AI-suggested link relevance scores affect the ordering of links in the backlinks section?

2. **Keyboard Shortcuts:** What keyboard shortcuts should be implemented beyond Ctrl/Cmd+K for search? Consider shortcuts for: creating new notes, saving, navigating between notes.

3. **Offline Mode:** Should we implement a read-only offline mode for viewing notes when network is unavailable?

4. **Image Handling:** What is the maximum image file size allowed for upload? Should we implement image compression?

5. **AI Rate Limits:** How should the system handle AI API rate limits being exceeded? Queue requests or show user error message?

---

## 11. Risks and Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI API rate limits | High | Medium | Implement aggressive caching and fallback to local models |
| Browser compatibility issues | Medium | Low | Progressive enhancement approach, test on target browsers |
| Performance degradation with large datasets | High | Medium | Implement pagination and lazy loading for note lists |
| Data corruption during auto-save | High | Low | Implement transaction-based file operations with rollback |

### User Adoption Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Users prefer existing tools | High | Medium | Focus on unique AI features that differentiate product |
| Learning curve too steep | Medium | Low | Simple onboarding flow with interactive tutorial |
| Data migration concerns | Medium | Low | Clear import/export documentation and tools |
| Org-mode complexity intimidates users | Medium | Medium | Provide visual editing mode that abstracts org-mode syntax |

---

## 12. Acceptance Criteria

### MVP Completion Criteria

- [ ] All functional requirements implemented and tested
- [ ] All user stories completed with acceptance criteria met
- [ ] Performance benchmarks met (load time < 3s, search < 100ms)
- [ ] 30-day personal usage trial completed successfully
- [ ] Security audit passed (zero critical vulnerabilities)
- [ ] Browser compatibility verified across target browsers
- [ ] 80% branch coverage from automated tests
- [ ] WCAG 2.1 AA compliance verified

### Launch Readiness

- [ ] Documentation complete (user guide, API docs)
- [ ] Error handling implemented for all edge cases
- [ ] Monitoring and analytics configured
- [ ] Backup and recovery procedures tested
- [ ] Performance monitoring in place
- [ ] PWA installable on all target browsers

---

## 13. Appendices

### Glossary

- **Zettelkasten:** A note-taking method emphasizing connections between ideas using atomic notes and bi-directional linking
- **Org-mode:** A document editing and formatting mode for Emacs, now used as a plain text format for structured notes
- **Backlink:** A link that points back to the current note from another note, providing context of how information connects
- **Evergreen Notes:** Notes that are written to be durable and valuable long-term, not just temporary capture
- **Atomic Notes:** Small, focused notes that contain a single idea or concept
- **UUID:** Universally Unique Identifier, used to uniquely identify notes without relying on titles or file paths
