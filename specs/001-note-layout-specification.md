# Note Layout Specification v1.0
*Apple Notes Interface Design Standards*

## Document Overview

**Document Type**: UI/UX Design Specification  
**Project**: MekkaNote - Apple Notes Inspired Interface  
**Version**: 1.0  
**Date**: 2025-08-27  
**Status**: Final Draft

## Design Philosophy

### Core Principles

1. **Clarity Above All**: Every element serves a clear purpose without visual clutter
2. **Content-First Design**: The note content is the primary focus, with interface elements supporting rather than competing
3. **Intuitive Hierarchy**: Visual hierarchy guides users naturally through the interface
4. **Minimal Cognitive Load**: Reduce decision fatigue with clear, predictable patterns
5. **Touch-First Interactions**: All elements designed for finger navigation with appropriate touch targets

### Apple Design Language Integration

- **Spatial Relationships**: Use of whitespace to create breathing room and group related elements
- **Progressive Disclosure**: Show only essential information at each level, revealing details on demand
- **Consistent Metaphors**: Folder/document metaphors that align with user mental models
- **Gentle Transitions**: Subtle animations that provide feedback without distraction

## Typography Specifications

### Font Family
```css
Primary: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif
Fallback: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif
Monospace: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace
```

### Type Scale & Hierarchy

#### Navigation Headers
- **Font Size**: 34px (2.125rem)
- **Font Weight**: 700 (Bold)
- **Line Height**: 1.2
- **Letter Spacing**: -0.02em
- **Usage**: Main folder titles ("All iCloud", "Folders")

#### Section Headers
- **Font Size**: 28px (1.75rem)
- **Font Weight**: 600 (Semibold)
- **Line Height**: 1.25
- **Letter Spacing**: -0.01em
- **Usage**: Time-based sections ("Today", "Yesterday")

#### Note Titles
- **Font Size**: 17px (1.0625rem)
- **Font Weight**: 600 (Semibold)
- **Line Height**: 1.35
- **Letter Spacing**: 0
- **Usage**: Individual note titles in lists

#### Note Preview
- **Font Size**: 15px (0.9375rem)
- **Font Weight**: 400 (Regular)
- **Line Height**: 1.4
- **Letter Spacing**: 0
- **Color**: Secondary text color
- **Usage**: Note content preview text

#### Metadata Text
- **Font Size**: 13px (0.8125rem)
- **Font Weight**: 400 (Regular)
- **Line Height**: 1.3
- **Letter Spacing**: 0
- **Color**: Tertiary text color
- **Usage**: Timestamps, folder names, note counts

#### Folder Names
- **Font Size**: 17px (1.0625rem)
- **Font Weight**: 400 (Regular)
- **Line Height**: 1.35
- **Letter Spacing**: 0
- **Usage**: Folder list items

## Color Palette

### Primary Colors (from UI Design Guide)
```css
--kelly-green: #00aa00;      /* Primary accent, actions, highlights */
--ash-gray: #96bbbb;         /* Secondary text, subtle borders */
--black-olive: #414535;      /* Primary text, dark surfaces */
--dutch-white: #f2e3bc;      /* Light backgrounds, cards */
--lion: #c19875;             /* Warm accent, hover states */
```

### Semantic Color Mapping
```css
--color-primary: var(--kelly-green);
--color-secondary: var(--ash-gray);
--color-accent: var(--lion);
--color-neutral: var(--black-olive);

/* Background Colors */
--bg-primary: #ffffff;           /* Pure white for main content */
--bg-secondary: #f5f5f7;         /* Light gray for sections */
--bg-tertiary: #f2f2f7;          /* Slightly darker for contrast */
--bg-grouped: #ffffff;           /* White for grouped content */

/* Text Colors */
--text-primary: #000000;         /* Primary text (black) */
--text-secondary: #6d6d70;       /* Secondary text (gray) */
--text-tertiary: #8e8e93;        /* Tertiary text (light gray) */
--text-accent: var(--kelly-green); /* Accent links/buttons */

/* Border Colors */
--border-primary: #c6c6c8;       /* Main borders */
--border-secondary: #e5e5ea;     /* Subtle borders */
--border-tertiary: #f2f2f7;      /* Very subtle dividers */
```

## Layout Structure

