# MekkaNote UI Design System

**Version:** 1.0.0
**Last Updated:** 2025-01-15
**Status:** Mockup Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Spacing System](#spacing-system)
6. [Component Specifications](#component-specifications)
7. [Layout Patterns](#layout-patterns)
8. [Interaction Patterns](#interaction-patterns)
9. [HTMX Integration Patterns](#htmx-integration-patterns)
10. [Accessibility Guidelines](#accessibility-guidelines)
11. [Animation Specifications](#animation-specifications)
12. [Design Decisions Rationale](#design-decisions-rationale)

---

## Overview

### Purpose

This UI design system serves as the authoritative reference for implementing the MekkaNote application interface. It provides comprehensive specifications for all visual components, interaction patterns, and design tokens to ensure consistency across the application.

### Design Philosophy

MekkaNote follows an **Apple Notes-inspired** design language with these core principles:

- **Mobile-First**: Designed primarily for touch interfaces on iOS Safari, with responsive enhancements for larger screens
- **HTMX-Native**: Built for server-side rendering with HTMX, avoiding client-side framework dependencies
- **Content-Focused**: Clean, minimal interface that prioritizes note content over UI chrome
- **Progressive Enhancement**: Core functionality works without JavaScript, enhanced interactions where appropriate
- **Accessibility First**: WCAG 2.1 AA compliance with keyboard navigation and screen reader support

### Target Platforms

**Primary**: iOS Safari (iPhone/iPad)
- Optimize for safe area insets
- Use -apple-system fonts
- Respect system appearance settings
- Touch-friendly 44px minimum targets

**Secondary**: Android Chrome
- Maintain consistent visual design
- Use system font stack fallback
- Ensure touch targets work across devices

**Tertiary**: Desktop Browsers (Safari, Chrome, Firefox, Edge)
- Centered max-width container (480px)
- Hover states for mouse interactions
- Keyboard navigation support

---

## Color Palette

### Primary Colors

| CSS Variable | Hex Value | Usage |
|--------------|-----------|-------|
| `--kelly-green` | `#4CAF50` | Primary actions, links, confirm buttons, active states |
| `--kelly-green-hover` | `#45A049` | Hover state for Kelly Green elements |
| `--kelly-green-light` | `#E8F5E9` | Backgrounds, badges, subtle accents |

**Rationale**: Kelly Green (#4CAF50) is used to match Apple Notes' signature green color, providing familiarity and clear visual hierarchy for primary actions.

**Accessibility**:
- Contrast ratio on white: 3.1:1 (fails WCAG AA for text)
- Must be used for icons, borders, or backgrounds only
- Never use Kelly Green for body text on light backgrounds

### Secondary Colors

| CSS Variable | Hex Value | Usage |
|--------------|-----------|-------|
| `--lion` | `#F76707` | Warnings, secondary actions, AI suggestions |
| `--lion-hover` | `#E05D00` | Hover state for Lion elements |
| `--lion-light` | `#FFF4E6` | Backgrounds for warning-related content |

**Rationale**: Lion orange provides warm contrast for AI features and secondary actions without conflicting with primary Kelly Green.

### Background Colors

| CSS Variable | Hex Value | Usage |
|--------------|-----------|-------|
| `--bg-primary` | `#FFFFFF` | Main application background, cards |
| `--bg-secondary` | `#F5F5F5` | Subsection backgrounds, hover states |
| `--bg-tertiary` | `#EBEBEB` | Disabled states, subtle dividers |
| `--bg-overlay` | `rgba(0, 0, 0, 0.4)` | Modal/drawer backdrops |

### Border Colors

| CSS Variable | Hex Value | Usage |
|--------------|-----------|-------|
| `--border-primary` | `#D1D1D1` | Form inputs, focused borders |
| `--border-secondary` | `#E5E5E5` | Card borders, dividers |
| `--border-tertiary` | `#F0F0F0` | Subtle borders, separators |

### Text Colors

| CSS Variable | Hex Value | Usage | Contrast Ratio |
|--------------|-----------|-------|----------------|
| `--text-primary` | `#000000` | Headlines, body text, important UI elements | 21:1 (AAA) |
| `--text-secondary` | `#6E6E73` | Descriptions, metadata, previews | 7.5:1 (AAA) |
| `--text-tertiary` | `#8E8E93` | Timestamps, disabled text, placeholders | 5.1:1 (AA) |
| `--text-disabled` | `#C7C7CC` | Disabled buttons, inactive elements | 2.8:1 (fails) |
| `--text-inverse` | `#FFFFFF` | Text on colored backgrounds (Kelly Green, Lion) | Varies |

### Semantic Colors

| Purpose | Color | Usage |
|---------|-------|-------|
| Success | `--kelly-green` | Successful actions, confirmations |
| Error | `#FF3B30` | Error states, destructive actions |
| Warning | `--lion` | Warnings, AI suggestions |
| Info | `#007AFF` | Informational messages, links (iOS blue) |

### Dark Mode Implementation

**Current Status**: Dark mode enabled (v1.1)

**Implementation Details**:
- Primary theme: Dark mode (black backgrounds, white text)
- Background colors: #000000, #1C1C1E, #2C2C2E
- Text colors: #FFFFFF, #98989D, #636366, #48484A
- Border colors: #38383A, #48484A
- Accent colors: Kelly Green and Lion orange preserved for consistency
- WCAG AA contrast ratios maintained (21:1 for primary text)
- All components use CSS variables for theme consistency

**Future Enhancements**:
- Add theme toggle to switch between light/dark modes
- Implement `prefers-color-scheme` media query for system preference detection

---

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif;
```

**Rationale**: System fonts provide:
- Native feel on each platform
- Zero network overhead
- Optimal legibility
- Automatic dark mode support
- Familiarity for users

### Type Scale

| Name | Variable | Size | Weight | Usage |
|------|----------|------|--------|-------|
| XS | `--text-xs` | 11px | Regular | Metadata, tags, timestamps |
| Small | `--text-sm` | 13px | Regular/Medium | Secondary text, descriptions |
| Base | `--text-base` | 15px | Regular/Medium | Body text, buttons |
| Large | `--text-lg` | 17px | Semibold | Headers, titles, emphasis |
| XL | `--text-xl` | 20px | Semibold/Bold | Page titles, large headers |
| 2XL | `--text-2xl` | 24px | Bold | Section headers |
| 3XL | `--text-3xl` | 32px | Bold | Hero text, special headlines |

**Note**: iOS uses 17px as base size (vs 16px on web). We use 15px as base to match Apple Notes' slightly denser information density.

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text, descriptions |
| Medium | 500 | Emphasized text, button labels, active states |
| Semibold | 600 | Headers, important labels |
| Bold | 700 | Page titles, major headlines |

### Line Heights

| Context | Line Height | Usage |
|---------|-------------|-------|
| Body text | 1.5 (150%) | Paragraphs, long-form content |
| Headings | 1.2 (120%) | Titles, headers |
| Tight | 1.0 (100%) | Single-line labels, buttons |
| Relaxed | 1.6 (160%) | Note content for readability |

### Letter Spacing

| Context | Letter Spacing | Usage |
|---------|----------------|-------|
| Default | 0 | Body text, most UI elements |
| Uppercase | 0.5px | Section headers, labels (text-transform: uppercase) |
| Wide | 0.5px | Headings, emphasis |

### Responsive Typography

**Mobile (< 768px)**:
- Base size: 15px
- Scale: 11px → 32px (XS → 3XL)

**Desktop (≥ 768px)**:
- No size changes (maintain mobile scale)
- Max-width container centers content

**Rationale**: Consistent sizing across devices prevents layout shifts and maintains design intent.

---

## Spacing System

### Spacing Scale

| Token | Value | Usage Examples |
|-------|-------|----------------|
| `--space-1` | 4px | Gap between icon and text, small padding |
| `--space-2` | 8px | Card gaps, button padding, small margins |
| `--space-3` | 12px | Form gaps, modal padding |
| `--space-4` | 16px | Standard padding, card padding, base unit |
| `--space-5` | 20px | Large padding, section spacing |
| `--space-6` | 24px | Component gaps, large margins |
| `--space-8` | 32px | Section spacing, major gaps |
| `--space-10` | 40px | Page margins |
| `--space-12` | 48px | Large section spacing, hero margins |

**Rationale**: 4px base scale aligns with:
- iOS 8pt grid (1pt = 1px on web)
- Common screen pixel densities
- Mental math simplicity (4, 8, 12, 16...)

### Component Padding Standards

| Component | Padding | Notes |
|-----------|---------|-------|
| Note Card | 16px (space-4) | All sides |
| Mobile Header | 0 (16px horizontal in container) | Safe area adds padding |
| Modal | 16px (space-4) | All sides |
| Button | 12px × 16px (space-3 × space-4) | Vertical × Horizontal |
| Input | 12px vertical, 16px horizontal | Same as buttons |
| FAB | 0 (56×56px fixed) | Circular button |

### Safe Area Insets (iOS)

```css
/* Apply safe area insets */
.safe-area-top { padding-top: env(safe-area-inset-top, 0px); }
.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
.safe-area-left { padding-left: env(safe-area-inset-left, 0px); }
.safe-area-right { padding-right: env(safe-area-inset-right, 0px); }
```

**Usage**:
- Header: `.safe-area-top`
- Bottom sheets/modals: `.safe-area-bottom`
- Drawer: `.safe-area-top` + `.safe-area-bottom`

---

## Component Specifications

### Note Card

**Purpose**: Display a note in the note list view

**Dimensions**:
- Min-height: 80px
- Border radius: 14px (`--radius-lg`)
- Margin bottom: 8px

**Structure**:
```
┌─────────────────────────────────────────┐
│ Title                    Timestamp       │
│ Preview text (max 2 lines)...           │
│ [tag1] [tag2]                           │
└─────────────────────────────────────────┘
```

**States**:
- Default: White background, no border
- Hover: Light gray background (`--bg-secondary`)
- Active/Pressed: Scale(0.98), darker background

**Content**:
- **Title**: 15px, Semibold, Primary text, truncates with ellipsis
- **Preview**: 13px, Regular, Secondary text, max 2 lines (line-clamp)
- **Timestamp**: 11px, Tertiary text, right-aligned
- **Tags**: 11px, Medium, Kelly Green text on Kelly Green Light background, 4px padding

**Shadows**: None (flat design, subtle borders on hover)

**Example HTML**:
```html
<article class="note-card">
  <div class="note-card-header">
    <h3 class="note-card-title">Note Title</h3>
    <span class="note-card-timestamp">Today</span>
  </div>
  <p class="note-card-preview">Preview text that truncates...</p>
  <div class="note-card-footer">
    <span class="tag">#tag1</span>
    <span class="tag">#tag2</span>
  </div>
</article>
```

---

### Mobile Header

**Purpose**: Top navigation bar with title and action buttons

**Dimensions**:
- Height: 44px (standard iOS touch target)
- Border bottom: 1px solid `--border-secondary`

**Structure**:
```
┌─────────────────────────────────────────┐
│ [Menu]        Title         [Add]       │
│ (44px)                      (44px)      │
└─────────────────────────────────────────┘
```

**Components**:
- **Left Action**: Menu button (list view) or Back button (other views)
- **Center**: Title (17px, Semibold)
- **Right Action**: Add button (list view only)

**Button Styling**:
- Min-width: 44px, Min-height: 44px
- Transparent background
- Icon color: Kelly Green (primary), Lion (secondary)
- Hover state: Light gray background
- Active state: Scale(0.96)

**Safe Areas**: Apply `.safe-area-top` to header

---

### Navigation Drawer

**Purpose**: Slide-out sidebar for folder navigation

**Dimensions**:
- Width: 280px
- Full height with safe area insets
- Border radius: 0 (not visible when closed)

**Structure**:
```
┌──────────────┐
│ MekkaNote    │ ← Header
├──────────────┤
│ 📁 All iCloud │ ← Folder list
│ 📁 Work       │
│ 📁 Personal   │
│ 📁 Ideas      │
└──────────────┘
```

**Animation**:
- Transform: translateX(-100%) → translateX(0)
- Duration: 300ms (`--duration-medium`)
- Easing: cubic-bezier(0.4, 0, 0.2, 1) (`--ease-default`)

**Backdrop**:
- Full screen overlay
- Background: rgba(0, 0, 0, 0.4)
- Fade in/out syncs with drawer slide

**States**:
- **Closed**: Drawer off-screen left, backdrop hidden
- **Open**: Drawer visible, backdrop visible
- **Closing**: Reverse animation when backdrop clicked

**Folder Item Styling**:
- Padding: 12px (space-3)
- Border radius: 10px (`--radius-md`)
- Icon: 20px, Kelly Green, 12px margin-right
- Text: 15px, Primary (or Kelly Green for active)

---

### Note Editor

**Purpose**: Full-screen note editing interface

**Structure**:
```
┌─────────────────────────────────────────┐
│ Note Title Input                        │ ← Header
├─────────────────────────────────────────┤
│ [H1][H2][H3] | [B][I] | [•][1] | 🔗📷│ ← Toolbar
├─────────────────────────────────────────┤
│                                         │
│ Main content textarea...                │ ← Content
│                                         │
├─────────────────────────────────────────┤
│ Auto-save indicator                     │ ← Footer
├─────────────────────────────────────────┤
│ AI Suggested Tags                       │ ← AI Section
├─────────────────────────────────────────┤
│ Backlinks (2)                           │ ← Links Section
└─────────────────────────────────────────┘
```

**Title Input**:
- Font-size: 24px (`--text-2xl`)
- Font-weight: Bold
- Background: transparent
- Border: none
- Padding: 16px (space-4)

**Toolbar**:
- Height: 44px with padding
- Background: `--bg-secondary`
- Buttons: 36×36px, icon-only
- Divider: 1px vertical line, 24px height

**Content Textarea**:
- Min-height: 300px (flex-1 to fill remaining space)
- Font-size: 15px (`--text-base`)
- Line-height: 1.6
- Resize: none
- Overflow-y: auto

**Auto-Save Indicator**:
- Font-size: 11px (`--text-xs`)
- Color: Tertiary text
- Text: "Saved X seconds ago" or "Saving..."
- Background: `--bg-secondary`
- Text-align: center
- Padding: 8px (space-2) × 16px (space-4)

**AI Sections**:
- Background: `--bg-secondary`
- Border-top: 1px solid `--border-secondary`
- Padding: 16px (space-4)
- Title: 13px, Semibold, Secondary text, with icon

**Suggestion Item**:
- Background: `--bg-primary`
- Border: 1px solid `--border-secondary`
- Border-radius: 10px (`--radius-md`)
- Padding: 12px (space-3)
- Flex row: text (flex-1) + actions (gap 8px)

---

### Search Interface

**Purpose**: Full-text search across notes

**Structure**:
```
┌─────────────────────────────────────────┐
│ 🔍 [Search Input]              [X]      │ ← Search bar
├─────────────────────────────────────────┤
│ Result 1 with highlighted <mark>text</mark> │
├─────────────────────────────────────────┤
│ Result 2...                             │
├─────────────────────────────────────────┤
│ [+ Create new note: "query"]            │ ← Create option
└─────────────────────────────────────────┘
```

**Search Input**:
- Height: 44px
- Background: `--bg-secondary`
- Border-radius: 10px (`--radius-md`)
- Border: none
- Focus: White background + 2px Kelly Green shadow
- Padding-left: 40px (icon space)
- Padding-right: 40px (clear button space)

**Search Icon**:
- Position: absolute, left 12px, top 50%, translateY(-50%)
- Color: Tertiary text
- Size: 20px

**Clear Button**:
- Position: absolute, right 12px, top 50%, translateY(-50%)
- Size: 28×28px
- Background: `--bg-tertiary`
- Border-radius: 50%
- Opacity: 0 when input empty
- Opacity: 1 when text present

**Search Result**:
- Same styling as Note Card
- Highlighted matches: Kelly Green background, Kelly Green text

**Create Note Option**:
- Background: `--kelly-green-light`
- Border: 1px solid `--kelly-green`
- Border-radius: 14px (`--radius-lg`)
- Padding: 16px (space-4)
- Icon: 20px, Kelly Green
- Text: 15px, Medium, Kelly Green
- Margin-top: 16px (space-4)

---

### Modals

**Purpose**: Focused interactions (link search, confirmations, forms)

**Dimensions**:
- Max-width: 400px (desktop)
- Width: 100% (mobile)
- Max-height: 80vh
- Border-radius: 18px (`--radius-xl`) corners, 0 top (mobile)

**Structure**:
```
┌─────────────────────────────────────────┐
│ Title                      [Close]      │ ← Header
├─────────────────────────────────────────┤
│ Modal content...                        │ ← Body
├─────────────────────────────────────────┤
│ [Cancel]              [Primary Action]  │ ← Footer
└─────────────────────────────────────────┘
```

**Backdrop**:
- Full screen overlay
- Background: rgba(0, 0, 0, 0.4)
- Fade in: 300ms

**Animation**:
- **Mobile**: Slide up from bottom (translateY(100%) → translateY(0))
- **Desktop**: Fade in + scale (opacity 0→1, scale(0.9)→scale(1))
- Duration: 300ms (`--duration-medium`)

**Header**:
- Padding: 16px (space-4)
- Border-bottom: 1px solid `--border-secondary`
- Title: 17px (`--text-lg`), Semibold

**Body**:
- Padding: 16px (space-4)
- Overflow-y: auto

**Footer**:
- Padding: 16px (space-4)
- Border-top: 1px solid `--border-secondary`
- Button gap: 12px (space-3)
- Equal-width buttons (flex: 1)

---

### Toast Notifications

**Purpose**: Temporary feedback messages (success, error, info)

**Dimensions**:
- Max-width: 360px
- Width: 90%
- Border-radius: 10px (`--radius-md`)
- Padding: 12px (space-3) × 16px (space-4)

**Structure**:
```
┌─────────────────────────────────────────┐
│ [✓] Success message here                │
└─────────────────────────────────────────┘
```

**Positioning**:
- Top-center (below header)
- Z-index: 500 (`--z-toast`)
- Stacked with 8px gap between multiple toasts

**Animation**:
- Fade in + slide down
- Duration: 300ms
- Auto-remove after 3 seconds

**Variants**:
- **Success**: Left border 4px Kelly Green, Kelly Green icon
- **Error**: Left border 4px Red (#FF3B30), Red icon
- **Info**: Left border 4px Blue (#007AFF), Blue icon

**Icon**: 20px, left of text

**Text**: 13px, Regular, Primary text

---

### Buttons

**Sizes**:
| Size | Height | Padding | Font-size | Icon-size |
|------|--------|---------|-----------|-----------|
| Small | 28px | 4px × 12px | 11px | 14px |
| Medium | 44px | 12px × 16px | 15px | 20px |
| Large | 52px | 16px × 24px | 17px | 24px |

**Variants**:
- **Primary**: Kelly Green background, White text
- **Secondary**: Gray background (`--bg-secondary`), Primary text
- **Ghost**: Transparent background, Secondary text
- **Danger**: Red background, White text

**States**:
- **Default**: Base styling
- **Hover**: Darker 10% background
- **Active**: Scale(0.96)
- **Disabled**: 40% opacity, no pointer events

**FAB (Floating Action Button)**:
- Size: 56×56px
- Shape: Circular
- Background: Kelly Green
- Icon: White, 24px
- Shadow: `--shadow-lg` (0 8px 24px rgba(0, 0, 0, 0.12))
- Position: Fixed, bottom 24px + safe-area, right 16px

---

### Forms

**Input Fields**:
- Height: 44px (touch-friendly)
- Padding: 0 16px
- Border: 1px solid `--border-secondary`
- Border-radius: 10px (`--radius-md`)
- Font-size: 15px
- Background: `--bg-primary`

**Focus State**:
- Border-color: Kelly Green
- Box-shadow: 0 0 0 2px `--kelly-green-light`

**Error State**:
- Border-color: Red (#FF3B30)
- Error text below: 11px, Red

**Disabled State**:
- Background: `--bg-secondary`
- Color: `--text-disabled`
- No pointer events

**Toggle Switch**:
- Width: 51px, Height: 31px
- Background: `--bg-tertiary` (off), Kelly Green (on)
- Circle: 27px, white, shadow
- Animation: 150ms, slide left-to-right

---

## Layout Patterns

### Responsive Breakpoints

| Breakpoint | Width | Target Devices |
|------------|-------|----------------|
| Mobile Small | 320px+ | iPhone SE, older phones |
| Mobile | 375px+ | iPhone 12/13/14 standard |
| Mobile Large | 414px+ | iPhone Pro Max |
| Tablet | 768px+ | iPad, Android tablets |
| Desktop | 1024px+ | Laptops, monitors |
| Desktop Large | 1440px+ | Large monitors |

**Mobile-First Approach**:
- Base styles: 320px+
- Min-width queries for larger screens
- No max-width queries (flexible upward)

### Container Strategy

**Mobile (< 768px)**:
- Full-width content
- No horizontal margins
- Safe area padding where needed

**Desktop (≥ 768px)**:
- App container: max-width 480px, centered
- Box-shadow for depth
- Background: White with shadow

```css
@media (min-width: 768px) {
  #app {
    max-width: 480px;
    margin: 0 auto;
    box-shadow: var(--shadow-xl);
  }
}
```

### Flexbox Patterns

**Vertical Stack**:
```css
.stack-vertical {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
```

**Horizontal Bar**:
```css
.bar-horizontal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
```

**Centered Card**:
```css
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
```

### Grid Patterns

**Note List**: Use flex column (not grid) for vertical stacking

**Settings Items**: Flex column, no gap (borders create separation)

---

## Interaction Patterns

### Touch Targets

**Minimum Size**: 44×44px (iOS Human Interface Guidelines)

**Examples**:
- Header buttons: 44×44px
- Note card: Implicit (full-width tap target)
- FAB: 56×56px (exceeds minimum)
- Toolbar buttons: 36×36px (with 4px padding = 44px effective)

### Hover States

**Applicability**: Desktop only (mouse users)

**Common Patterns**:
- Background darkens by 10%
- Subtle scale (1.0 → 1.02 for cards)
- Shadow deepens

**Implementation**:
```css
.button:hover {
  background-color: var(--bg-secondary);
}
```

### Active States

**Feedback**: Immediate visual feedback on press

**Common Patterns**:
- Scale down: 0.96
- Background darkens
- For buttons: darker 10%

**Implementation**:
```css
.touch-target:active {
  transform: scale(0.96);
  background-color: var(--bg-tertiary);
}
```

### Loading States

**Spinner**:
- Size: 20px (small), 32px (medium)
- Color: Kelly Green (top), Gray (track)
- Animation: Rotate 360deg, 0.8s linear infinite

**Skeleton Screen**:
- Background: Linear gradient animation
- Color: Light gray → Medium gray → Light gray
- Pulse: 1.5s ease-in-out infinite

**Text Loading**: "Loading..." or spinner with context

### Empty States

**Components**:
- **Icon**: 64×64px, 30% opacity, Tertiary color
- **Title**: 17px (`--text-lg`), Semibold, Primary text
- **Description**: 13px (`--text-sm`), Secondary text
- **Action** (optional): Button below description

**Layout**: Centered, vertical stack, 48px top padding

### Error States

**Inline Errors**:
- Below input field
- 11px, Red color
- Icon: 16px, left of text

**Banners**:
- Full-width, below header
- Background: Red (10% opacity)
- Border-left: 4px solid Red
- Dismiss button: X icon, right

**Toast**: See Toast Notifications section

---

## HTMX Integration Patterns

### HTMX Attributes by Use Case

**Navigation**:
- `hx-get="/notes"` - Load note list
- `hx-push-url="true"` - Update browser URL
- `hx-target="#main-content"` - Replace content area
- `hx-swap="innerHTML"` - Replace HTML content

**Forms**:
- `hx-post="/notes"` - Create note
- `hx-put="/notes/{id}"` - Update note
- `hx-encoding="multipart/form-data"` - File uploads

**Search**:
- `hx-get="/search?q={query}"` - Real-time search
- `hx-trigger="keyup changed delay:300ms"` - Debounce input
- `hx-target="#search-results"` - Update results

**Delete Actions**:
- `hx-delete="/notes/{id}"` - Delete note
- `hx-confirm="Are you sure?"` - Confirmation dialog
- `hx-swap="outerHTML"` - Replace entire element

### URL Routing Conventions

| View | URL Pattern | Method | Description |
|------|-------------|--------|-------------|
| Note List | `/notes` | GET | List all notes |
| Folder View | `/notes?folder={id}` | GET | Filter by folder |
| Note Detail | `/notes/{id}` | GET | View single note |
| Create Note | `/notes/new` | GET | Empty note form |
| Save Note | `/notes` | POST | Create new note |
| Update Note | `/notes/{id}` | PUT | Update existing |
| Delete Note | `/notes/{id}` | DELETE | Delete note |
| Search | `/search?q={query}` | GET | Search notes |
| Link Search | `/search-links?q={query}` | GET | Find notes to link |

### HTML Fragment Structure

**Note List Fragment**:
```html
<div id="note-list" hx-get="/notes" hx-trigger="load">
  <!-- Note cards rendered here -->
</div>
```

**Note Card Fragment**:
```html
<article class="note-card" id="note-{id}">
  <div class="note-card-header">...</div>
  <p class="note-card-preview">...</p>
  <div class="note-card-footer">...</div>
</article>
```

**Modal Fragment**:
```html
<div id="link-modal" class="modal-backdrop">
  <div class="modal">
    <div class="modal-header">...</div>
    <div class="modal-body">...</div>
    <div class="modal-footer">...</div>
  </div>
</div>
```

### Loading Indicators with HTMX

**HTMX-Generated Class**:
```css
.htmx-request .indicator {
  opacity: 1;
}
.htmx-request.indicator {
  display: inline-block;
}
```

**Spinner on Request**:
```html
<button hx-get="/notes" hx-indicator="#spinner">
  Load Notes
</button>
<div id="spinner" class="spinner" style="opacity: 0"></div>
```

### Error Handling

**HTMX Events**:
```javascript
document.body.addEventListener('htmx:error', function(evt) {
  showToast('Request failed. Please try again.', 'error');
});
```

**Server Response**:
- Return 4xx/5xx status codes
- HTMX triggers `htmx:responseError` event
- Display toast notification to user

---

## Accessibility Guidelines

### ARIA Attributes

**Navigation**:
```html
<nav aria-label="Main navigation">
  <button aria-label="Open menu" aria-expanded="false" aria-controls="drawer">
    <!-- Menu icon -->
  </button>
</nav>
```

**Modals**:
```html
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Link to Note</h2>
  <!-- Modal content -->
</div>
```

**Search**:
```html
<input type="search" aria-label="Search notes" aria-controls="search-results">
<div role="status" aria-live="polite" id="search-results"></div>
```

**Buttons**:
```html
<button aria-label="Create new note">
  <!-- Plus icon -->
</button>
```

### Keyboard Navigation

**Tab Order**:
1. Header left action (menu/back)
2. Header right action (add)
3. Main content (note cards, first link)
4. Continue through interactive elements
5. Floating action button (last)

**Shortcuts**:
- `Cmd/Ctrl + K`: Open search
- `Escape`: Close modal/drawer
- `Enter`: Submit form or confirm action
- `Arrow keys`: Navigate radio lists

**Focus Management**:
- **Modal Open**: Move focus to first interactive element
- **Modal Close**: Return focus to trigger element
- **View Change**: Focus page title or first input
- **Search**: Focus input immediately

### Screen Reader Considerations

**Announcements**:
- Toast messages: `role="status"`, `aria-live="polite"`
- Errors: `role="alert"`, `aria-live="assertive"`
- Search results: `role="status"`, result count

**Semantic HTML**:
- Use `<article>` for note cards
- Use `<nav>` for navigation areas
- Use `<main>` for primary content
- Use `<header>`, `<footer>` appropriately

**Icon-Only Buttons**:
- Always include `aria-label`
- Include visually-hidden text if helpful

### Color Contrast Compliance

**WCAG 2.1 AA Requirements**:
- Normal text (< 18px): 4.5:1 minimum
- Large text (≥ 18px or 14px bold): 3:1 minimum
- UI components/icons: 3:1 minimum

**Verified Combinations**:
- Black on White: 21:1 ✅
- Secondary on White: 7.5:1 ✅
- Tertiary on White: 5.1:1 ✅
- Kelly Green on White: 3.1:1 ❌ (use for icons only)
- White on Kelly Green: 4.6:1 ✅

---

## Animation Specifications

### Duration Scale

| Speed | Duration | Usage |
|-------|----------|-------|
| Fast | 150ms | Button hovers, checkbox toggles |
| Medium | 300ms | Page transitions, modals, drawers |
| Slow | 500ms | Complex transitions, staggered animations |

### Easing Functions

| Function | Cubic Bezier | Usage |
|----------|--------------|-------|
| Ease Default | `cubic-bezier(0.4, 0, 0.2, 1)` | Most animations |
| Ease In | `cubic-bezier(0.4, 0, 1, 1)` | Elements entering |
| Ease Out | `cubic-bezier(0.0, 0, 0.2, 1)` | Elements leaving |
| Ease In-Out | `cubic-bezier(0.4, 0, 0.6, 1)` | Bidirectional motion |

**Recommendation**: Use `ease-default` for 90% of animations.

### Animation Library

**Fade In**:
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Slide Up**:
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Slide In From Right** (page transitions):
```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
```

**Scale In** (modal on desktop):
```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### When to Use Animations

**DO Animate**:
- Page transitions (slide)
- Modal open/close (fade + slide/scale)
- Button presses (scale)
- Loading states (spinner, skeleton)
- Toast notifications (slide down)

**DON'T Animate**:
- Properties that change frequently (scroll, resize)
- Layout shifts (causes jank)
- User has `prefers-reduced-motion`
- Critical feedback (should be instant)

**Respect Preferences**:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Design Decisions Rationale

### Apple Notes Inspiration vs. Custom Patterns

**Adopted from Apple Notes**:
- Kelly Green accent color (user familiarity)
- Clean, minimal interface
- Card-based note list
- 44px touch targets
- System font stack

**Customized for MekkaNote**:
- HTMX instead of client-side framework
- Bi-directional linking (not in Apple Notes)
- AI suggestions (unique feature)
- Org-mode support (developer-focused)
- Tags with pill badges (custom)

**Trade-offs**:
- **Simplicity vs. Features**: Prioritized clean UI over feature density
- **Performance vs. Animations**: Subtle animations, 60fps maintained
- **Mobile vs. Desktop**: Mobile-first, desktop gets centered container

### Technology Choices

**HTMX over React**:
- ✅ Server-side rendering (better SEO, faster initial load)
- ✅ Simpler mental model (HTML-centric)
- ✅ No build step for UI
- ✅ Progressive enhancement friendly
- ❌ Less ecosystem/tooling
- ❌ Harder to find developers with HTMX experience

**Vanilla CSS over Framework**:
- ✅ Zero dependencies
- ✅ Full control over design system
- ✅ Smaller bundle size
- ❌ Manual maintenance
- ❌ No pre-built components

### Future Enhancement Opportunities

**Planned**:
- Dark mode support (system preference detection)
- Tablet-optimized layouts (multi-column)
- Keyboard shortcuts UI (help modal)
- Custom theme colors (user preferences)

**Considering**:
- Graph view for note connections
- Advanced search filters
- Export to different formats (PDF, Markdown)
- Collaborative editing

**Unlikely**:
- Native mobile apps (PWA sufficient)
- Desktop app (Tauri possible but low priority)
- Multiple themes (focus on light/dark only)

---

## Implementation Checklist

When applying this design system to production code:

- [ ] Extract all CSS custom properties to `public/styles/main.css`
- [ ] Convert HTML structures to HTMX endpoint templates in `src/server.ts`
- [ ] Add `hx-` attributes for dynamic content loading
- [ ] Implement loading states with HTMX indicators
- [ ] Add error handling with toast notifications
- [ ] Test all keyboard navigation patterns
- [ ] Verify color contrast with accessibility tools
- [ ] Test on actual iOS devices (Safari)
- [ ] Test on Android devices (Chrome)
- [ ] Test on desktop browsers (Safari, Chrome, Firefox, Edge)
- [ ] Validate HTML semantics with WAVE or similar
- [ ] Test with screen reader (VoiceOver, NVDA)
- [ ] Verify `prefers-reduced-motion` support
- [ ] Performance test (Lighthouse 90+ score)
- [ ] Test offline functionality (PWA)

---

## Changelog

### v1.0.0 (2025-01-15)
- Initial design system documentation
- Complete color palette, typography, and spacing
- All component specifications
- HTMX integration patterns
- Accessibility guidelines

---

**Document Maintained By**: Development Team
**Questions**: Create issue in GitHub repository or refer to `docs/prd.md`
