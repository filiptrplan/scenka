# Phase 29: Add Markdown Rendering to Chat Bubbles - Research

**Researched:** 2026-01-20
**Domain:** React markdown rendering for chat UI
**Confidence:** HIGH

## Summary

This phase requires adding markdown rendering to the chat assistant responses. The standard approach is to use **react-markdown** (v10.1.0) with the **remark-gfm** plugin (v4.0.1) for GitHub Flavored Markdown support. This library is the industry standard for rendering markdown in React applications, offering secure by default behavior (no XSS, no `dangerouslySetInnerHTML`), excellent TypeScript support, and the ability to customize rendering with React components that can be styled with Tailwind CSS.

The current MessageBubble component renders plain text using `whitespace-pre-wrap`. We need to conditionally render markdown for assistant messages only, while keeping user messages as plain text. For streaming responses, react-markdown handles incremental updates well. Security is built-in - react-markdown escapes HTML by default and doesn't execute script tags.

**Primary recommendation:** Use react-markdown v10.1.0 + remark-gfm v4.0.1 with custom Tailwind-styled components for assistant messages only.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-markdown | 10.1.0 | Render markdown to React components | Industry standard, secure by default, excellent TypeScript support, maintained by unified ecosystem |
| remark-gfm | 4.0.1 | GitHub Flavored Markdown (tables, strikethrough, tasklists) | Official plugin, widely used, adds tables and tasklist support which LLMs often generate |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| rehype-highlight | 7.0.2 | Code syntax highlighting | If coach generates code blocks that need highlighting (adds ~37 language support) |
| @tailwindcss/typography | - | Pre-built prose styling | If you want GitHub-like styling without writing custom components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-markdown | markdown-to-jsx | Higher weekly downloads but fewer stars, less plugin ecosystem |
| react-markdown | marked | Requires `dangerouslySetInnerHTML`, less secure, no React component customization |

**Installation:**
```bash
pnpm add react-markdown remark-gfm rehype-highlight
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── features/
│       └── chat-page.tsx          # Update MessageBubble to use markdown
└── lib/
    └── markdown-components.ts    # Export styled markdown components
```

### Pattern 1: Custom Tailwind Components for Markdown
**What:** Pass custom React components to react-markdown to style each element with Tailwind classes
**When to use:** When you need complete control over styling and want to match your design system
**Example:**
```typescript
// Source: Contentful blog - How to render and edit Markdown in React with react-markdown
// https://www.contentful.com/blog/react-markdown/

const components = {
  h1: ({ children }) => <h1 className="text-3xl font-bold mb-4 text-gray-800">{children}</h1>,
  h2: ({ children }) => <h2 className="text-2xl font-semibold mb-3 text-gray-700">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xl font-semibold mb-2 text-gray-700">{children}</h3>,
  p: ({ children }) => <p className="mb-4 text-gray-600">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-4">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-4">{children}</ol>,
  li: ({ children }) => <li className="text-gray-600 mb-1">{children}</li>,
  code: ({ inline, children }) => inline
    ? <code className="bg-gray-100 px-1 rounded text-sm font-mono">{children}</code>
    : <code className="block bg-gray-800 text-gray-100 p-4 rounded text-sm font-mono">{children}</code>,
  a: ({ href, children }) => <a href={href} className="text-blue-500 hover:underline">{children}</a>,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
}
```

