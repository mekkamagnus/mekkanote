# Chore: Apply mobile mockup design to the entire application

## Chore Description
Apply the Obsidian-style mobile design from mockup-mobile.html to the entire MekkaNote application. This involves updating all screens to use a mobile-first, minimalist design with the following key changes:

1. **Remove desktop-first layouts**: Eliminate container-based layouts with large padding
2. **Implement full-screen mobile layouts**: Use 100vh/100vw layouts with minimal headers
3. **Add Obsidian-style markdown editor**: Replace form-based editors with full-screen monospace editors
4. **Implement markdown toolbar**: Add markdown formatting buttons (B, I, H1, H2, lists, checkbox, quote, [[ ]])
5. **Update navigation**: Use minimal headers with back buttons and hamburger menus
6. **Apply dark theme colors**: Use the mockup's color scheme (--bg-primary: #0a0a0a, --bg-secondary: #1a1a1a, etc.)
7. **Implement mobile note list**: Use horizontal layout with document icons and inline dates
8. **Update modals**: Style command palette and link search modals to match mobile design

## Relevant Files

### Existing Files to Modify

- **app/globals.css** - Global styles file
  - Add mobile-first CSS variables from mockup
  - Add full-screen layout utilities
  - Add markdown toolbar styles
  - Add mobile note card styles

- **app/layout.tsx** - Root layout component
  - Update viewport meta tag for proper mobile rendering
  - Ensure proper mobile PWA settings

- **app/notes/page.tsx** - Notes list page
  - Remove container-based layout
  - Implement full-screen mobile layout with minimal header
  - Add search and create buttons in header
  - Use mobile note list component

- **components/notes-list.tsx** - Notes list component
  - Update to horizontal card layout with document icon
  - Display inline dates instead of separate lines
  - Remove card-based desktop layout

- **app/notes/create/page.tsx** - Create note page
  - Remove container and title heading
  - Use Obsidian-style editor component

- **components/note-creation-form.tsx** - Note creation form component
  - Replace form-based layout with full-screen editor
  - Add markdown toolbar
  - Use monospace font for textarea
  - Add minimal header with back button

- **app/notes/[id]/page.tsx** - Note detail page
  - Remove card-based layout
  - Implement full-screen reading view
  - Add AI suggestions section with gradient background
  - Add tags and links sections inline
  - Add bottom toolbar with Edit, [[ ]], and menu buttons

- **app/notes/[id]/edit/page.tsx** - Edit note page
  - Remove form-based layout
  - Use Obsidian-style editor component (same as create)
  - Add markdown toolbar
  - Add minimal header with back button

- **components/navigation/mobile-navigation.tsx** - Mobile navigation component
  - Update to match mockup's drawer style
  - Add dark theme colors

- **components/global/command-palette.tsx** - Command palette component
  - Update modal styles to match mobile mockup
  - Add full-screen overlay with centered modal
  - Style search input and results

- **components/modals/link-search-modal.tsx** - Link search modal component
  - Update to match mobile modal design
  - Add proper styling for note search results

### New Files to Create

- **components/editor/obsidian-markdown-editor.tsx** - Reusable Obsidian-style markdown editor component
  - Full-screen textarea with monospace font
  - Markdown toolbar with formatting buttons
  - Minimal header with back button and menu
  - Proper keyboard handling for markdown shortcuts

- **components/mobile/mobile-note-card.tsx** - Mobile note card component
  - Horizontal layout with document icon
  - Title and preview text
  - Inline date display
  - Clickable entire card

## Step by Step Tasks

### Step 1: Update global styles and CSS variables

- Add mobile-first CSS variables from mockup-mobile.html to app/globals.css
- Add utility classes for full-screen layouts
- Add markdown toolbar button styles
- Add mobile note card styles
- Add modal overlay styles

### Step 2: Update root layout for mobile

- Update app/layout.tsx viewport meta tag for proper mobile rendering
- Add PWA manifest and theme color settings

### Step 3: Create reusable Obsidian-style markdown editor component

