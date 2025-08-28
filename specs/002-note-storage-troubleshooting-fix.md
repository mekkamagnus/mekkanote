# Spec: Note Storage Architecture Compliance Fix

## High Level Objectives

**Note Storage System Fix:**
As a developer, I want to ensure that notes are stored and retrieved according to the architecture.md specifications, so that I can have a reliable and consistent note-taking system that follows org-mode conventions.

**Org-Mode Compliance:**
As a user, I want my notes to be stored in proper org-mode format with standard properties, so that they are compatible with other org-mode tools and follow established conventions.

## Low-level Objectives

- **File Storage:**
  - Fix inconsistent note service implementations
  - Ensure .org files are saved with proper naming convention (YYYYMMDD-HHMMSS-uuid.org)
  - Implement proper org-mode properties format with :PROPERTIES: blocks
  - Store note and headline metadata in respective properties areas or drawers

**Example org document with headlines and properties:**
```org
:PROPERTIES:
:ID:       A1B2C3D4-E5F6-7890-ABCD-EF1234567890
:CREATED:  [2024-01-15 Mon 14:30]
:UPDATED:  [2024-01-15 Mon 14:30]
:END:
#+title: Project Planning Notes
#+author: User Name
#+tags: project planning work

* NEXT Project Overview                                              :project:
:PROPERTIES:
:ID:       B2C3D4E5-F6G7-8901-BCDE-F12345678901
:CREATED:  [2024-01-15 Mon 14:31]
:PRIORITY: A
:EFFORT:   2:00
:SCHEDULED: <2024-01-16 Tue 09:00-11:30>
:END:

This is the main project overview section. See the [[id:E5F6G7H8-I9J0-1234-EF12-345678901234][meeting notes]] for discussion details.

Project initiated on [2025-08-26 Tue 12:17] following stakeholder approval.

Related architecture decisions documented in [[id:F6G7H8I9-J0K1-2345-FG12-456789012345][System Architecture Notes]].

** TODO Technical Requirements                               :technical:dev:
:PROPERTIES:
:ID:       C3D4E5F6-G7H8-9012-CDEF-123456789012
:CREATED:  [2024-01-15 Mon 14:32]
:CATEGORY: technical
:STATUS:   TODO
:DEADLINE: <2024-01-20 Sat>
:EFFORT:   4:00
:END:

Details about technical requirements go here. Reference documentation available at [[https://docs.example.com/tech-specs][Tech Specs Documentation]].

Next review scheduled for <2025-08-23 Wed 20:33> with engineering team.

For related project information, see [[id:D4E5F6G7-H8I9-0123-DEF1-234567890123][Budget Planning]] section.

See also the [[id:G7H8I9J0-K1L2-3456-GH12-567890123456][Development Setup Guide]] for implementation details.

** DONE Budget Planning                                      :financial:admin:
:PROPERTIES:
:ID:       D4E5F6G7-H8I9-0123-DEF1-234567890123
:CREATED:  [2024-01-15 Mon 14:33]
:CATEGORY: financial
:BUDGET:   $50000
:EFFORT:   1:30
:END:
:LOGBOOK:
CLOCK: [2024-01-15 Mon 14:30]--[2024-01-15 Mon 16:00] =>  1:30
- State "DONE"       from "TODO"       [2024-01-15 Mon 16:45]
:END:

Budget considerations and allocations. Financial guidelines can be found at [[https://company.com/finance/guidelines][Company Financial Guidelines]].

Budget approved on [2025-08-26 Tue 09:30] by finance committee.

Cross-reference with [[id:H8I9J0K1-L2M3-4567-HI12-678901234567][Q1 Financial Report]] for historical context.

* Meeting Notes                                               :meeting:urgent:
:PROPERTIES:
:ID:       E5F6G7H8-I9J0-1234-EF12-345678901234
:CREATED:  [2024-01-15 Mon 14:34]
:MEETING_DATE: <2024-01-15 Mon 10:00-11:00>
:ATTENDEES: John Doe, Jane Smith
:NEXT_REVIEW: <2024-01-22 Mon 10:00>
:END:
:LOGBOOK:
CLOCK: [2024-01-15 Mon 10:00]--[2024-01-15 Mon 11:00] =>  1:00
:END:

Meeting discussion points and action items. Action items should be coordinated with the [[id:C3D4E5F6-G7H8-9012-CDEF-123456789012][technical team]].

Follow-up meeting scheduled - see [[id:I9J0K1L2-M3N4-5678-IJ12-789012345678][Weekly Team Standup Notes]].

Important decision made during meeting on [2025-08-26 Tue 10:15] regarding project scope.

* these tech leaders really get using twitter                           :alfred:
:PROPERTIES:
:ID:       618307E4-3A65-493F-93EC-B7D717752979
:END:
[2025-08-26 Tue 12:17]

Some interesting insights about how technology leaders effectively use social media platforms for building their personal brands and sharing knowledge.

** Code Examples                                                     :development:
:PROPERTIES:
:ID:       719408F5-4B76-504G-A4FD-C8E828863080
:CREATED:  [2025-08-26 Tue 12:30]
:CATEGORY: code-snippets
:END:

Various code examples for the project implementation:

#+begin_src typescript
// TypeScript interface for note structure
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  tags: string[];
}

const createNote = async (title: string, content: string): Promise<Note> => {
  const note: Note = {
    id: crypto.randomUUID(),
    title,
    content,
    createdAt: new Date(),
    tags: []
  };
  
  return note;
};
#+end_src

#+begin_src bash
#!/bin/bash
# Deployment script for MekkaNote
echo "Starting MekkaNote deployment..."

# Build the application
deno task build

# Run tests
deno test --allow-all

# Start the server
deno run --allow-all src/server.ts
#+end_src

#+begin_src python
# Python script for data migration
import json
import uuid
from datetime import datetime

def migrate_notes_to_org(json_file: str, output_dir: str):
    """Convert JSON notes to org-mode format"""
    with open(json_file, 'r') as f:
        notes = json.load(f)
    
    for note in notes:
        org_content = f"""
:PROPERTIES:
:ID:       {str(uuid.uuid4()).upper()}
:CREATED:  [{datetime.now().strftime('%Y-%m-%d %a %H:%M')}]
:END:
#+title: {note['title']}

{note['content']}
""".strip()
        
        filename = f"{output_dir}/{note['id']}.org"
        with open(filename, 'w') as f:
            f.write(org_content)
#+end_src

#+begin_src sql
-- SQLite queries for metadata indexing
CREATE TABLE note_metadata (
    uuid TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at DATETIME,
    updated_at DATETIME,
    file_path TEXT,
    tags TEXT -- JSON array as text
);

-- Index notes by creation date
CREATE INDEX idx_created_at ON note_metadata(created_at);

-- Insert note metadata
INSERT INTO note_metadata (uuid, title, created_at, file_path, tags)
VALUES (?, ?, datetime('now'), ?, ?);
#+end_src

#+begin_src javascript
// Frontend HTMX integration
document.addEventListener('DOMContentLoaded', function() {
  // Real-time search functionality
  const searchInput = document.getElementById('search');
  let searchTimeout;
  
  searchInput.addEventListener('input', function(e) {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
      const query = e.target.value;
      if (query.length > 2) {
        htmx.ajax('GET', `/api/search?q=${encodeURIComponent(query)}`, {
          target: '#search-results',
          swap: 'innerHTML'
        });
      }
    }, 300);
  });
});
#+end_src

#+begin_src json
{
  "name": "mekkanote",
  "version": "1.0.0",
  "description": "AI-powered note-taking with org-mode support",
  "main": "src/server.ts",
  "scripts": {
    "start": "deno run --allow-all src/server.ts",
    "dev": "deno run --allow-all --watch src/server.ts",
    "test": "deno test --allow-all",
    "build": "deno bundle src/server.ts dist/server.js"
  },
  "dependencies": {
    "hono": "^3.0.0"
  }
}
#+end_src

** Performance Monitoring                                              :monitoring:
:PROPERTIES:
:ID:       820519G6-5C87-615H-B5GE-D9F939974191
:CREATED:  [2025-08-26 Tue 12:35]
:CATEGORY: metrics
:EFFORT:   1:00
:END:

Monitoring and observability examples:

#+begin_src yaml
# Docker Compose configuration
version: '3.8'
services:
  mekkanote:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./notes:/app/notes
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
#+end_src
```
- **Data Retrieval:**
  - Fix TaskEither/Either usage patterns according to functional programming guidelines
  - Implement UUID-based note lookup functionality
  - Ensure UI displays created notes correctly
