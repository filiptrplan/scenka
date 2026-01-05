import { zodResolver } from '@hookform/resolvers/zod'
import { Settings } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { profileSchema, type UpdateProfileInput } from '@/lib/validation'

export function SettingsPage() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const { handleSubmit, setValue, watch } = useForm<UpdateProfileInput>({
    resolver: zodResolver(profileSchema),
  })

  const gradeScale = watch('preferred_grade_scale')
  const discipline = watch('preferred_discipline')

  useEffect(() => {
    if (profile) {
      setValue('preferred_grade_scale', profile.preferred_grade_scale)
      setValue('preferred_discipline', profile.preferred_discipline)
    }
  }, [profile, setValue])

  const handleFormSubmit = (data: UpdateProfileInput) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
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
