import { CheckCircle2 } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import { ALL_HOLD_COLORS, HOLD_COLOR_MAP, DEFAULT_COLORS } from '@/lib/constants/colors'
import { cn } from '@/lib/utils'
import type { OnboardingInput } from '@/lib/validation'
import type { HoldColor } from '@/types'

interface HoldColorStepProps {
  form: UseFormReturn<OnboardingInput>
}

export function HoldColorStep({ form }: HoldColorStepProps) {
  const enabledColors = form.watch('enabled_hold_colors')
  const error = form.formState.errors.enabled_hold_colors?.message

  const toggleColor = (color: HoldColor) => {
    const currentColors = form.getValues('enabled_hold_colors') ?? DEFAULT_COLORS
    const newColors = currentColors.includes(color)
      ? currentColors.filter((c) => c !== color)
      : [...currentColors, color]
    form.setValue('enabled_hold_colors', newColors)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">
          Choose Your Hold Colors
        </h2>
        <p className="text-sm text-[#888]">Select the hold colors available at your gym</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {ALL_HOLD_COLORS.map((color) => {
          const isSelected = enabledColors?.includes(color) ?? false
          return (
            <button
              key={color}
              type="button"
              onClick={() => toggleColor(color)}
              className={cn(
                'relative h-14 w-full border-2 transition-all flex items-center justify-center',
                isSelected
                  ? 'border-white opacity-100'
                  : 'border-white/10 opacity-30 hover:border-white/20 hover:opacity-50'
              )}
              style={isSelected ? {} : { backgroundColor: HOLD_COLOR_MAP[color] }}
            >
              {isSelected ? (
                <>
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: HOLD_COLOR_MAP[color] }}
                  />
                  <CheckCircle2 className="relative z-10 h-6 w-6 text-white drop-shadow-md" />
                </>
              ) : (
                <span className="text-xs font-medium uppercase text-black/80 drop-shadow-sm">
                  {color}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {error && error.length > 0 ? <p className="text-sm text-red-500 font-medium">{error}</p> : null}

      <p className="text-xs text-[#666]">
        You can always change your enabled colors later in Settings
      </p>
    </div>
  )
}
