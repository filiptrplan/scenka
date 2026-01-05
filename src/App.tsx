import { Plus, MapPin, TrendingDown, TrendingUp, Flame } from 'lucide-react'
import { useState } from 'react'

import { Logger } from '@/components/features/logger'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { COLOR_CIRCUIT } from '@/lib/grades'

interface ClimbSkeleton {
  id: string
  date: string
  location: string
  grade: string
  gradeScale: string
  outcome: 'Sent' | 'Fail'
  awkwardness: number
  styles: string[]
  failureReasons: string[]
  notes?: string
}

const mockClimbs: ClimbSkeleton[] = [
  {
    id: '1',
    date: 'Jan 4',
    location: 'Gravity Lab',
    grade: 'V6',
    gradeScale: 'V-Scale',
    outcome: 'Fail',
    awkwardness: 4,
    styles: ['Overhang', 'Crimp'],
    failureReasons: ['Finger Strength', 'Beta Error'],
    notes: 'Fell at the crux, need to work on left-hand crimp sequence',
  },
  {
    id: '2',
    date: 'Jan 3',
    location: 'The Rock Club',
    grade: 'V4',
    gradeScale: 'V-Scale',
    outcome: 'Sent',
    awkwardness: 2,
    styles: ['Vert', 'Sloper'],
    failureReasons: ['Bad Feet'],
    notes: 'Felt good, sloper crux was tricky but figured out the beta',
  },
  {
    id: '3',
    date: 'Jan 2',
    location: 'Stone Summit',
    grade: 'Yellow',
    gradeScale: 'Color',
    outcome: 'Fail',
    awkwardness: 3,
    styles: ['Overhang', 'Crimp'],
    failureReasons: ['Pumped', 'Finger Strength'],
    notes: 'Color circuit yellow is feeling good, almost there',
  },
  {
    id: '4',
    date: 'Dec 30',
    location: 'Gravity Lab',
    grade: '6b+',
    gradeScale: 'Font',
    outcome: 'Fail',
    awkwardness: 5,
    styles: ['Slab', 'Vert'],
    failureReasons: ['Fear', 'Commitment'],
    notes: 'Sketched out at the clip, pumped out trying to hang',
  },
]

export default function App() {
  const [loggerOpen, setLoggerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 border-b-2 border-white/20 pb-6">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Scenka</h1>
          <p className="text-sm font-mono text-[#888] uppercase tracking-widest">
            Track your climbing failures
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-24">
          {mockClimbs.map((climb) => (
            <div
              key={climb.id}
              className="group bg-white/[0.02] border-2 border-white/10 p-6 hover:border-white/30 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex flex-col">
                    <div className="text-xs font-mono text-[#666] uppercase tracking-wider mb-1">
                      {climb.date}
                    </div>
                    <div className="text-xs font-mono text-[#666] uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {climb.location}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-[#666]">{climb.gradeScale}</span>
                    {climb.gradeScale === 'Color' ? (
                      (() => {
                        const color = COLOR_CIRCUIT.find((c) => c.name === climb.grade)
                        return color ? (
                          <div
                            key={color.name}
                            className={`h-10 w-10 border-2 border-white/10 ${color.color}`}
                          />
                        ) : null
                      })()
                    ) : (
                      <div className="text-3xl font-black tracking-tight">{climb.grade}</div>
                    )}
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 border-2 ${
                      climb.outcome === 'Sent'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/50 text-red-400'
                    }`}
                  >
                    {climb.outcome === 'Sent' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-xs font-black uppercase tracking-wider">
                      {climb.outcome}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 text-xs font-mono text-[#666] uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  <span>Awkwardness: {climb.awkwardness}/5</span>
                </div>
              </div>

              <div className="space-y-3">
                {climb.styles.length > 0 && (
                  <div>
                    <div className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">
                      Style
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {climb.styles.map((style) => (
                        <Badge
                          key={style}
                          variant="outline"
                          className="text-xs font-mono uppercase border-white/20 text-[#ccc] px-2 py-1"
                        >
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {climb.failureReasons.length > 0 && (
                  <div>
                    <div className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">
                      {climb.outcome === 'Fail' ? 'Failure Reasons' : 'Imperfect Aspects'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {climb.failureReasons.map((reason) => (
                        <Badge
                          key={reason}
                          variant="outline"
                          className="text-xs font-mono uppercase border-white/20 text-[#ccc] px-2 py-1"
                        >
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {climb.notes !== undefined && climb.notes.trim().length > 0 ? (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">
                      Notes
                    </div>
                    <p className="text-sm text-[#bbb] leading-relaxed">{climb.notes}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-6 right-6 md:hidden">
          <Logger open={loggerOpen} onOpenChange={setLoggerOpen} />
          {!loggerOpen && (
            <Button
              size="lg"
              className="rounded-none h-16 w-16 bg-white text-black hover:bg-white/90 font-black"
              onClick={() => setLoggerOpen(true)}
            >
              <Plus className="h-8 w-8" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
