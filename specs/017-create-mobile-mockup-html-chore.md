# Chore: Create mockup-mobile.html with iPhone dimensions

## Chore Description
Create a new `mockup-mobile.html` file that displays all MekkaNote application screens as individual iPhone-sized frames. Each screen should be labeled with a screen number (e.g., "sc01", "sc02") and a descriptive label. Unlike the desktop mockup which uses a sidebar for navigation, the mobile mockup should display all screens simultaneously in a grid layout, with each screen rendered at iPhone dimensions (390x844 pixels for iPhone 13/14 Pro standard). Each screen should have a tab/navigation bar at the bottom showing which screen it is.

## Relevant Files
Use these files to resolve the chore:

- `mockup.html` - Existing desktop mockup with all screens and styling (reuse CSS and content)
- `app/page.tsx` - Home page content and structure
- `app/notes/page.tsx` - Notes list page structure
- `app/notes/create/page.tsx` - Create note page form structure
- `app/notes/[id]/page.tsx` - Note detail page with AI suggestions, links, backlinks
- `app/notes/[id]/edit/page.tsx` - Edit note page structure
- `components/global/command-palette.tsx` - Command palette modal structure
- `components/modals/link-search-modal.tsx` - Link search modal structure
- `components/navigation/mobile-navigation.tsx` - Mobile navigation drawer structure

### New Files
- `mockup-mobile.html` - New file to be created with all screens in iPhone-sized frames

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Create the HTML structure and CSS for iPhone frame layout
- Create `mockup-mobile.html` with proper HTML5 doctype and meta tags
- Copy CSS variables and base styles from `mockup.html` (colors, typography, etc.)
- Create iPhone frame container styles:
  - Frame dimensions: 390px width × 844px height (iPhone 13/14 Pro standard)
  - Rounded corners (40px border-radius)
  - Border styling to simulate device frame (8px black border)
  - Notch/header area simulation (status bar with time, battery, signal icons)
  - Bottom tab bar for each screen (80px height with navigation items)
- Create grid layout for displaying multiple iPhone frames:
  - Responsive grid with auto-fit to show multiple frames
  - Gap between frames (40px)
  - Center alignment

### 2. Define all screens to be rendered
Identify and create placeholder sections for all screens:
- **sc01** - Home Page (welcome screen with feature highlights)
- **sc02** - Notes List (grid of note cards with search)
- **sc03** - Create Note (form with org-mode template)
- **sc04** - Note Detail (full note with AI suggestions, tags, outbound links, backlinks)
- **sc05** - Edit Note (edit form with content)
- **sc06** - Command Palette Modal (overlay on Notes List context)
- **sc07** - Link Search Modal (overlay on editor context)
- **sc08** - Mobile Navigation Drawer (slide-out menu)

Total: 8 screens to be rendered

### 3. Implement the iPhone frame wrapper component
- Create reusable HTML structure for each iPhone frame:
  - Outer container with 390x844px dimensions
  - Screen label overlay (e.g., "sc01 - Home Page") positioned at top-right of frame
  - Status bar simulation (44px height) with:
    - Time display (left)
    - Signal strength indicator
    - Battery indicator (right)
  - Content area (remaining height minus status bar and tab bar)
  - Bottom tab bar (80px height) with:
    - Home icon/label
    - Notes icon/label
    - Create note icon/label
    - Active state indication for current screen

### 4. Implement each screen content

#### Screen 01 - Home Page (sc01)
- Welcome message: "Welcome to MekkaNote"
- Subtitle: "Your AI-powered knowledge base"
- Feature cards (Smart Linking, Auto-Tagging, Quick Search)
- CTA buttons: "View My Notes", "Create New Note"
- Mark Home tab as active in bottom nav

#### Screen 02 - Notes List (sc02)
- Header with "My Notes" title and "New Note" button
- Search input field
- Grid of note cards (3-4 sample notes)
- Each card shows: title, content preview, creation date
- Mark Notes tab as active in bottom nav

#### Screen 03 - Create Note (sc03)
- Header with "Create New Note" title, Cancel/Save buttons
- Title input field (pre-filled with timestamp)
- Content textarea with org-mode template
- Status bar showing "Auto-saved"
- Mark Create tab as active in bottom nav

