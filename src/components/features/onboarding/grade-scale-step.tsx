import { CheckCircle2 } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils'
import type { OnboardingInput } from '@/lib/validation'

interface GradeScaleStepProps {
  form: UseFormReturn<OnboardingInput>
}

export function GradeScaleStep({ form }: GradeScaleStepProps) {
  const gradeScale = form.watch('preferred_grade_scale')

  const options = [
    {
      value: 'font' as const,
      label: 'Font',
      description: 'European grading scale (3-9c)',
    },
    {
      value: 'v_scale' as const,
      label: 'V-Scale',
      description: 'American bouldering scale (VB-V17)',
    },
    {
      value: 'color_circuit' as const,
      label: 'Color Circuit',
      description: 'Color-based difficulty (Teal→Black)',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">
          Choose Your Grade Scale
        </h2>
        <p className="text-sm text-[#888]">
          Select the grading system used at your climbing gym
        </p>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              form.setValue('preferred_grade_scale', option.value)
            }}
            className={cn(
              'w-full p-4 border-2 text-left transition-all',
              gradeScale === option.value
                ? 'bg-white/10 border-white/30 text-white'
                : 'border-white/10 hover:border-white/30 bg-white/[0.02] text-[#aaa]'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-black uppercase tracking-wider">{option.label}</div>
                <div className="text-xs font-mono text-[#666]">{option.description}</div>
              </div>
              {gradeScale === option.value && (
                <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