- **Testing:**
  - Validate note creation and retrieval via API endpoints
  - Verify file format compliance with architecture.md specifications
  - Test UI functionality shows proper note listing

## 1. Overview

This specification covers the troubleshooting and fixing of the MekkaNote storage system to ensure compliance with the documented architecture. The system had multiple conflicting implementations and incorrect functional programming patterns that prevented proper note storage and retrieval.

## 2. Core Concepts

### 2.1 User Experience

- **Note Creation:** Users can create notes via API that are properly saved as .org files with correct formatting
- **Note Retrieval:** Users can retrieve notes by UUID through both API endpoints and UI interface
- **UI Display:** The web interface correctly shows all created notes in the notes list

### 2.2 Backend Logic

- **Single Source of Truth:** FileSystemManager is the authoritative storage implementation
- **Functional Programming:** Proper TaskEither and Either usage for error handling
- **File Format:** Org-mode compliant format with :PROPERTIES: blocks and standard metadata

## 3. Implementation Details

### 3.1 Frontend (src/server.ts)

- Replace conflicting NoteService with FileSystemManager
- Fix Either/TaskEither usage patterns with isLeft/isRight functions
- Update API endpoints to use proper functional error handling
- Ensure UI endpoints read from actual .org files instead of mock data

### 3.2 Backend (utils/file_system_manager.ts)

