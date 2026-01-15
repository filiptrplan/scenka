import { zodResolver } from '@hookform/resolvers/zod'
import { Settings } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { z } from 'zod'

import { ColorSettings } from '@/components/features/color-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { profileSchema } from '@/lib/validation'
import type { HoldColor } from '@/types'

type ProfileFormData = z.input<typeof profileSchema>

const DEFAULT_COLORS: HoldColor[] = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink']

export function SettingsPage() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const { handleSubmit, register, setValue, watch, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      preferred_grade_scale: profile?.preferred_grade_scale ?? 'font',
      preferred_discipline: profile?.preferred_discipline ?? 'boulder',
      home_gym: profile?.home_gym ?? '',
      enabled_hold_colors: profile?.enabled_hold_colors ?? DEFAULT_COLORS,
    },
  })

  const gradeScale = watch('preferred_grade_scale')
  const discipline = watch('preferred_discipline')
  const enabledColors = watch('enabled_hold_colors')

  useEffect(() => {
    if (profile) {
      reset({
        preferred_grade_scale: profile.preferred_grade_scale,
        preferred_discipline: profile.preferred_discipline,
        home_gym: profile.home_gym ?? '',
        enabled_hold_colors: profile.enabled_hold_colors ?? DEFAULT_COLORS,
      })
    }
  }, [profile, reset])

  const handleFormSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        toast.success('Settings saved successfully')
        void navigate('/')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-6 w-6 text-[#666]" />
          <h2 className="text-2xl font-black uppercase tracking-tight">Settings</h2>
        </div>
        <div className="text-center py-12 text-[#888]">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-6 w-6 text-[#666]" />
        <h2 className="text-2xl font-black uppercase tracking-tight">Settings</h2>
      </div>

      <form onSubmit={(e) => void handleSubmit(handleFormSubmit)(e)} className="space-y-6">
        <div className="bg-white/[0.02] border-2 border-white/10 p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
              Home Gym
            </label>
            <Input
              {...register('home_gym')}
              placeholder="Enter your home gym name"
              className="h-12 bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30 hover:border-white/30 focus:border-white/50 transition-colors"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
              Default Grading System
            </label>
            <Select
              value={gradeScale}
              onValueChange={(value: 'font' | 'v_scale' | 'color_circuit') =>
                setValue('preferred_grade_scale', value)
              }
            >
              <SelectTrigger className="h-12 bg-[#1a1a1a] border-white/10 text-white hover:border-white/30 focus:border-white/50 transition-colors">
                <SelectValue placeholder="Select grading system" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                <SelectItem value="font">Font</SelectItem>
                <SelectItem value="v_scale">V-Scale</SelectItem>
                <SelectItem value="color_circuit">Color Circuit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
              Default Discipline
            </label>
            <Select
              value={discipline}
              onValueChange={(value: 'boulder' | 'sport') =>
                setValue('preferred_discipline', value)
              }
            >
              <SelectTrigger className="h-12 bg-[#1a1a1a] border-white/10 text-white hover:border-white/30 focus:border-white/50 transition-colors">
                <SelectValue placeholder="Select discipline" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                <SelectItem value="boulder">Boulder</SelectItem>
                <SelectItem value="sport">Sport</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ColorSettings
            value={enabledColors ?? DEFAULT_COLORS}
            onChange={(colors) => setValue('enabled_hold_colors', colors)}
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void navigate(-1)
            }}
            className="flex-1 h-12 border-white/20 hover:border-white/40 bg-white/[0.02] text-[#888] hover:text-black font-black uppercase tracking-wider"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateProfile.isPending}
            className="flex-1 h-12 bg-white text-black hover:bg-white/90 font-black uppercase tracking-wider disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  )
}