### Screen Hierarchy (Mobile Portrait)

```
┌─────────────────────────────┐
│ Status Bar (44pt)           │
├─────────────────────────────┤
│ Navigation Bar (44pt)       │
│ ◀ Title            Action ▶ │
├─────────────────────────────┤
│                             │
│ Content Area                │
│ (Scrollable)                │
│                             │
│                             │
│                             │
│                             │
│                             │
│                             │
├─────────────────────────────┤
│ Tab Bar (49pt + safe area)  │
│ [📄] [🔍] [📁] [⚙️]        │
└─────────────────────────────┘
```

### Navigation Patterns

#### Breadcrumb Navigation
```
Folders ▶ All iCloud ▶ Note Title
```
- Uses chevron separators (SF Symbol: chevron.right)
- Kelly green color for active/actionable elements
- Touch targets: minimum 44pt height

#### Back Button Pattern
```
◀ Folders
```
- Left-aligned back button with label
- Uses iOS standard back chevron
- 44pt touch target

## Component Specifications

### 1. Folder List View

#### ASCII Wireframe
```
┌─────────────────────────────────────┐
│ ◀ Back                    Edit      │  <- Navigation Bar
├─────────────────────────────────────┤
│                                     │
│ Folders                             │  <- Page Title (34pt)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📝  Quick Notes             1 ▶ │ │  <- Folder Item
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 👥  Shared                 80 ▶ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ iCloud                        ⌄     │  <- Section Header
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📁  All iCloud          2,622 ▶ │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 📁  Notes                 849 ▶ │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ 📄 [🔍] [📁] [⚙️]                  │  <- Tab Bar
└─────────────────────────────────────┘
```

#### Component Specifications

**Folder Item**:
- Height: 44pt minimum
- Padding: 16pt horizontal, 12pt vertical
- Border: Bottom border, 0.5pt, --border-secondary
- Background: --bg-grouped
- Active state: --bg-secondary

**Icon Specifications**:
- Size: 22pt × 22pt
- Margin: 12pt trailing margin
- Color: --kelly-green for system folders, --lion for user folders

**Typography**:
- Folder name: 17pt, Regular weight, --text-primary
- Count badge: 13pt, Regular weight, --text-secondary
- Right-aligned with 8pt margin from chevron

### 2. Note List View

#### ASCII Wireframe
```
┌─────────────────────────────────────┐
│ ◀ Folders              ⋯      📤    │  <- Navigation Bar
├─────────────────────────────────────┤
│                                     │
│ All iCloud                          │  <- Folder Title (34pt)
│                                     │
│ Pinned                        ⌄     │  <- Section Header
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⭐ Home                         │ │  <- Pinned Note
│ │ 2025-08-17 ⭐ 2025 - ⭐ 2025-Q3 │ │
│ │ 📁 3 Resources                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Today                               │  <- Time Section
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🟡 Macaco (猴子翻) 的数学分解...  │ │  <- Note Item
│ │ ⏰ 17:55 🐵 Macaco 教学分解 (猴子翻) │ │
│ │ 📁 巴西战舞课程数据库            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ How Chinese people think | Ke... │ │
│ │ 17:54 short flat fast          │ │
│ │ 📁 Notes                        │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ 2,622 Notes                    ✏️  │  <- Footer Info
└─────────────────────────────────────┘
```

#### Note List Item Specifications

**Layout**:
- Height: Variable (minimum 60pt)
- Padding: 16pt horizontal, 12pt vertical
- Border: Bottom border, 0.5pt, --border-secondary

**Content Structure**:
1. **Title Line**: Note title (17pt, Semibold, --text-primary)
2. **Metadata Line**: Time, tags, preview (13pt, Regular, --text-secondary)
3. **Folder Line**: Folder location (13pt, Regular, --text-tertiary)

**Interactive States**:
- Default: --bg-grouped
- Hover: --bg-secondary
- Active/Press: --bg-tertiary

### 3. Note Detail View

#### ASCII Wireframe
```
┌─────────────────────────────────────┐
│ ◀ All iCloud          📤      ⋯    │  <- Navigation Bar
├─────────────────────────────────────┤
│                                     │
│ How Chinese people think |          │  <- Note Title (28pt)
│ Keyu Jin and Lex Fridman            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [▶]  Video Thumbnail            │ │  <- Media Content
│ │     YouTube Preview             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ short flat fast                     │  <- Content
│                                     │
│                                     │
│ Chinese Economist                   │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ ✅── [📊] [📎] [^] [✏️]            │  <- Action Bar
└─────────────────────────────────────┘
```

