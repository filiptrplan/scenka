import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { DisciplineStep } from './onboarding/discipline-step'
import { GradeScaleStep } from './onboarding/grade-scale-step'
import { HoldColorStep } from './onboarding/hold-color-step'
import { HomeGymStep } from './onboarding/home-gym-step'
import { ProgressIndicator } from './onboarding/progress-indicator'

import { Button } from '@/components/ui/button'
import { useUpdateProfile } from '@/hooks/useProfile'
import { DEFAULT_COLORS, onboardingSchema, type OnboardingInput } from '@/lib/validation'

interface OnboardingWizardProps {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const updateProfile = useUpdateProfile()

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      preferred_grade_scale: 'font',
      preferred_discipline: 'boulder',
      home_gym: '',
      enabled_hold_colors: DEFAULT_COLORS,
    },
    mode: 'onChange',
  })

  const steps = [
    { id: 1, title: 'Grade Scale', component: GradeScaleStep },
    { id: 2, title: 'Discipline', component: DisciplineStep },
    { id: 3, title: 'Home Gym', component: HomeGymStep },
    { id: 4, title: 'Hold Colors', component: HoldColorStep },
  ]

  const stepFields = {
    1: ['preferred_grade_scale'],
    2: ['preferred_discipline'],
    3: ['home_gym'],
    4: ['enabled_hold_colors'],
  } as const

  const handleNext = async () => {
    const isValid = await form.trigger(stepFields[currentStep])
    if (isValid) {
      if (currentStep < 4) {
        setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4)
      } else {
        handleSubmit(form.getValues())
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4)
    }
  }

  const handleSubmit = (data: OnboardingInput) => {
    updateProfile.mutate(
      {
        ...data,
        onboarding_completed: true,
      },
      {
        onSuccess: () => {
          onComplete()
        },
      }
    )
  }

  const CurrentStepComponent = steps.find((s) => s.id === currentStep)?.component

  if (!CurrentStepComponent) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Header with Progress */}
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tighter uppercase text-center text-white">
            Welcome to Scenka
          </h1>
          <ProgressIndicator currentStep={currentStep} totalSteps={4} />
        </div>

        {/* Step Content */}
        <div className="bg-[#111] border-2 border-white/10 p-6">
          <CurrentStepComponent form={form} />
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-14 border-white/20 hover:border-white/40 bg-white/[0.02] text-[#888] hover:text-black font-black uppercase tracking-wider"
            >
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={() => void handleNext()}
            disabled={updateProfile.isPending}
            className="flex-1 h-14 bg-white text-black hover:bg-white/90 font-black uppercase tracking-wider"
          >
            {updateProfile.isPending
              ? 'Saving...'
              : currentStep === 4
                ? 'Complete Setup'
                : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