### Pattern 2: Conditional Rendering for Chat Bubbles
**What:** Only render markdown for assistant messages, keep user messages as plain text
**When to use:** In chat applications where user input is plain text but assistant responses contain formatted content
**Example:**
```typescript
function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${isCurrentUser
          ? 'bg-blue-600 text-white rounded-br-sm'
          : 'bg-gray-700 text-gray-100 rounded-bl-sm'
        }`}
      >
        {/* Only render markdown for assistant messages */}
        {isCurrentUser ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
```

### Pattern 3: Streaming Content Handling
**What:** React-markdown naturally handles streaming updates as new tokens arrive
**When to use:** When content is being streamed from an LLM (like in this chat application)
**Implementation:** The streamingResponse string is updated incrementally, and react-markdown will re-render efficiently on each update. No special handling needed - just pass the string as a child.

### Anti-Patterns to Avoid
- **Rendering markdown for user messages:** Users expect their input to appear exactly as typed, not interpreted as markdown. Only render markdown for assistant messages.
- **Using `dangerouslySetInnerHTML`:** This bypasses react-markdown's security features. Always use the library's component-based rendering.
- **Hand-rolling markdown parsing:** React-markdown handles edge cases, security, and performance. Don't write your own parser.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown to HTML parsing | Custom regex/string manipulation | react-markdown | XSS protection, handles edge cases (nested lists, blockquotes), standardized parsing |
| Markdown styling with CSS-in-JS | Hand-crafted styles for each element | react-markdown components prop | Type-safe, composable with existing components, follows React patterns |
| Streaming markdown renderer | Custom incremental parser | react-markdown with React state updates | React's reconciliation handles updates efficiently, no need for manual diffing |

**Key insight:** The unified ecosystem (remark + rehype) that react-markdown builds on has been optimized for years. Custom solutions will be slower, less secure, and harder to maintain.

## Common Pitfalls

### Pitfall 1: Rendering Markdown for User Messages
**What goes wrong:** Users type text that gets interpreted as markdown (e.g., `*text*` becomes italicized), breaking the "what you type is what you see" expectation
**Why it happens:** Applying markdown rendering to all messages, not just assistant responses
**How to avoid:** Only render markdown when `isCurrentUser` is false (assistant messages)
**Warning signs:** User's input looks different than what they typed, or user reports unexpected formatting

### Pitfall 2: Ignoring Dark Theme
**What goes wrong:** Markdown content has dark text colors hardcoded, making it unreadable on the app's dark background (#09090b)
**Why it happens:** Using light-mode default styling or copying examples without adjusting for dark theme
**How to avoid:** Use Tailwind's semantic color tokens (text-foreground, text-muted-foreground) or explicit dark text colors (text-gray-100, text-gray-300)
**Warning signs:** Content appears invisible or has poor contrast on dark background

### Pitfall 3: Performance with Large Responses
**What goes wrong:** Chat UI becomes sluggish when LLM generates very long markdown responses
**Why it happens:** react-markdown re-parses entire markdown on every token update during streaming
**How to avoid:** For most chat use cases, this isn't an issue (messages are typically < 1000 tokens). If it becomes a problem, consider debouncing updates or using React.memo on MessageBubble
**Warning signs:** UI freezes or becomes choppy during streaming of long messages

### Pitfall 4: Forgetting to Install remark-gfm
**What goes wrong:** LLM generates tables, tasklists, or strikethrough text that displays as raw markdown syntax instead of formatted
**Why it happens:** react-markdown only supports basic CommonMark by default
**How to avoid:** Install and use remark-gfm plugin with `remarkPlugins={[remarkGfm]}`
**Warning signs:** Content like `- [x] Task` displays as-is instead of a checked tasklist

## Code Examples

Verified patterns from official sources:

### Basic Markdown Rendering
```typescript
// Source: react-markdown GitHub - https://github.com/remarkjs/react-markdown
import ReactMarkdown from 'react-markdown'

function MarkdownContent({ content }: { content: string }) {
  return <ReactMarkdown>{content}</ReactMarkdown>
}
```

### With GitHub Flavored Markdown Support
```typescript
// Source: react-markdown GitHub - https://github.com/remarkjs/react-markdown
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function MarkdownContent({ content }: { content: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
}
```

### Dark Theme Styled Components
```typescript
// Source: Contentful blog - https://www.contentful.com/blog/react-markdown/
// Adapted for dark theme matching project's style

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold mb-3 text-white">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold mb-2 text-gray-100">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold mb-2 text-gray-200">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 text-gray-300 leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-3 text-gray-300 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-3 text-gray-300 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="mb-1">{children}</li>,
  code: ({ inline, children }: { inline?: boolean; children: React.ReactNode }) =>
    inline ? (
      <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-blue-300">
        {children}
      </code>
    ) : (
      <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto my-3">
        <code className="text-sm font-mono text-gray-200">{children}</code>
      </pre>
    ),
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-400 my-3">
      {children}
    </blockquote>
  ),
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  )
}
```

### Streaming Chat Integration
```typescript
// Source: Based on current chat-page.tsx implementation
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  if (isCurrentUser) {
    // User messages: plain text, no markdown
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-blue-600 text-white rounded-br-sm">
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    )
  }

  // Assistant messages: render markdown
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-gray-700 text-gray-100 rounded-bl-sm">
        <div className="text-sm leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `dangerouslySetInnerHTML` with marked | react-markdown with components | ~2020 (react-markdown v6+) | Security improvements (no XSS), better React integration, type safety |