### 4. Note Editor View

#### ASCII Wireframe
```
┌─────────────────────────────────────┐
│ ◀ All iCloud                 Done   │  <- Navigation Bar
├─────────────────────────────────────┤
│                                     │
│ |                                   │  <- Cursor in content
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ Aa ✅── [📊] [📎] [^]        ✕     │  <- Formatting Bar
├─────────────────────────────────────┤
│ [q][w][e][r][t][y][u][i][o][p]     │  <- Keyboard
│  [a][s][d][f][g][h][j][k][l]       │
│   [z][x][c][v][b][n][m]     [⌫]    │
│ [🌐]    [space]         [return]   │
└─────────────────────────────────────┘
```

## UI Workflow Processes

### 1. App Launch & Navigation Flow

#### Initial Launch Sequence
**Keyframe 1: App Launch (Splash)**
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│            📝 MekkaNote             │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Keyframe 2: Folder List (Default View)**
```
┌─────────────────────────────────────┐
│ ◀ Back                    Edit      │  <- Navigation Bar
├─────────────────────────────────────┤
│                                     │
│ Folders                             │  <- Page Title (34pt)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📝  Quick Notes             1 ▶ │ │  <- Folder Item
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 📁  All iCloud          2,622 ▶ │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [📄] [🔍] [📁] [⚙️]                │  <- Tab Bar
└─────────────────────────────────────┘
```
**Flow**: Splash (0.5s) → Folder List (default)
**User Action**: Tap "All iCloud" folder

### 2. Folder Navigation Workflow

#### Flow: Folder List → Note List
**User Action**: Tap "All iCloud" folder

**Keyframe 3: Transition Animation (0.3s)**
```
┌─────────────────────────────────────┐
│ ◀ Folders              ⋯      📤    │  <- Navigation updates
├─────────────────────────────────────┤
│                                     │
│ All iCloud              [sliding]   │  <- Title animates in
│                                     │
│ [Content slides from right]         │  <- Content transition
│                                     │
└─────────────────────────────────────┘
```

**Keyframe 4: Note List (Final)**
```
┌─────────────────────────────────────┐
│ ◀ Folders              ⋯      📤    │  <- Back button shows "Folders"
├─────────────────────────────────────┤
│                                     │
│ All iCloud                          │  <- Folder Title (34pt)
│                                     │
│ Today                               │  <- Time Section
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🟡 Meeting Notes - Sprint...    │ │  <- Note Items
│ │ ⏰ 17:55 #meeting #work         │ │
│ │ 📁 Notes                        │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ 2,622 Notes                    ✏️  │  <- Footer shows count
└─────────────────────────────────────┘
```
**Navigation Elements**:
- Back button updates to "◀ Folders"
- Title changes to folder name
- Content slides in from right
- Footer shows note count

### 3. Note Selection & Viewing Workflow

#### Flow: Note List → Note Detail
**User Action**: Tap note item

**Keyframe 5: Note Detail View**
```
┌─────────────────────────────────────┐
│ ◀ All iCloud          📤      ⋯    │  <- Back shows parent folder
├─────────────────────────────────────┤
│                                     │
│ Meeting Notes - Sprint Planning     │  <- Note Title (28pt)
│                                     │
│ Today's standup covered the new     │  <- Content starts immediately
│ feature rollout and upcoming        │
│ sprint planning. Key topics:        │
│                                     │
│ • User feedback integration         │
│ • Performance improvements          │
│ • Testing strategy                  │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ ✅── [📊] [📎] [^] [✏️]            │  <- Action Bar
└─────────────────────────────────────┘
```
**Interaction Flow**:
1. User taps note → immediate transition
2. Content loads progressively
3. Action bar appears at bottom
4. Share/edit buttons available

### 4. Note Editing Workflow

#### Flow: Note Detail → Edit Mode
**User Action**: Tap edit button (✏️) or double-tap content

