import { formatDistanceToNow } from 'date-fns'
import { MapPin, TrendingDown, TrendingUp, Flame, Edit, Trash2, Check } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUpdateClimb } from '@/hooks/useClimbs'
import { COLOR_CIRCUIT } from '@/lib/grades'
import type { Climb, HoldColor } from '@/types'

// Color mapping for hold colors (matches ColorSettings component)
const HOLD_COLOR_MAP: Record<HoldColor, string> = {
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  yellow: '#eab308',
  black: '#18181b',
  white: '#fafafa',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
}

interface ClimbCardProps {
  climb: Climb
  onEditClick: (climb: Climb) => void
  onDeleteClick: (climb: Climb) => void
}

export function ClimbCard({ climb, onEditClick, onDeleteClick }: ClimbCardProps) {
  const updateClimb = useUpdateClimb()

  const handleMarkAsSent = () => {
    updateClimb.mutate(
      {
        id: climb.id,
        updates: {
          outcome: 'Sent',
          failure_reasons: [],
          redemption_at: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          // Cache automatically invalidated via useUpdateClimb onSuccess callback
        },
      }
    )
  }

  const date = new Date(climb.created_at)
  const dateLabel = formatDistanceToNow(date, { addSuffix: true })

  const gradeScaleLabels: Record<string, string> = {
    font: 'Font',
    v_scale: 'V-Scale',
    color_circuit: 'Color',
  }

  return (
    <div className="group bg-white/[0.02] border-2 border-white/10 p-6 hover:border-white/30 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 pt-2">
          <div className="flex flex-col">
            <div className="text-xs font-mono text-[#666] uppercase tracking-wider mb-1">
              {dateLabel}
            </div>
            <div className="text-xs font-mono text-[#666] uppercase tracking-wider flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {climb.location}
            </div>
            {climb.hold_color !== null && climb.hold_color !== undefined && (
              <div className="text-xs font-mono text-[#666] uppercase tracking-wider flex items-center gap-2 mt-1">
                <span>Hold Color</span>
                <div
                  className="w-4 h-4 rounded-full border-2 border-white/20 ring-1 ring-white/10"
                  style={{ backgroundColor: HOLD_COLOR_MAP[climb.hold_color] }}
                  aria-label={`Hold color: ${climb.hold_color}`}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditClick(climb)}
            className="p-2 text-[#666] hover:text-white hover:bg-white/10 transition-all"
            aria-label="Edit climb"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDeleteClick(climb)}
            className="p-2 text-[#666] hover:text-red-400 hover:bg-white/10 transition-all"
            aria-label="Delete climb"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-[#666]">
            {gradeScaleLabels[climb.grade_scale]}
          </span>
          {climb.grade_scale === 'color_circuit' ? (
            (() => {
              const color = COLOR_CIRCUIT.find((c) => c.name === climb.grade_value)
              return color ? (
                <div key={color.name} className={`text-3xl font-black tracking-tight ${color.textColor}`}>
                  {color.letter}
                </div>
              ) : (
                <div className="text-3xl font-black tracking-tight">{climb.grade_value}</div>
              )
            })()
          ) : (
            <div className="text-3xl font-black tracking-tight">{climb.grade_value}</div>
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
          <span className="text-xs font-black uppercase tracking-wider">{climb.outcome}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs font-mono text-[#666] uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4" />
          <span>Awkwardness: {climb.awkwardness}/5</span>
        </div>
      </div>

      <div className="space-y-3">
        {climb.style.length > 0 && (
          <div>
            <div className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">
              Style
            </div>
            <div className="flex flex-wrap gap-2">
              {climb.style.map((style) => (
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

        {climb.failure_reasons.length > 0 && (
          <div>
            <div className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">
              {climb.outcome === 'Fail' ? 'Failure Reasons' : 'Imperfect Aspects'}
            </div>
            <div className="flex flex-wrap gap-2">
              {climb.failure_reasons.map((reason) => (
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

        {climb.notes !== null && climb.notes.trim().length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">
              Notes
            </div>
            <p className="text-sm text-[#bbb] leading-relaxed">{climb.notes}</p>
          </div>
        )}
      </div>

      {climb.outcome === 'Fail' && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <Button
            type="button"
            onClick={handleMarkAsSent}
            disabled={updateClimb.isPending}
            variant="outline"
            className="text-[#aaa]"
          >
            <Check className="h-4 w-4 mr-2" />
            {updateClimb.isPending ? 'Updating...' : 'Mark as Sent'}
          </Button>
        </div>
      )}
    </div>
  )
}
