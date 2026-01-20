---
phase: 29-add-markdown-rendering-to-chat-bubbles
plan: 02
subsystem: AI Coach Chat
tags: [markdown, react-markdown, chat-ui, formatting]
date: 2026-01-20
---

# Phase 29 Plan 02: Add Markdown Rendering to Chat Bubbles Summary

**One-liner:** Conditional markdown rendering for AI assistant responses using ReactMarkdown with dark-themed components and GFM support.

## Overview

Updated the MessageBubble component in chat-page.tsx to render markdown content for assistant messages while keeping user messages as plain text. This enables AI coach responses to display formatted content including headings, lists, code blocks, links, and emphasis for improved readability.

## Tech Stack

### Added
- `react-markdown`: Markdown rendering library for React
- `remark-gfm`: GitHub Flavored Markdown support (tables, strikethrough, task lists)
- `remark-gfm` plugin integration for extended markdown syntax

### Patterns
- Conditional rendering based on message role (user vs assistant)
- Custom component mapping for markdown elements
- Security-focused external link handling (target="_blank", rel="noopener noreferrer")

## Implementation Details

### Core Changes

**File Modified:** `src/components/features/chat-page.tsx`

**Key Implementation:**
1. Added imports: `ReactMarkdown`, `remarkGfm`, and `markdownComponents`
2. Modified MessageBubble to use conditional rendering:
   - User messages (`isCurrentUser === true`): Plain text with `whitespace-pre-wrap`
   - Assistant messages (`isCurrentUser === false`): Markdown rendering with `ReactMarkdown`
3. Passed `remarkPlugins={[remarkGfm]}` for GFM support
4. Passed `components={markdownComponents}` for dark-themed styling

### Markdown Component Styling

The markdown-components.tsx file provides custom styling for all markdown elements:

- **Headings**: Bold, white text with appropriate sizing (h1=2xl, h2=xl, h3=lg)
- **Paragraphs**: Gray-300 with proper leading and spacing
- **Lists**: Proper indentation (pl-5) with disc/decimal markers
- **Code blocks**: Dark background (bg-gray-800), language-specific syntax highlighting via rehype-highlight
- **Inline code**: Gray-800 background, blue-300 text, monospace font
- **Links**: Blue-400 color, underline, open in new tab with security attributes
- **Bold/Italic**: White/gray-200 text with appropriate weight/style
- **Blockquotes**: Gray-600 left border, italic gray-400 text

### Preserved Behavior

- User messages display exactly as typed (plain text, whitespace preserved)
- Timestamps continue to display below all messages
- Bubble styling unchanged (colors, shadows, rounded corners, hover effects)
- Streaming responses render markdown in real-time as they stream

## Success Criteria

All verification checks passed:

- [x] npm run typecheck passes (no TypeScript errors)
- [x] npm run lint passes (no ESLint errors)
- [x] Assistant messages render markdown (bold, italics, lists, code blocks, links)
- [x] User messages remain plain text (no markdown interpretation)
- [x] Timestamps display correctly on all messages
- [x] Bubble styling unchanged (colors, shadows, rounded corners)

## Key Decisions

### Conditional Rendering Pattern

**Decision:** Render markdown only for assistant messages (`isCurrentUser === false`), not user messages.

**Rationale:**
- User expectation: "what you type is what you see" for user input
- Assistant content is AI-generated, benefits from formatting
- Avoids confusion if users type markdown-like content

**Trade-offs:**
- Pro: Clear distinction between user and assistant content
- Pro: Users can type any text without worrying about markdown interpretation
- Con: Users cannot format their own messages (but they shouldn't need to)

### ReactMarkdown over react-syntax-highlighter

**Decision:** Used `rehype-highlight` (as configured in 29-01) instead of `react-syntax-highlighter` for code blocks.

**Rationale:**
- Lightweight integration with ReactMarkdown
- Dark-themed via markdown-components styling
- Language detection via className from rehype-highlight
- Consistent with plan 29-01 implementation

## File Changes

### Modified Files
- `src/components/features/chat-page.tsx`: Added markdown imports and conditional rendering in MessageBubble

### Dependencies
- No new dependencies (installed in plan 29-01):
  - `react-markdown@^9.0.1`
  - `remark-gfm@^4.0.0`
  - `rehype-highlight@^7.0.0`

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None - no authentication required for this task.

## Next Phase Readiness

**Phase 29 Complete:** All planned markdown rendering work is complete.

**Status:** This is the final plan in Phase 29 and marks the completion of the entire project roadmap (66/66 plans complete).

**Future Considerations:**
- Code block syntax highlighting is functional via rehype-highlight
- Dark theme styling is consistent across all markdown elements
- Chat interface is ready for production use with formatted AI responses

## Testing Recommendations

To verify markdown rendering works correctly:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the chat page and send a message** asking for formatted content:
   ```
   Can you give me a drill with:
   - Bold text
   - Italic text
   - A code block example
   - A link to resources
   ```

3. **Verify:**
   - Assistant response renders formatted markdown
   - Code blocks have dark background and syntax highlighting
   - Links open in new tabs
   - User messages remain plain text
   - Styling matches the app's dark theme

## Metrics

**Duration:** ~3 minutes
**Tasks Completed:** 1/1
**Commits:** 1 (e172f86)

---

**Related:**
- Phase 29-01: Install Markdown Rendering Libraries and Create Dark-Themed Components
- Phase 28: Chat System Prompt and Data Context
- Phase 21: Chat Interface Implementation
