import type { Components } from 'react-markdown'

export const markdownComponents: Components = {
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
  li: ({ children }) => (
    <li className="mb-1">{children}</li>
  ),
  code: ({ children, className, ...props }) => {
    // If className is present, this is a code block (from rehype-highlight)
    if (className) {
      return <code className={className} {...props}>{children}</code>
    }
    // Inline code
    return (
      <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-blue-300" {...props}>
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto my-3">{children}</pre>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-blue-400 hover:text-blue-300 underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-200">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-400 my-3">
      {children}
    </blockquote>
  ),
}
