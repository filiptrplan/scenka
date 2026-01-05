import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface ErrorBannerProps {
  message: string
  onDismiss: () => void
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50">
      <div className="bg-red-500/10 border-2 border-red-500/50 text-red-400 p-4 rounded-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-mono font-bold uppercase tracking-wider mb-1">Error</p>
            <p className="text-sm">{message}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-6 w-6 text-red-400 hover:bg-red-500/20 hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
