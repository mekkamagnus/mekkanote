# Product Requirements Document (PRD)

# MekkaNote MVP - AI-Powered Note-Taking Assistant

**Document Version:** 1.0  
**Date:** August 15, 2025  
**Author:** Product Manager  
**Status:** Final Draft

---

## 1. Executive Summary

MekkaNote is an AI-powered note-taking application designed to transform personal knowledge management from passive storage into an active, intelligent system. The MVP focuses on delivering core note-taking functionality with AI-assisted features that reduce friction in creating and connecting notes, following Zettelkasten and evergreen note-taking philosophies.

---

## 2. Product Vision & Goals

### 2.1 Vision Statement

To create a personal knowledge management system that actively helps users discover connections between their ideas, transforming static notes into a dynamic, self-organizing knowledge base.

### 2.2 Product Goals

- **Reduce Friction:** Decrease time and effort required to create and link notes by 70%
- **Increase Insight:** Generate at least one new, unexpected connection between ideas weekly
- **Drive Adoption:** Achieve consistent daily use as primary note-taking tool within 30 days
- **Validate AI Value:** Demonstrate clear user value from AI-powered suggestions and automation

### 2.3 Success Metrics

- **Engagement:** Daily active usage for 30+ consecutive days
- **Efficiency:** Average time to create and link a new note < 2 minutes
- **Discovery:** Number of AI-suggested connections accepted by user
- **Retention:** Continued usage beyond initial 30-day period

---

## 3. Target Users & Personas

### 3.1 Primary User Persona: "The Knowledge Worker"

- **Profile:** Developer/thinker building long-term personal knowledge base
- **Behaviors:** Consumes information from multiple sources, works on multiple projects, values deep thinking
- **Pain Points:** Manual linking overhead, forgotten insights, disorganized note systems
- **Needs:** Frictionless note creation, automatic connection discovery, simple but powerful interface

### 3.2 User Characteristics

- **Technical Proficiency:** High (developers, researchers, knowledge workers)
- **Note-taking Volume:** 5-20 notes per day
- **Device Usage:** Primarily desktop/laptop, mobile for capture
- **Knowledge Management Philosophy:** Follows or interested in Zettelkasten, atomic notes, evergreen notes

---

## 4. MVP Scope Definition

### 4.1 In Scope Features

The MVP includes all functionality required for Milestone 1 and Milestone 2 from the project brief:

#### Core Note Management

- Create, edit, and save `.org` format notes
- Full org-mode syntax support including:
  - Headlines (H1-H6) with folding/unfolding
  - Dates and timestamps
  - Org-mode tags
  - Properties and property drawers
  - Bullet and numbered lists
  - Light org-mode syntax highlighting
  - Image storage using local file references

#### Manual Bi-directional Linking

- `[[` trigger for real-time note search modal
- Create new notes directly from search modal
- UUID-based link references (org-mode conventions)
- Automatic backlink creation
- Link visualization in note interface

#### Link Unfurling

- Automatic preview for social media links (Twitter, YouTube)
- Content preview including text and thumbnails
- Seamless integration with note content

#### AI-Powered Features

- Automatic content-based tagging
- AI suggestions for new note connections
- Basic text search across notes
- Intelligent link recommendations

#### Basic Search

- Full-text search across note titles and content
- Simple, fast search results
- Search result highlighting

### 4.2 Out of Scope Features

- Advanced AI features (summarization, natural language queries)
- Real-time collaboration or multi-user features
- Third-party application integrations
- Advanced search filters or faceted search
- Offline mode capabilities
- Mobile application (beyond PWA)
- Advanced org-mode features (tables, formulas)

---

- [ ] Properties and property drawers support
- [ ] Bullet and numbered lists
- [ ] Light org-mode syntax highlighting
- [ ] Image storage using local file references
- [ ] Auto-save functionality every 30 seconds

#### FR-3: Note Storage

**Requirement:** All notes must be saved in .org format with proper file structure  
**Acceptance Criteria:**

- [ ] Each note saved as individual .org file
- [ ] File naming convention: YYYYMMDD-HHMMSS-uuid.org
- [ ] UTF-8 encoding for all files
- [ ] Proper org-mode header with title and metadata

### 5.2 Linking Requirements

#### FR-4: Manual Link Creation

