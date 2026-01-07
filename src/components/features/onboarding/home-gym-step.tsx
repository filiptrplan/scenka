import { Info } from 'lucide-react'
import React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import type { OnboardingInput } from '@/lib/validation'

interface HomeGymStepProps {
  form: UseFormReturn<OnboardingInput>
}

export function HomeGymStep({ form }: HomeGymStepProps) {
  const [value, setValue] = React.useState('')
  const error = form.formState.errors.home_gym

  React.useEffect(() => {
    form.setValue('home_gym', value)
  }, [value, form])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">
          Where Do You Climb?
        </h2>
        <p className="text-sm text-[#888]">
          Enter your home gym name to autofill location in climb logs
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-mono text-white uppercase tracking-wider">
            Home Gym Name
          </label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g., Brooklyn Boulders, Earth Treks"
            className="h-12 bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
            autoFocus
          />
        </div>

        {error?.message !== undefined && error.message.length > 0 && (
          <p className="text-xs text-red-400 font-mono">{error.message}</p>
        )}

        <div className="bg-white/[0.02] border border-white/10 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-[#666] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-mono text-[#666] uppercase">
                Pro Tip
              </div>
              <p className="text-sm text-[#888]">
                You can change this anytime in Settings if you climb at multiple gyms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
