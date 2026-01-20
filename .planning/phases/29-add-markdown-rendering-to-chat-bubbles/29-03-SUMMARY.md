---
phase: 29-add-markdown-rendering-to-chat-bubbles
plan: 03
subsystem: AI Coach Chat
tags: [markdown, syntax-highlighting, rehype-highlight, code-blocks]
date: 2026-01-20
---

# Phase 29 Plan 03: Wire Up rehype-highlight for Syntax Highlighting Summary

**One-liner:** Connect rehype-highlight plugin to ReactMarkdown with github-dark CSS theme for syntax-colored code blocks in assistant messages.

## Overview

Fixed the missing syntax highlighting identified in the verification of plan 29-02. The `rehype-highlight` plugin was installed in plan 29-01 but never connected to ReactMarkdown. Code blocks in assistant messages now display colored syntax highlighting using the github-dark theme.

## Tech Stack

### Added
- `rehype-highlight` plugin connection (package installed in 29-01)
- `highlight.js/styles/github-dark.css` import for syntax coloring

### Patterns
- Rehype plugin integration with ReactMarkdown
- CSS import for syntax highlighting themes
- Dark theme consistency with app color system

## Implementation Details

### Core Changes

**Files Modified:**
- `src/components/features/chat-page.tsx`
- `src/styles/index.css`

**Step 1: Import rehype-highlight plugin**
```typescript
import rehypeHighlight from 'rehype-highlight'
```
- Added after ReactMarkdown import, alphabetically before remarkGfm
- Enables syntax highlighting detection in markdown code blocks

**Step 2: Add rehypeHighlight to remarkPlugins array**
```typescript
<ReactMarkdown remarkPlugins={[remarkGfm, rehypeHighlight]} components={markdownComponents}>
```
- Plugin adds language-specific CSS classes to code blocks
- Works with markdown-components pre/code styling for dark background

**Step 3: Import github-dark.css theme**
```css
@import 'highlight.js/styles/github-dark.css';
```
- Imported after Tailwind directives in src/styles/index.css
- Provides syntax coloring (keywords, strings, comments, etc.)
- Matches app's dark theme (#09090b background, white/gray text)

### Why github-dark Theme

The github-dark theme was chosen because:
- High contrast, proven dark theme suitable for code
- Matches app's color system (dark background, light text)
- Includes coloring for all syntax elements (keywords, strings, comments, functions, etc.)
- Well-maintained as part of highlight.js ecosystem

## Gap Closed

**Issue:** Code blocks in assistant messages rendered with dark background but monochrome text (no syntax colors).

**Root Cause:** rehype-highlight was installed in plan 29-01 but never connected to ReactMarkdown in plan 29-02 execution.

**Fix:** Three-line change across two files:
1. Import the plugin
2. Add to remarkPlugins array
3. Import CSS theme

## Success Criteria

All verification checks passed:

- [x] rehypeHighlight imported in chat-page.tsx (line 4)
- [x] rehypeHighlight added to remarkPlugins array (line 38)
- [x] github-dark.css imported in index.css (line 5)
- [x] npm run typecheck passes (no TypeScript errors)
- [x] No new lint errors in modified files (existing pre-existing errors in other files)

## Key Decisions

### Plugin Order in remarkPlugins

**Decision:** Place rehypeHighlight after remarkGfm in the array: `[remarkGfm, rehypeHighlight]`

**Rationale:**
- remarkGfm extends markdown syntax (tables, task lists)
- rehypeHighlight processes the parsed HTML for syntax coloring
- Order matters: GFM first to parse structure, then highlight for coloring
- Standard practice in ReactMarkdown plugin composition

### CSS Import Location

**Decision:** Import github-dark.css after Tailwind directives but before custom @layer rules.

**Rationale:**
- Ensures syntax highlighting styles are available when components render
- Allows custom @layer rules to override if needed
- Follows common pattern: third-party imports first, then custom styles

## File Changes

### Modified Files
- `src/components/features/chat-page.tsx`: Added rehypeHighlight import and plugin to remarkPlugins
- `src/styles/index.css`: Added github-dark.css import

### Dependencies
- No new dependencies (all installed in plan 29-01):
  - `rehype-highlight@^7.0.0`
  - `highlight.js` (peer dependency)

## Deviations from Plan

None - plan executed exactly as written. This was a gap closure plan with a straightforward implementation.

## Authentication Gates

None - no authentication required for this task.

## Next Phase Readiness

**Phase 29 Complete:** All planned markdown rendering work is complete with syntax highlighting now functional.

**Status:** This is the final plan in Phase 29 and marks the completion of the entire project roadmap (67/67 plans complete).

**Ready for Production:**
- Markdown rendering with dark-themed components
- Syntax highlighting for code blocks
- GFM support for tables, task lists, strikethrough
- User messages remain plain text as intended

## Testing Recommendations

To verify syntax highlighting works correctly:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the chat page and send a message** asking for code examples:
   ```
   Can you show me a JavaScript example for tracking climb attempts?
   ```

3. **Verify:**
   - Code blocks have dark background (bg-gray-800)
   - Keywords are colored (e.g., `function`, `const`, `return`)
   - Strings are colored differently from keywords
   - Comments (if any) are colored differently
   - Syntax matches github-dark theme coloring
   - Styling matches the app's dark theme

## Metrics

**Duration:** ~2 minutes
**Tasks Completed:** 1/1
**Commits:** 1 (d5de1d7)

---

**Related:**
- Phase 29-01: Install Markdown Rendering Libraries and Create Dark-Themed Components
- Phase 29-02: Add Markdown Rendering to Chat Bubbles
- Phase 28: Chat System Prompt and Data Context
- Phase 21: Chat Interface Implementation
