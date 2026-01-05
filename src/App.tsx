import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Logger } from '@/components/features/logger'
import { Button } from '@/components/ui/button'

export default function App() {
  const [loggerOpen, setLoggerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">BetaBreak</h1>
          <p className="text-sm text-muted-foreground">Track your climbing failures</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="text-sm text-muted-foreground">No climbs logged yet.</p>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 md:hidden">
          <Logger open={loggerOpen} onOpenChange={setLoggerOpen} />
          {!loggerOpen && (
            <Button
              size="lg"
              className="rounded-full h-14 w-14"
              onClick={() => setLoggerOpen(true)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