**Keyframe 6: Edit Mode Transition**
```
┌─────────────────────────────────────┐
│ ◀ All iCloud                 Done   │  <- "Done" appears
├─────────────────────────────────────┤
│                                     │
│ Meeting Notes - Sprint Planning|    │  <- Cursor appears in title
│                                     │
│ Today's standup covered the new     │  <- Content becomes editable
│ feature rollout and upcoming        │
│ sprint planning. Key topics:        │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ Aa ✅── [📊] [📎] [^]        ✕     │  <- Formatting toolbar
├─────────────────────────────────────┤
│ [Keyboard slides up]                │  <- iOS keyboard
└─────────────────────────────────────┘
```

**Keyframe 7: Active Editing**
```
┌─────────────────────────────────────┐
│ ◀ All iCloud                 Done   │
├─────────────────────────────────────┤
│                                     │
│ Meeting Notes - Sprint Planning     │
│                                     │
│ Today's standup covered the new     │
│ feature rollout and upcoming        │
│ sprint planning. Key topics:|       │  <- Active cursor
│                                     │
│ • User feedback integration         │
│ • Performance improvements          │
│                                     │
├─────────────────────────────────────┤
│ Aa ✅── [📊] [📎] [^]        ✕     │  <- Formatting options
├─────────────────────────────────────┤
│ [q][w][e][r][t][y][u][i][o][p]     │  <- iOS Keyboard
│  [a][s][d][f][g][h][j][k][l]       │
│   [z][x][c][v][b][n][m]     [⌫]    │
└─────────────────────────────────────┘
```

#### Exit Edit Mode
**User Action**: Tap "Done" or swipe down keyboard

**Keyframe 8: Save & Return to View**
```
┌─────────────────────────────────────┐
│ ◀ All iCloud          📤      ⋯    │  <- Returns to view mode
├─────────────────────────────────────┤
│                                     │
│ Meeting Notes - Sprint Planning     │  <- Updated content
│                                     │
│ Today's standup covered the new     │
│ feature rollout and upcoming        │
│ sprint planning. Key topics:        │
│                                     │
│ • User feedback integration         │
│ • Performance improvements          │
│ • [NEW CONTENT ADDED]              │
│                                     │
├─────────────────────────────────────┤
│ ✅── [📊] [📎] [^] [✏️]            │  <- Action bar returns
└─────────────────────────────────────┘
```

### 5. Create New Note Workflow

#### Flow: Note List → New Note Creation
**User Action**: Tap compose button (✏️) in footer or FAB

**Keyframe 9: New Note Editor**
```
┌─────────────────────────────────────┐
│ ◀ All iCloud                 Done   │  <- Back to parent folder
├─────────────────────────────────────┤
│                                     │
│ |                                   │  <- Cursor ready in empty note
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ Aa ✅── [📊] [📎] [^]        ✕     │  <- Full formatting toolbar
├─────────────────────────────────────┤
│ [iOS Keyboard active]               │
└─────────────────────────────────────┘
```

**User Types Content**:
**Keyframe 10: New Note with Content**
```
┌─────────────────────────────────────┐
│ ◀ All iCloud                 Done   │
├─────────────────────────────────────┤
│                                     │
│ Project Ideas|                      │  <- User typed title
│                                     │
│ Brainstorming session notes:        │  <- User typed content
│                                     │
│ 1. Mobile app improvements          │
│ 2. Database optimization            │
│ 3. User interface redesign          │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ Aa ✅── [📊] [📎] [^]        ✕     │
└─────────────────────────────────────┘
```

**Save and Return**:
**User Action**: Tap "Done"

**Keyframe 11: Back to Note List with New Note**
```
┌─────────────────────────────────────┐
│ ◀ Folders              ⋯      📤    │
├─────────────────────────────────────┤
│                                     │
│ All iCloud                          │
│                                     │
│ Today                               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📝 Project Ideas            NEW │ │  <- New note appears at top
│ │ ⏰ Just now Brainstorming...    │ │
│ │ 📁 All iCloud                   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🟡 Meeting Notes - Sprint...    │ │  <- Previous notes below
│ │ ⏰ 17:55 #meeting #work         │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 2,623 Notes                    ✏️  │  <- Count updated
└─────────────────────────────────────┘
```

### 6. Note Actions & Context Menu Workflow

#### Flow: Long Press on Note Item
**User Action**: Long press note in list

