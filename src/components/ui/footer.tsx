export function Footer() {
  const version = '1.1.0'

  return (
    <footer className="fixed bottom-0 left-0 right-0 py-2 z-40">
      <p className="text-center text-xs font-mono text-[#888]">v{version}</p>
    </footer>
  )
}
