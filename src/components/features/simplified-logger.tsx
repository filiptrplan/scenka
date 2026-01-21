import { zodResolver } from '@hookform/resolvers/zod'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { forwardRef, useImperativeHandle, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormLabel } from '@/components/ui/form-label'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SelectionButton } from '@/components/ui/selection-button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useProfile } from '@/hooks/useProfile'
import { TERRAIN_OPTIONS } from '@/lib/constants'
import { getGradesForScale, COLOR_CIRCUIT } from '@/lib/grades'
import { cn } from '@/lib/utils'
import { simplifiedClimbSchema, type SimplifiedClimbInput } from '@/lib/validation'
import type { GradeScale, Discipline, Outcome, TerrainType, AwkwardnessLevel, HoldColor, Climb } from '@/types'

type SimplifiedClimbForm = SimplifiedClimbInput

export interface SimplifiedLoggerHandle {
  resetAllState: () => void
}

interface SimplifiedLoggerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void // eslint-disable-line no-unused-vars
  onSubmit?: (data: SimplifiedClimbForm) => void // eslint-disable-line no-unused-vars
  isSaving?: boolean
  climb?: Climb | null
}

const SimplifiedLogger = forwardRef<SimplifiedLoggerHandle, SimplifiedLoggerProps>(
  ({ open, onOpenChange, onSubmit, isSaving, climb }, ref) => {
    const { data: profile } = useProfile()
    const [gradeScale, setGradeScale] = useState<GradeScale>('color_circuit')
    const [discipline, setDiscipline] = useState<Discipline>('boulder')
    const [outcome, setOutcome] = useState<Outcome>('Fail')
    const [awkwardness, setAwkwardness] = useState<AwkwardnessLevel>('normal')
    const [terrainType, setTerrainType] = useState<TerrainType>('Vert')

    const {
      register,
      handleSubmit,
      setValue,
      watch,
      reset,
      formState: { errors, isSubmitting },
    } = useForm<SimplifiedClimbForm>({
      resolver: zodResolver(simplifiedClimbSchema),
      defaultValues: {
        climb_type: 'boulder',
        grade_scale: 'color_circuit',
        outcome: 'Fail',
        terrain_type: 'Vert',
        awkwardness: 'normal',
        location: profile?.home_gym ?? 'My Gym',
        hold_color: undefined,
      },
    })

    useEffect(() => {
      const gym = profile?.home_gym
      if (gym !== undefined && gym !== null && gym !== '') {
        setValue('location', gym)
      }
    }, [profile, setValue])

    useEffect(() => {
      if (climb !== null && climb !== undefined) {
        reset({
          climb_type: climb.climb_type as Discipline,
          grade_scale: climb.grade_scale as GradeScale,
          grade_value: climb.grade_value,
          outcome: climb.outcome as Outcome,
          terrain_type: 'Vert', // Default for existing climbs (may need migration)
          awkwardness: 'normal', // Default for existing climbs (may need migration)
          location: climb.location,
          notes: climb.notes ?? '',
          hold_color: climb.hold_color,
        })
        setGradeScale(climb.grade_scale as GradeScale)
        setDiscipline(climb.climb_type as Discipline)
        setOutcome(climb.outcome as Outcome)
      }
    }, [climb, reset])

    const resetAllState = () => {
      reset({
        climb_type: 'boulder',
        grade_scale: 'color_circuit',
        outcome: 'Fail',
        terrain_type: 'Vert',
        awkwardness: 'normal',
        location: profile?.home_gym ?? 'My Gym',
        hold_color: undefined,
        notes: '',
        grade_value: '',
      })
      setGradeScale('color_circuit')
      setDiscipline('boulder')
      setOutcome('Fail')
      setAwkwardness('normal')
      setTerrainType('Vert')
    }

    useImperativeHandle(ref, () => ({
      resetAllState,
    }))

    const selectedGrade = watch('grade_value')
    const selectedHoldColor = watch('hold_color')

    const handleColorSelect = (color: HoldColor) => {
      setValue('hold_color', color, { shouldValidate: true })
    }

    const handleFormSubmit = (data: SimplifiedClimbForm): void => {
      onSubmit?.(data)
    }

    const renderGradePicker = () => {
      if (gradeScale === 'color_circuit') {
        return (
          <div className="flex gap-2 overflow-x-auto py-1 pb-2 scrollbar-hide px-1">
            {COLOR_CIRCUIT.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => {
                  setValue('grade_value', color.name, { shouldValidate: true })
                }}
                className={cn(
                  'h-14 w-14 rounded-full flex items-center justify-center text-xs font-black uppercase tracking-wider transition-all',
                  color.color,
                  selectedGrade === color.name
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]'
                    : 'opacity-40 hover:opacity-70'
                )}
              >
                <span className="sr-only">{color.name}</span>
              </button>
            ))}
          </div>
        )
      }

      const grades = getGradesForScale(gradeScale)
      return (
        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
          {grades.map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => setValue('grade_value', grade, { shouldValidate: true })}
              className={cn(
                'px-3 py-2 text-xs font-black uppercase tracking-wider rounded-md border-2 transition-all',
                selectedGrade === grade
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'border-white/10 hover:border-white/30 bg-white/[0.02] text-[#888]'
              )}
            >
              {grade}
            </button>
          ))}
        </div>
      )
    }

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg bg-[#0a0a0a] border-white/10">
          <div className="h-full flex flex-col">
            <SheetHeader className="flex-shrink-0">
              <SheetTitle className="text-3xl font-black tracking-tighter uppercase">
                {climb !== null && climb !== undefined ? 'Edit Climb' : 'Log Climb'}
              </SheetTitle>
            </SheetHeader>

            <form
              id="climb-form"
              onSubmit={(event) => {
                event.preventDefault()
                void handleSubmit(handleFormSubmit)(event)
              }}
              className="flex-1 overflow-y-auto space-y-6 py-4 pb-24"
            >
              <FormSection className="space-y-4">
                <div className="space-y-2">
                  <FormLabel>Discipline</FormLabel>
                  <div className="flex gap-2">
                    <SelectionButton
                      selected={discipline === 'boulder'}
                      onClick={() => {
                        setDiscipline('boulder')
                        setValue('climb_type', 'boulder', { shouldValidate: true })
                      }}
                    >
                      Boulder
                    </SelectionButton>
                    <SelectionButton
                      selected={discipline === 'sport'}
                      onClick={() => {
                        setDiscipline('sport')
                        setValue('climb_type', 'sport', { shouldValidate: true })
                      }}
                    >
                      Sport
                    </SelectionButton>
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel>Grade Scale</FormLabel>
                  <Select
                    value={gradeScale}
                    onValueChange={(value: GradeScale) => {
                      setGradeScale(value)
                      setValue('grade_scale', value, { shouldValidate: true })
                      setValue('grade_value', '', { shouldValidate: true })
                    }}
                  >
                    <SelectTrigger className="border-white/10 bg-white/[0.02] text-white hover:border-white/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color_circuit">Color</SelectItem>
                      <SelectItem value="font">Font Scale</SelectItem>
                      <SelectItem value="v_scale">V-Scale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <FormLabel>Grade</FormLabel>
                  {renderGradePicker()}
                  {errors.grade_value !== undefined && (
                    <p className="text-xs text-red-400 font-mono">{errors.grade_value.message}</p>
                  )}
                </div>

                {profile?.enabled_hold_colors !== undefined &&
                  profile.enabled_hold_colors.length > 0 && (
                    <div className="space-y-2">
                      <FormLabel>Hold Color (optional)</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {profile.enabled_hold_colors.map((color) => {
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
                            teal: '#14b8a6',
                          }
                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={() => handleColorSelect(color)}
                              className={cn(
                                'h-14 w-full rounded-lg border-2 transition-all',
                                selectedHoldColor === color
                                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]'
                                  : 'opacity-40 hover:opacity-70'
                              )}
                              style={{ backgroundColor: colorMap[color] }}
                              aria-label={`Select ${color} color`}
                              aria-pressed={selectedHoldColor === color}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}
              </FormSection>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="space-y-2">
                  <FormLabel>Outcome</FormLabel>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOutcome('Sent')
                        setValue('outcome', 'Sent', { shouldValidate: true })
                      }}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 transition-all',
                        outcome === 'Sent'
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                          : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
                      )}
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs font-black uppercase tracking-wider">Sent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOutcome('Fail')
                        setValue('outcome', 'Fail', { shouldValidate: true })
                      }}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 transition-all',
                        outcome === 'Fail'
                          ? 'bg-red-500/10 border-red-500/50 text-red-400'
                          : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
                      )}
                    >
                      <TrendingDown className="h-4 w-4" />
                      <span className="text-xs font-black uppercase tracking-wider">Fail</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel>Terrain Type</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {TERRAIN_OPTIONS.map((terrain) => (
                      <button
                        key={terrain}
                        type="button"
                        onClick={() => {
                          setTerrainType(terrain)
                          setValue('terrain_type', terrain, { shouldValidate: true })
                        }}
                        className={cn(
                          'px-3 py-3 text-xs font-black uppercase tracking-wider rounded-md border-2 transition-all',
                          terrainType === terrain
                            ? 'bg-white/10 border-white/30 text-white'
                            : 'border-white/20 hover:border-white/30 bg-white/[0.02] text-[#888]'
                        )}
                      >
                        {terrain}
                      </button>
                    ))}
                  </div>
                  {errors.terrain_type !== undefined && (
                    <p className="text-xs text-red-400 font-mono">{errors.terrain_type.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <FormLabel>Awkwardness</FormLabel>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAwkwardness('smooth')
                        setValue('awkwardness', 'smooth', { shouldValidate: true })
                      }}
                      className={cn(
                        'flex-1 px-4 py-3 border-2 transition-all',
                        awkwardness === 'smooth'
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                          : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
                      )}
                    >
                      <span className="text-xs font-black uppercase tracking-wider">Smooth</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAwkwardness('normal')
                        setValue('awkwardness', 'normal', { shouldValidate: true })
                      }}
                      className={cn(
                        'flex-1 px-4 py-3 border-2 transition-all',
                        awkwardness === 'normal'
                          ? 'bg-white/10 border-white/30 text-white'
                          : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
                      )}
                    >
                      <span className="text-xs font-black uppercase tracking-wider">Normal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAwkwardness('awkward')
                        setValue('awkwardness', 'awkward', { shouldValidate: true })
                      }}
                      className={cn(
                        'flex-1 px-4 py-3 border-2 transition-all',
                        awkwardness === 'awkward'
                          ? 'bg-red-500/10 border-red-500/50 text-red-400'
                          : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
                      )}
                    >
                      <span className="text-xs font-black uppercase tracking-wider">Awkward</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="space-y-2">
                  <FormLabel>Notes (optional)</FormLabel>
                  <Textarea
                    {...register('notes')}
                    placeholder="Any additional thoughts..."
                    className="border-white/10 bg-white/[0.02] text-white placeholder:text-white/30 hover:border-white/30 focus-visible:border-white/30"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="space-y-2">
                  <FormLabel>Location</FormLabel>
                  <Input
                    {...register('location')}
                    placeholder="Gym or crag name"
                    className="border-white/10 bg-white/[0.02] text-white placeholder:text-white/30 hover:border-white/30 focus-visible:border-white/30"
                  />
                  {errors.location !== undefined && (
                    <p className="text-xs text-red-400 font-mono">{errors.location.message}</p>
                  )}
                </div>
              </div>
            </form>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#09090b] border-t border-white/10 z-50 sm:relative sm:border-0 sm:bg-transparent sm:static sm:p-0 sm:z-auto">
              <Button
                type="submit"
                form="climb-form"
                className="w-full bg-white text-black hover:bg-white/90 font-black"
                size="lg"
                disabled={isSubmitting || isSaving === true}
              >
                {isSubmitting || isSaving === true
                  ? 'SAVING...'
                  : climb !== null && climb !== undefined
                    ? 'SAVE CHANGES'
                    : 'LOG CLIMB'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }
)

SimplifiedLogger.displayName = 'SimplifiedLogger'

export { SimplifiedLogger }