**Keyframe 12: Context Menu Appears**
```
┌─────────────────────────────────────┐
│ ◀ Folders              ⋯      📤    │
├─────────────────────────────────────┤
│                                     │
│ All iCloud                          │
│                                     │
│ Today                               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🟡 Meeting Notes - Sprint...    │▓│  <- Selected note highlighted
│ │ ⏰ 17:55 #meeting #work         │▓│
│ │ 📁 Notes                        │▓│
│ └─────────────────────────────────┘▓│
│   ┌───────────────────────────────┐ │  <- Context menu overlay
│   │ 📌 Pin Note                   │ │
│   │ 📁 Move to Folder             │ │
│   │ 🏷️  Add Tags                  │ │
│   │ 📤 Share                      │ │
│   │ ❌ Delete                     │ │
│   └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Flow: Swipe Left for Quick Actions
**User Action**: Swipe left on note item

**Keyframe 13: Swipe Actions Revealed**
```
┌─────────────────────────────────────┐
│ ◀ Folders              ⋯      📤    │
├─────────────────────────────────────┤
│                                     │
│ All iCloud                          │
│                                     │
│ Today                               │
│                                     │
│ ┌─────────────────────────┐[📌][❌] │  <- Note swiped left
│ │ 🟡 Meeting Notes - Sp..│ Pin Del │  <- Quick actions revealed
│ │ ⏰ 17:55 #meeting #work │         │
│ │ 📁 Notes                │         │
│ └─────────────────────────┘         │
│                                     │
└─────────────────────────────────────┘
```

### 7. Search Workflow

#### Flow: Activate Search
**User Action**: Tap search icon in tab bar or pull down in note list

**Keyframe 14: Search Interface**
```
┌─────────────────────────────────────┐
│ Cancel          Search              │  <- Search mode header
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Search notes, tags...        │ │  <- Search input active
│ └─────────────────────────────────┘ │
│                                     │
│ Recent Searches                     │  <- Recent searches section
│                                     │
│ • meeting notes                     │
│ • project ideas                     │
│ • sprint planning                   │
│                                     │
│ Suggested                           │  <- Suggested searches
│                                     │
│ #work  #meeting  #ideas             │  <- Tag suggestions
│                                     │
├─────────────────────────────────────┤
│ [iOS Keyboard]                      │
└─────────────────────────────────────┘
```

**User Types Query**: "meeting"

**Keyframe 15: Search Results**
```
┌─────────────────────────────────────┐
│ Cancel          Search              │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔍 meeting                   ✕  │ │  <- Query with clear button
│ └─────────────────────────────────┘ │
│                                     │
│ Results (3)                         │  <- Results count
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🟡 Meeting Notes - Sprint...    │ │  <- Matching notes
│ │ ⏰ 17:55 ...covered the new...  │ │  <- Content preview
│ │ 📁 Notes                        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 📝 Team Meeting Agenda          │ │
│ │ ⏰ Yesterday ...discuss the...  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [iOS Keyboard]                      │
└─────────────────────────────────────┘
```

### 8. Folder Management Workflow

#### Flow: Create New Folder
**User Action**: Long press in folder list or tap "+" button

**Keyframe 16: New Folder Dialog**
```
┌─────────────────────────────────────┐
│                                     │
│        Create New Folder            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Folder Name                     │ │  <- Input field
│ │ |                               │ │  <- Active cursor
│ └─────────────────────────────────┘ │
│                                     │
│ Choose Icon                         │
│                                     │
│ [📁] [📝] [💼] [🎯] [📚] [⚡]      │  <- Icon selection
│                                     │
│              ┌─────────┐             │
│              │ Cancel  │  [Create]   │  <- Action buttons
│              └─────────┘             │
│                                     │
└─────────────────────────────────────┘
```

**After Creation**:
**Keyframe 17: Updated Folder List**
```
┌─────────────────────────────────────┐
│ ◀ Back                    Edit      │
├─────────────────────────────────────┤
│                                     │
│ Folders                             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📝  Quick Notes             1 ▶ │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 💼  Work Projects           0 ▶ │ │  <- New folder appears
│ └─────────────────────────────────┘ │
│                                     │
│ iCloud                        ⌄     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📁  All iCloud          2,623 ▶ │ │  <- Count reflects new note
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Interaction Specifications