- Create components/editor/obsidian-markdown-editor.tsx
- Implement full-screen textarea with monospace font (SF Mono, Monaco, Menlo)
- Add markdown toolbar with buttons: B, I, H1, H2, ☰, ✓, », [[ ]]
- Add minimal header with back button and menu
- Implement keyboard shortcuts for markdown formatting
- Handle textarea auto-resize

### Step 4: Create mobile note card component

- Create components/mobile/mobile-note-card.tsx
- Implement horizontal layout with document icon (📄)
- Display title and preview text on same line
- Show date inline on right side
- Make entire card clickable

### Step 5: Update notes list page and component

- Update app/notes/page.tsx:
  - Remove container-based layout
  - Implement full-screen mobile layout with minimal header
  - Add hamburger menu, search, and + create buttons in header
  - Use mobile note list component

- Update components/notes-list.tsx:
  - Replace card-based layout with mobile note cards
  - Use horizontal layout with document icons
  - Display inline dates

### Step 6: Update create note page and form

- Update app/notes/create/page.tsx:
  - Remove container and title heading
  - Use ObsidianMarkdownEditor component

- Update or replace components/note-creation-form.tsx:
  - Replace form-based layout with ObsidianMarkdownEditor
  - Handle form submission with back navigation
  - Remove title/content labels and inputs

### Step 7: Update note detail page

- Update app/notes/[id]/page.tsx:
  - Remove card-based layout
  - Implement full-screen reading view
  - Add minimal header with back, search, and menu buttons
  - Render note content in reading view with proper styling
  - Add AI suggestions section with gradient background (rgba(59, 130, 246, 0.1))
  - Add tags section with suggested tags highlighted
  - Add outbound links and backlinks sections inline
  - Add bottom toolbar with Edit, [[ ]], and menu buttons

### Step 8: Update edit note page

- Update app/notes/[id]/edit/page.tsx:
  - Remove form-based layout
  - Use ObsidianMarkdownEditor component with pre-filled content
  - Add minimal header with back button

### Step 9: Update mobile navigation

- Update components/navigation/mobile-navigation.tsx:
  - Style to match mockup's drawer design
  - Use dark theme colors
  - Ensure proper full-height drawer

### Step 10: Update command palette modal

- Update components/global/command-palette.tsx:
  - Apply modal overlay styles from mockup
  - Style search input to match mobile design
  - Update result items to use horizontal layout with icons
  - Add keyboard shortcut hints at bottom

### Step 11: Update link search modal

- Update components/modals/link-search-modal.tsx:
  - Apply modal overlay styles from mockup
  - Style search input for [[ link searching
  - Update result items with proper styling

### Step 12: Update mobile navigation component

- Update components/navigation/mobile-navigation.tsx:
  - Remove "Home" from navigation items (matching mockup)
  - Keep "Notes" as primary navigation
  - Style drawer to match mockup design

### Step 13: Test responsive behavior across screen sizes

- Verify full-screen layouts work on mobile (< 768px)
- Verify layouts scale appropriately on tablet and desktop
- Ensure proper overflow handling on long content

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `bun run type-check` - Run TypeScript type checker to validate no type errors
- `bun run lint` - Run ESLint to validate code quality
- `bun run build` - Build the application to ensure no build errors

## Notes

- The application uses Next.js 14+ with App Router and Bun runtime
- Current styling uses Tailwind CSS with shadcn/ui components
- The mockup uses a dark theme with specific colors (--bg-primary: #0a0a0a, --bg-secondary: #1a1a1a, --bg-tertiary: #2a2a2a, --text-primary: #ededed, --text-secondary: #a1a1aa, --accent: #3b82f6)
- Monospace fonts for markdown editor: 'SF Mono', 'Monaco', 'Menlo'
- The Obsidian-style editor should use a textarea with minimal chrome, no borders, transparent background
- Mobile-first approach: design for mobile (390×844px iPhone 13/14 Pro) and scale up
- Status bar is not needed in the web app (browser handles this)
- Bottom navigation tabs are not included in the mockup (removed)
- All screens use minimal headers with back buttons and hamburger menus
- The mockup shows 6 screens: Notes List, Create Note, Note Detail, Edit Note, Command Palette, Link Search Modal
