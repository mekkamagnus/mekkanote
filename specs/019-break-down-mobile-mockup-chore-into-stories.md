# Chore: Break down mobile mockup design chore into user stories and update PRD

## Chore Description
Break down the comprehensive mobile mockup design changes from spec 018 into individual user stories that can be added to the PRD. The changes have already been implemented, so this chore is about creating proper user story documentation for the work that was done.

Each user story should follow the existing PRD format with:
- Unique ID (US-045, US-046, etc.)
- Title describing the feature
- Description from user's perspective
- Acceptance criteria
- Priority
- Pass status (true, since work is complete)
- Notes documenting implementation details

## Relevant Files
Use these files to resolve the chore:

- **specs/018-apply-mobile-mockup-design-chore.md** - Source chore spec to break down
  - Contains all the implemented changes
  - Lists 13 steps that were completed
  - Describes new components and modified files

- **scripts/ralph/prd.json** - PRD file to update
  - Contains all user stories
  - Needs new stories added
  - Follows JSON structure with userStories array

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Analyze the implemented changes

Review the 13 steps from spec 018 and identify distinct user-facing features:
1. Global styles and CSS variables (developer story, infrastructure)
2. Root layout mobile optimization (developer story, infrastructure)
3. Obsidian-style markdown editor component (user-facing feature)
4. Mobile note card component (user-facing feature)
5. Notes list page mobile layout (user-facing feature)
6. Create note page Obsidian editor (user-facing feature)
7. Note detail page reading view (user-facing feature)
8. Edit note page Obsidian editor (user-facing feature)
9. Mobile navigation drawer (user-facing feature)
10. Command palette mobile styling (user-facing feature)
11. Link search modal mobile styling (user-facing feature)
12. Remove Home from navigation (user-facing feature)
13. Responsive testing (validation step)

### Step 2: Create user stories for user-facing features

Create the following user stories with proper acceptance criteria:

**US-045: Apply mobile-first dark theme colors**
- Add CSS variables for dark theme colors
- Apply colors to all pages and components
- Ensure consistency across application

**US-046: Create Obsidian-style markdown editor**
- Full-screen editor with monospace font
- Markdown toolbar with formatting buttons
- Minimal header with back button
- Keyboard shortcuts for formatting

**US-047: Create mobile note card component**
- Horizontal layout with document icon
- Title and preview text
- Inline date display
- Clickable entire card

**US-048: Update notes list to mobile layout**
- Full-screen mobile layout
- Minimal header with hamburger menu
- Mobile note cards
- Remove desktop container layout

**US-049: Update create note to use Obsidian editor**
- Full-screen editor experience
- No form-based layout
- Markdown toolbar
- Auto-save on navigation

**US-050: Update note detail to reading view**
- Full-screen reading layout
- Minimal header
- AI suggestions with gradient background
- Tags and links sections
- Bottom toolbar with actions

**US-051: Update edit note to use Obsidian editor**
- Full-screen editor experience
- Pre-filled with existing content
- Markdown toolbar
- Save and cancel actions

**US-052: Style command palette for mobile**
- Full-screen overlay modal
- Mobile-styled search input
- Horizontal result items with icons
- Keyboard shortcut hints

**US-053: Style link search modal for mobile**
- Full-screen overlay modal
- Mobile-styled search input
- Note result items with icons
- Create new note option

**US-054: Update mobile navigation drawer**
- Remove "Home" from navigation
- Dark theme colors
- Proper drawer styling
- Full-height navigation

### Step 3: Update PRD JSON file

Add the new user stories to scripts/ralph/prd.json:
- Read the current PRD
- Add new stories after US-044
- Assign priorities (45-54)
- Set passes: true for all (work is complete)
- Add implementation notes
- Write the updated PRD

### Step 4: Run ralph.sh script

Execute the ralph.sh script to update the Ralph Loop system:
- Navigate to scripts/ralph directory
- Execute ./ralph.sh script
- Verify script runs successfully
- Check for any errors in output

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

- `cat scripts/ralph/prd.json | jq '.userStories | length'` - Verify 10 new stories added (should be 54 total)
- `cat scripts/ralph/prd.json | jq '.userStories[-1].id'` - Verify last story is US-054
- `bash scripts/ralph/ralph.sh 2>&1 | head -20` - Run ralph.sh and check for errors

## Notes

- All user stories should have passes: true since the work was already completed in spec 018
- Priority should follow sequential order (45-54)
- Notes field should contain implementation details from spec 018
- This is a documentation-only chore - no code changes needed
- The goal is to properly document completed work in the PRD format