### Gesture Patterns

#### Swipe Gestures
- **Swipe Left**: Reveal note actions (pin, delete) - see Keyframe 13
- **Swipe Right**: Back navigation (when available)
- **Pull to Refresh**: Refresh note list with loading animation
- **Pull Down in Note List**: Activate search interface - see Keyframe 14

#### Tap Behaviors
- **Single Tap**: Select/open item - transitions shown in keyframes
- **Long Press**: Context menu or edit mode - see Keyframe 12
- **Double Tap**: Quick edit mode activation (bypasses view mode)

### Animation Specifications

#### Screen Transitions
```css
/* Page navigation (folder to note list) */
.page-transition {
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1.0);
}

.page-transition.active {
  transform: translateX(0);
}

/* Modal presentations (context menus, dialogs) */
.modal-transition {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
  transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1.0);
}

.modal-transition.active {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Quick feedback (button presses, swipes) */
.touch-feedback {
  transition: transform 0.15s ease-out;
}

.touch-feedback:active {
  transform: scale(0.98);
}

/* Content changes (search results, new notes) */
.content-transition {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.content-transition.loaded {
  opacity: 1;
}
```

#### Loading States & Progressive Enhancement

**Note List Loading**:
```
┌─────────────────────────────────────┐
│ ◀ Folders              ⋯      📤    │
├─────────────────────────────────────┤
│                                     │
│ All iCloud                          │
│                                     │
│ Today                               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ │  <- Skeleton loading
│ │ ▓▓▓▓ ▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓         │ │
│ │ ▓▓▓▓▓▓▓▓▓                       │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ │
│ │ ▓▓▓▓ ▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Search Loading**:
```
┌─────────────────────────────────────┐
│ Cancel          Search              │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔍 meeting               🔄     │ │  <- Spinner in search
│ └─────────────────────────────────┘ │
│                                     │
│ Searching...                        │
│                                     │
│        ⟳ Loading results           │  <- Loading indicator
│                                     │
└─────────────────────────────────────┘
```

**Progressive Image Loading**:
```
┌─────────────────────────────────────┐
│ ◀ All iCloud          📤      ⋯    │
├─────────────────────────────────────┤
│                                     │
│ Meeting Notes with Photos           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ░░░░░░░ Loading image ░░░░░░░   │ │  <- Placeholder
│ │        ⟳                        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Meeting agenda and action items...  │
└─────────────────────────────────────┘
```

## Accessibility Specifications

### Touch Target Requirements
- **Minimum Size**: 44pt × 44pt (iOS standard)
- **Recommended Size**: 48pt × 48pt
- **Spacing**: Minimum 8pt between targets

### Text Scaling Support
- Support Dynamic Type sizing
- Maintain layout integrity up to 200% scale
- Use relative units (rem, em) where possible

### Screen Reader Support
- Semantic HTML elements
- ARIA labels for custom controls
- Logical focus order
- Meaningful alt text for images

### High Contrast Support
- Ensure 4.5:1 contrast ratio minimum
- Support system high contrast modes
- Use color + iconography for status

## Responsive Behavior

### Breakpoint Specifications

#### Mobile Portrait (320-428px)
- Single column layout
- Full-width components
- Bottom tab navigation
- Collapsible sections

#### Mobile Landscape (568-926px)
- Maintain mobile patterns
- Adjust typography scaling
- Horizontal scrolling where needed

#### Tablet Portrait (744-834px)
- Centered content (max-width: 768px)
- Increased padding/margins
- Optional sidebar navigation

#### Tablet Landscape (1024-1194px)
- Two-column layout options
- Persistent sidebar navigation
- Increased touch targets

## Component Library Standards

### Button Specifications

#### Primary Button
```css
background: var(--kelly-green);
color: white;
border-radius: 8px;
padding: 12px 24px;
font-size: 17px;
font-weight: 600;
```

#### Secondary Button
```css
background: transparent;
color: var(--kelly-green);
border: 1px solid var(--kelly-green);
border-radius: 8px;
padding: 12px 24px;
```

### Card Specifications
```css
background: var(--bg-grouped);
border-radius: 12px;
border: 1px solid var(--border-secondary);
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
padding: 16px;
```

## Implementation Guidelines

### CSS Architecture
- Use CSS custom properties for theming
- Mobile-first responsive design
- BEM naming convention for consistency
- Component-based stylesheet organization

### Performance Standards
- Time to Interactive: < 3 seconds
- First Contentful Paint: < 1.5 seconds
- Layout Stability (CLS): < 0.1
- Touch response time: < 100ms

### Browser Support
- iOS Safari 14+
- Chrome Mobile 90+
- Samsung Internet 14+
- Firefox Mobile 90+

## Quality Checklist

### Visual Quality
- [ ] Typography scales properly across devices
- [ ] Colors match brand palette exactly
- [ ] Icons are consistent in style and size
- [ ] Spacing follows 8pt grid system
- [ ] Animations feel natural and purposeful

### Functional Quality
- [ ] All touch targets meet minimum size requirements
- [ ] Navigation patterns are consistent throughout
- [ ] Loading states provide appropriate feedback
- [ ] Error states are clear and actionable
- [ ] Keyboard navigation works seamlessly

### Accessibility Quality
- [ ] Screen readers can navigate all content
- [ ] Color is not the only way to convey information
- [ ] Focus indicators are clearly visible
- [ ] Text contrast meets WCAG AA standards
- [ ] Dynamic Type scaling works properly

### 9. Error States & Recovery Workflows

#### Network Connection Error
**Keyframe 18: Offline State**
```
┌─────────────────────────────────────┐
│ ◀ Folders              📶❌         │  <- No connection indicator
├─────────────────────────────────────┤
│                                     │
│ All iCloud                          │
│                                     │
│        📱 You're Offline           │  <- Friendly error message
│                                     │
│ Your notes are saved locally and    │
│ will sync when you're back online.  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📝 Project Ideas (Local)        │ │  <- Local notes still accessible
│ │ ⏰ 2 min ago (Not synced)       │ │
│ └─────────────────────────────────┘ │
│                                     │
│         [Try Again]                 │  <- Recovery action
└─────────────────────────────────────┘
```

#### Empty States
**Keyframe 19: Empty Folder**
```
┌─────────────────────────────────────┐
│ ◀ Folders              ⋯      📤    │
├─────────────────────────────────────┤
│                                     │
│ Work Projects                       │
│                                     │
│                                     │
│         📝                          │  <- Large icon
│                                     │
│    No notes in this folder          │  <- Clear message
│                                     │
│  Tap the ✏️ button to create       │  <- Helpful instruction
│      your first note                │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ 0 Notes                        ✏️  │  <- Emphasizes action
└─────────────────────────────────────┘
```

### 10. Multi-State Component Behaviors

#### Note Item States Timeline
```
Default → Pressed → Loading → Loaded
   ↓         ↓         ↓        ↓
 [Rest]  [Highlight] [Spinner] [Content]
   ↓
