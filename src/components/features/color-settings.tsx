import { ALL_HOLD_COLORS, HOLD_COLOR_MAP } from '@/lib/constants/colors'
import type { HoldColor } from '@/types'

// eslint-disable-next-line no-unused-vars
type ColorChangeHandler = (colors: HoldColor[]) => void

interface ColorSettingsProps {
  value: HoldColor[]
  onChange: ColorChangeHandler
}

export function ColorSettings({ value, onChange }: ColorSettingsProps) {
  const toggleColor = (color: HoldColor) => {
    const updated = value.includes(color) ? value.filter((c) => c !== color) : [...value, color]
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
        Enabled Hold Colors
      </label>
      <div className="grid grid-cols-3 gap-3" role="group" aria-label="Hold color selection">
        {ALL_HOLD_COLORS.map((color) => {
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
                backgroundColor: HOLD_COLOR_MAP[color],
                opacity: isEnabled ? 1 : 0.3,
              }}
              aria-pressed={isEnabled}
              aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${color} color`}
            >
              {isEnabled ? (
                <svg
                  className="absolute inset-0 m-auto h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : null}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-[#666] mt-2">
        Tap colors to enable/disable them in your climb logger
      </p>
    </div>
  )
}