- Fix UUID generation using crypto.randomUUID() instead of broken v4.generate()
- Update org-mode format to use :PROPERTIES: blocks with :ID: fields
- Implement proper file lookup by UUID in readOrgFile method
- Fix writeOrgFile to use correct org-mode properties format

### 3.3 Database (File System)

- Notes stored as individual .org files in ./notes/ directory
- File naming convention: YYYYMMDD-HHMMSS-uuid.org
- File format includes proper org-mode headers and properties blocks

## 4. Testing Strategy

- **API Testing (Manual curl commands):**
  - Test note creation via POST /api/notes
  - Test note retrieval via GET /api/notes/:id
  - Verify proper JSON responses and error handling
- **File System Validation (Direct file inspection):**
  - Verify .org files are created with correct naming convention
  - Check file contents match org-mode format specifications
  - Confirm UUID consistency between filename and properties
- **UI Testing (Browser automation with Playwright):**
  - Navigate to web interface and verify note listing
  - Test note creation through UI
  - Validate empty state vs populated state display

## 5. Benefits

- **Architecture Compliance:** System now follows documented specifications exactly
- **Functional Programming:** Proper error handling patterns improve reliability and maintainability
- **Org-Mode Compatibility:** Notes are compatible with standard org-mode tools and conventions
- **Data Portability:** Users own their data in standard, portable format
- **Reliability:** Elimination of conflicting implementations reduces bugs and inconsistencies

## 6. File Structure

```
.
├── utils/
│   └── file_system_manager.ts      # Modified - Fixed UUID, Either usage, org format
├── specs/
│   └── note-storage-troubleshooting-fix.md  # This document
├── src/
│   ├── server.ts                   # Modified - Replaced NoteService, fixed Either patterns
│   └── services/
│       └── note_service.ts         # Deprecated - No longer used
└── notes/                          # Created - Directory for .org files
    ├── YYYYMMDD-HHMMSS-uuid.org    # New format files
    └── ...
```

## 7. Affected Files

- **Modified Files:**
  - `src/server.ts` - Replaced NoteService imports with FileSystemManager, fixed Either usage
  - `utils/file_system_manager.ts` - Fixed UUID generation, org-mode format, file lookup
  - Created proper .org files in `./notes/` directory

## 8. Issues Resolved

### 8.1 Architectural Issues
- **Multiple Conflicting Services:** Eliminated duplicate NoteService implementations
- **Mock vs Real Data:** Replaced mock file system with actual .org file operations
- **Storage Location:** Fixed directory paths from mekkanote-data/notes to ./notes
- **File Format:** Updated from JSON to proper org-mode .org format

### 8.2 Technical Issues
- **UUID Generation:** Fixed v4.generate() function call to crypto.randomUUID()
- **Either Usage:** Corrected .isLeft() method calls to isLeft() function usage
- **TaskEither Patterns:** Fixed functional programming patterns according to guidelines
- **File Parsing:** Updated parser to handle new :PROPERTIES: org-mode format

### 8.3 Functional Issues
- **Note Creation:** API now successfully creates .org files with proper format
- **Note Retrieval:** API can read back created notes with correct UUID lookup
- **UI Display:** Web interface shows actual created notes instead of empty state

## 9. Verification Steps

1. **Create Note via API:**
   ```bash
   curl -X POST http://localhost:8000/api/notes -H "Content-Type: application/json" -d '{"title": "Test", "content": "Hello world"}'
   ```

2. **Verify File Creation:**
   ```bash
   ls ./notes/
   cat ./notes/YYYYMMDD-HHMMSS-uuid.org
   ```

3. **Retrieve Note via API:**
   ```bash
   curl http://localhost:8000/api/notes/[uuid]
   ```

4. **Check UI Display:**
   Navigate to http://localhost:8000 and verify notes are listed

## 10. Org-Mode Format Specification

**Current Implementation:**
```org
:PROPERTIES:
:ID:       UUID-IN-UPPERCASE
:END:
#+title: Note Title
#+CREATED: [YYYY-MM-DD Weekday HH:MM]
#+UPDATED: [YYYY-MM-DD Weekday HH:MM]

Note content here
```

This format ensures compatibility with standard org-mode tools and follows established conventions for org-mode document structure.