**Requirement:** Users can create bidirectional links between notes using [[ syntax  
**Acceptance Criteria:**

- [ ] [[ trigger opens real-time search modal
- [ ] Search results update as user types
- [ ] Option to create new note if no match found
- [ ] Links use UUID-based references
- [ ] Automatic backlink creation in referenced notes

#### FR-5: Link Visualization

**Requirement:** Links and backlinks must be clearly visible in note interface  
**Acceptance Criteria:**

- [ ] Links displayed as clickable text with visual indicator
- [ ] Backlinks section shows all incoming links
- [ ] Broken links highlighted in red
- [ ] Hover preview for linked notes

### 5.3 AI Features Requirements

#### FR-6: Automatic Tagging

**Requirement:** AI automatically suggests relevant tags based on note content  
**Acceptance Criteria:**

- [ ] Tags suggested within 5 seconds of content creation
- [ ] User can accept, modify, or reject suggested tags
- [ ] Tags follow org-mode conventions (#+TAGS:)
- [ ] No more than 5 tags suggested per note

#### FR-7: Link Suggestions

**Requirement:** AI suggests relevant connections between existing notes  
**Acceptance Criteria:**

- [ ] Suggestions appear in dedicated "Suggested Links" section
- [ ] Each suggestion includes relevance score (1-100)
- [ ] User can accept or dismiss suggestions
- [ ] Suggestions update as note content changes

### 5.4 Search Requirements

#### FR-8: Basic Search

**Requirement:** Full-text search across all notes  
**Acceptance Criteria:**

- [ ] Search box accessible via keyboard shortcut (Ctrl/Cmd+K)
- [ ] Real-time search results as user types
- [ ] Search covers titles, content, and tags
- [ ] Results ranked by relevance
- [ ] Search result highlighting

### 5.5 Link Unfurling Requirements

#### FR-9: Social Media Previews

**Requirement:** Automatic preview generation for social media links  
**Acceptance Criteria:**

- [ ] Twitter links show tweet content and author
- [ ] YouTube links show thumbnail, title, and duration
- [ ] Previews load within 2 seconds
- [ ] Fallback text shown if preview unavailable

---

## 6. User Stories

### 6.1 Core User Stories

#### US-1: Creating a New Note

**As a** knowledge worker  
**I want to** quickly create a new note  
**So that** I can capture ideas without friction

**Acceptance Criteria:**

- Given I'm on any screen, when I click "New Note", then a blank note opens within 1 second
- Given I'm creating a note, when I start typing, then the note auto-saves every 30 seconds
- Given I finish a note, when I navigate away, then the note is saved automatically

#### US-2: Linking Notes

**As a** knowledge worker  
**I want to** easily link related notes  
**So that** I can build connections between ideas

**Acceptance Criteria:**

- Given I'm writing a note, when I type [[, then a search modal opens immediately
- Given I'm in the search modal, when I type, then results filter in real-time
- Given I select a note, when I confirm, then a bidirectional link is created

#### US-3: Discovering Connections

**As a** knowledge worker  
**I want to** discover unexpected connections between notes  
**So that** I can generate new insights

**Acceptance Criteria:**

- Given I have multiple notes, when AI processes them, then I see relevant suggestions
- Given I see a suggestion, when I click "Accept", then a link is created
- Given I dismiss a suggestion, when I refresh, then it doesn't reappear

#### US-4: Searching Knowledge

**As a** knowledge worker  
**I want to** quickly find relevant notes  
\*\*So

## 5. Functional Requirements

### 5.1 Note Management Requirements

#### FR-1: Note Creation

**Requirement:** Users must be able to create new notes quickly and easily  
**Acceptance Criteria:**

- [ ] New note creation accessible within 2 clicks/taps from any screen
- [ ] Default note template with proper org-mode structure
- [ ] Auto-generated UUID for each new note
- [ ] Creation timestamp automatically added

#### FR-2: Note Editing

**Requirement:** Full-featured org-mode editor with syntax support  
**Acceptance Criteria:**

- [ ] Support for H1-H6 headlines with folding/unfolding
- [ ] Org-mode tags with #+TAGS: syntax

#### US-4: Searching Knowledge

**As a** knowledge worker  
**I want to** quickly find relevant notes  
**So that** I can retrieve information when needed

**Acceptance Criteria:**

- Given I press Ctrl/Cmd+K, when I type a query, then results appear instantly
- Given I see search results, when I click a result, then the note opens immediately
- Given no results match, when I see the message, then I can create a new note with that term

---

## 7. Non-Functional Requirements

### 7.1 Performance Requirements

- **Page Load Time:** Initial app load < 3 seconds on 3G connection
- **Search Response:** Search results appear within 100ms of typing
- **AI Processing:** Tag suggestions appear within 5 seconds of note creation
- **Auto-save:** Changes saved every 30 seconds without blocking UI

### 7.2 Usability Requirements

- **Mobile Responsive:** Fully functional on screens 320px and wider
- **Touch Targets:** All interactive elements minimum 44x44px
- **Keyboard Navigation:** Full keyboard navigation support
- **Accessibility:** WCAG 2.1 AA compliance

### 7.3 Security Requirements

- **Data Encryption:** All data encrypted at rest using AES-256
- **HTTPS Only:** All communications over HTTPS
- **Input Validation:** All user inputs sanitized to prevent XSS
- **File Upload:** Only images allowed, scanned for malware

### 7.4 Browser Compatibility

- **Supported Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Progressive Enhancement:** Core functionality works without JavaScript
- **PWA Support:** Installable as Progressive Web App

---

## 8. Technical Requirements

### 8.1 Frontend Stack

- **Framework:** HTMX for dynamic interactions
- **Styling:** Tailwind CSS with DaisyUI components
- **Templates:** Nunjucks for server-side rendering
- **Storage:** Browser localStorage for caching

### 8.2 Backend Stack

- **Runtime:** Node.js 18+ with TypeScript
- **Framework:** FastAPI or Express.js
- **Database:** SQLite with vector extension for AI
- **File Storage:** Local filesystem for .org files

### 8.3 AI Integration

- **Provider:** OpenAI GPT-4 for content analysis (TypeScript/Deno implementation)
- **Fallback:** Local models for offline capability (Node.js fallback if needed)
- **Rate Limiting:** 60 requests per minute per user
- **Caching:** AI responses cached for 24 hours

---

## 9. Acceptance Criteria

### 9.1 MVP Completion Criteria

- [ ] All functional requirements implemented and tested
- [ ] Performance benchmarks met (load time < 3s, search < 100ms)
- [ ] 30-day personal usage trial completed successfully
- [ ] Core user stories validated through usage
- [ ] Security audit passed
- [ ] Browser compatibility verified across target browsers

### 9.2 Launch Readiness

- [ ] Documentation complete (user guide, API docs)
- [ ] Error handling implemented for all edge cases
- [ ] Monitoring and analytics configured
- [ ] Backup and recovery procedures tested
- [ ] Performance monitoring in place

---

## 10. Risks and Mitigation

### 10.1 Technical Risks

| Risk                                        | Impact | Probability | Mitigation                            |
| ------------------------------------------- | ------ | ----------- | ------------------------------------- |
| AI API rate limits                          | High   | Medium      | Implement caching and fallback models |
| Browser compatibility issues                | Medium | Low         | Progressive enhancement approach      |
| Performance degradation with large datasets | High   | Medium      | Pagination and lazy loading           |

### 10.2 User Adoption Risks

| Risk                        | Impact | Probability | Mitigation                        |
| --------------------------- | ------ | ----------- | --------------------------------- |
| Users prefer existing tools | High   | Medium      | Focus on unique AI features       |
| Learning curve too steep    | Medium | Low         | Simple onboarding flow            |
| Data migration concerns     | Medium | Low         | Clear import/export documentation |

---

## 11. Future Considerations

### 11.1 Post-MVP Features

- Advanced AI summarization
- Natural language queries
- Visual graph view of connections
- Mobile companion app
- Third-party integrations
- Real-time collaboration

### 11.2 Scaling Considerations

- Multi-user support architecture
- Cloud sync capabilities
- Advanced search with filters
- Plugin system for extensibility

---

## 12. Appendices

### 12.1 Glossary

- **Zettelkasten:** A note-taking method emphasizing connections between ideas
- **Org-mode:** A document editing and formatting syntax for notes
- **Backlink:** A link that points back to the current note from another