#### Screen 04 - Note Detail (sc04)
- Header with back button, note title, timestamps, Edit button
- Note content rendered with org-mode styling
- AI Suggestions section with Accept/Dismiss buttons
- Tags section
- Outbound links section
- Backlinks section
- Mark appropriate active state (none or Notes)

#### Screen 05 - Edit Note (sc05)
- Header with back button, "Edit Note" title, Save Changes button
- Title input field (pre-filled)
- Content textarea with note content
- Status bar showing "Auto-saved"
- No active tab (editing mode)

#### Screen 06 - Command Palette Modal (sc06)
- Base: Notes List background (dimmed)
- Modal overlay:
  - Search input with icon
  - Search results list (3-4 sample notes)
  - Selected item highlighting
  - Keyboard shortcut hints at bottom

#### Screen 07 - Link Search Modal (sc07)
- Base: Create/Edit Note background (dimmed)
- Modal overlay:
  - Search input with "[[" prefix
  - Search results list
  - "Create new note" option when no match found
  - Keyboard navigation hints

#### Screen 08 - Mobile Navigation Drawer (sc08)
- Base: Notes List background (dimmed with overlay)
- Slide-out drawer from right (280px width):
  - Menu header with close button
  - Nav items: Home, Notes, Create Note
  - Theme toggle at bottom
  - Active state on Notes item

### 5. Add screen labels and numbering
- Position each screen label consistently:
  - Top-right corner outside the frame
  - Format: "sc## - Screen Name"
  - Semi-transparent background for readability
  - Matching color scheme (accent color)
- Ensure all 8 screens have unique identifiers sc01-sc08

### 6. Add responsive and scrolling support
- Enable vertical scrolling within each iPhone frame content area
- Hide scrollbars for cleaner appearance (`::-webkit-scrollbar { display: none; }`)
- Ensure content that exceeds frame height is scrollable
- Add page-level responsive adjustments:
  - On smaller viewports, stack iPhone frames vertically
  - Maintain aspect ratio and readability

### 7. Add JavaScript for interactivity (optional enhancements)
- Click handlers for tab bar navigation (visual feedback)
- Modal toggle demonstrations
- Simple state management for active tab highlighting
- Note: This is a mockup, so full navigation not required - just visual feedback

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

- `ls -lh mockup-mobile.html` - Verify the file was created (should be ~20-30KB)
- `file mockup-mobile.html` - Verify it's a proper HTML file
- `grep -c "sc0[1-8]" mockup-mobile.html` - Verify all 8 screen labels exist (should return 8)
- `grep -c "iphone-frame" mockup-mobile.html` - Verify iPhone frame containers exist (should return 8)
- `grep -c "tab-bar" mockup-mobile.html` - Verify tab bars exist for each screen (should return 8)
- Open in browser: `python3 -m http.server 8001` and navigate to `http://localhost:8001/mockup-mobile.html` to visually verify:
  - All 8 screens render correctly
  - iPhone frames display at correct dimensions
  - Screen labels are visible and numbered correctly
  - Bottom tab bars display with correct active states
  - Content is readable and scrollable within frames
  - Modals display correctly as overlays

## Notes
- iPhone dimensions: 390×844px is the standard for iPhone 13/14 Pro (logical resolution)
- Status bar height: 44px (standard iOS status bar)
- Bottom tab bar height: 80px (standard iOS tab bar)
- Border radius: 40px for realistic iPhone frame appearance
- Border: 8px black to simulate device bezel
- Content area calculation: 844 - 44 (status) - 80 (tab bar) = 720px for content
- Screen numbering uses two digits with leading zero: sc01, sc02, etc.
- Screen labels should be descriptive and match actual page names from the app
- The mockup is a static HTML file, not a functional app - it demonstrates UI design
- Mockup should be self-contained with all CSS inline in `<style>` tags
- Use the same color scheme as `mockup.html` for consistency
- Consider using a light gray background for the page to contrast with the dark iPhone frames
- The grid should wrap responsively: on desktop show multiple frames per row, on mobile stack vertically
