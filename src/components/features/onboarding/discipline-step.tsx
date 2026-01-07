import { CheckCircle2 } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils'
import type { OnboardingInput } from '@/lib/validation'

interface DisciplineStepProps {
  form: UseFormReturn<OnboardingInput>
}

export function DisciplineStep({ form }: DisciplineStepProps) {
  const discipline = form.watch('preferred_discipline')

  const options = [
    {
      value: 'boulder' as const,
      label: 'Boulder',
      description: 'Short, powerful climbs without ropes',
    },
    {
      value: 'sport' as const,
      label: 'Sport',
      description: 'Taller climbs with ropes and anchors',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">
          What Do You Climb?
        </h2>
        <p className="text-sm text-[#888]">
          Select your primary climbing discipline
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              form.setValue('preferred_discipline', option.value)
            }}
            className={cn(
              'p-6 border-2 transition-all flex flex-col items-center gap-3',
              discipline === option.value
                ? 'bg-white/10 border-white/30 text-white'
                : 'border-white/10 hover:border-white/30 bg-white/[0.02] text-[#aaa]'
            )}
          >
            <div className="text-center">
              <div className="font-black uppercase tracking-wider">{option.label}</div>
              <div className="text-xs font-mono text-[#666] mt-1">
                {option.description}
              </div>
            </div>
            {discipline === option.value && (
              <CheckCircle2 className="h-5 w-5 text-white" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