| Basic CommonMark only | remark-gfm plugin for tables/tasklists | ~2021 | LLMs commonly generate tables and tasklists, need full GFM support |
| Manual styling | Tailwind component customization | ~2023 | Consistent with modern React + Tailwind stack, easier to maintain |

**Deprecated/outdated:**
- **marked with dangerouslySetInnerHTML:** Security risk, no React component integration
- **Custom markdown parsers:** Reinventing the wheel, missing edge cases, insecure
- **@mdx-js/mdx for simple rendering:** Overkill for just displaying markdown (MDX is for authoring interactive content with JSX)

## Open Questions

Things that couldn't be fully resolved:

1. **Code syntax highlighting necessity**
   - What we know: rehype-highlight is available and can be added easily
   - What's unclear: Will the LLM generate code blocks that require highlighting in this climbing coaching context?
   - Recommendation: Add rehype-highlight now (low cost, adds professional polish). Coach might provide climbing technique code snippets or training plans in code blocks.

2. **Link handling in markdown**
   - What we know: react-markdown renders `<a>` tags with `href` attributes
   - What's unclear: Should links open in new tab? Should we add security attributes (rel="noopener noreferrer")?
   - Recommendation: Add `target="_blank"` and `rel="noopener noreferrer"` to all links for security and UX. This is standard practice for external links in chat interfaces.

## Sources

### Primary (HIGH confidence)
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) - Usage, security features, remarkPlugins API
- [remark-gfm GitHub](https://github.com/remarkjs/remark-gfm) - GFM features (tables, tasklists, strikethrough)
- [Contentful Blog - React Markdown Guide](https://www.contentful.com/blog/react-markdown/) - Custom components with Tailwind styling

### Secondary (MEDIUM confidence)
- [Strapi Blog - React Markdown Security & Styling](https://strapi.io/blog/react-markdown-complete-guide-security-styling) - Security checklist, components prop usage
- [HackerOne Blog - Secure Markdown Rendering](https://www.hackerone.com/blog/secure-markdown-rendering-react-balancing-flexibility-and-safety) - Security considerations, XSS protection
- [rehype-highlight GitHub](https://github.com/rehypejs/rehype-highlight) - Code syntax highlighting capabilities

### Tertiary (LOW confidence)
- Various blog posts and tutorials on react-markdown (cross-verified with official docs)
- Stack Overflow discussions (used for edge case understanding, not primary guidance)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official GitHub documentation, current versions verified with npm
- Architecture: HIGH - Verified patterns from official documentation and trusted sources (Contentful, Strapi)
- Pitfalls: HIGH - Based on common React pitfalls and verified with community discussions
- Code examples: HIGH - Adapted from official documentation and verified working examples

**Research date:** 2026-01-20
**Valid until:** 30 days (libraries are stable, versions current)
