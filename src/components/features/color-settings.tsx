import type { HoldColor } from '@/types'

// eslint-disable-next-line no-unused-vars
type ColorChangeHandler = (colors: HoldColor[]) => void

interface ColorSettingsProps {
  value: HoldColor[]
  onChange: ColorChangeHandler
}

export function ColorSettings({ value, onChange }: ColorSettingsProps) {
  const colorMap: Record<HoldColor, string> = {
    red: '#ef4444',
    green: '#22c55e',
    blue: '#3b82f6',
    yellow: '#eab308',
    black: '#000000',
    white: '#ffffff',
    orange: '#f97316',
    purple: '#a855f7',
    pink: '#ec4899',
  }

  const ALL_COLORS: HoldColor[] = ['red', 'green', 'blue', 'yellow', 'black', 'white', 'orange', 'purple', 'pink']

  const toggleColor = (color: HoldColor) => {
    const updated = value.includes(color) ? value.filter((c) => c !== color) : [...value, color]
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-mono text-[#666] uppercase tracking-wider">Enabled Hold Colors</label>
      <div className="grid grid-cols-3 gap-3" role="group" aria-label="Hold color selection">
        {ALL_COLORS.map((color) => {
          const isEnabled = value.includes(color)
          return (
            <button
              key={color}
              type="button"
              onClick={() => toggleColor(color)}
              className={`
                relative h-14 rounded-lg border-2 transition-all
                focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]
                ${isEnabled ? 'border-white' : 'border-white/10'}
              `}
              style={{
                backgroundColor: colorMap[color],
                opacity: isEnabled ? 1 : 0.3,
              }}
              aria-pressed={isEnabled}
              aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${color} color`}
            >
              {isEnabled ? (
                <svg className="absolute inset-0 m-auto h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : null}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-[#666] mt-2">Tap colors to enable/disable them in your climb logger</p>
    </div>
  )
}