Long Press → Context Menu → Action → Update
```

#### Search Input States
```
Empty → Active → Typing → Results → Clear
  ↓       ↓        ↓        ↓       ↓
[Icon] [Focus]  [Query]  [List]  [Empty]
```

### 11. State Persistence Rules

#### Navigation State
- Back button always shows previous screen name
- Deep links maintain proper breadcrumb trail
- Tab selection persists across app lifecycle

#### Edit State
- Auto-save every 2 seconds during editing
- Preserve cursor position on app backgrounding
- Draft recovery on app crash

#### Search State
- Remember recent searches (max 10)
- Preserve search results when backgrounded
- Clear search on tab switch

#### Visual State Indicators
```
🔄 - Syncing
📶❌ - No connection
✏️ - Editable/Create action
📤 - Share available
⋯ - More actions
▓▓▓ - Loading placeholder
```

## Maintenance Guidelines

### Regular Reviews
- Quarterly design system audit
- User feedback integration
- Performance monitoring
- Accessibility testing
- Workflow validation testing

### Version Control
- Document all design changes
- Maintain component changelog
- Test design changes across devices
- Update design tokens when modified
- Version control UI flow wireframes

### Testing Workflows
- Test each keyframe transition
- Validate state persistence
- Verify error state recovery
- Check accessibility at each step
- Performance test transition animations

---

*This specification serves as the authoritative guide for implementing Apple Notes-inspired interface patterns and workflow processes in the MekkaNote application. All development should reference this document to ensure consistency, quality, and proper user experience flows.*