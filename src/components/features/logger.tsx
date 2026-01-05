import { zodResolver } from '@hookform/resolvers/zod'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import {
  STYLE_OPTIONS,
  getFailureReasons,
  getAwkwardnessLabel,
  DEFAULT_LOCATION,
} from '@/lib/constants'
import { getGradesForScale, COLOR_CIRCUIT } from '@/lib/grades'
import { cn } from '@/lib/utils'
import type { GradeScale, Discipline, Outcome, Style, FailureReason } from '@/types'

const climbSchema = z.object({
  discipline: z.enum(['boulder', 'sport']),
  gradeScale: z.enum(['font', 'v_scale', 'color_circuit']),
  grade: z.string().min(1),
  location: z.string().min(1),
  outcome: z.enum(['Sent', 'Fail']),
  awkwardness: z.number().int().min(1).max(5),
  style: z.array(z.string()).min(0),
  failureReasons: z.array(z.string()).min(0),
  notes: z.string().optional(),
})

type ClimbForm = z.infer<typeof climbSchema>

interface LoggerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSubmit?: (data: ClimbForm) => void
}

export function Logger({ open, onOpenChange, onSubmit }: LoggerProps) {
  const [gradeScale, setGradeScale] = useState<GradeScale>('color_circuit')
  const [discipline, setDiscipline] = useState<Discipline>('boulder')
  const [outcome, setOutcome] = useState<Outcome>('Fail')
  const [awkwardness, setAwkwardness] = useState<number>(3)
  const [selectedStyles, setSelectedStyles] = useState<Style[]>([])
  const [selectedReasons, setSelectedReasons] = useState<FailureReason[]>([])

  const { register, handleSubmit, setValue, watch } = useForm<ClimbForm>({
    resolver: zodResolver(climbSchema),
    defaultValues: {
      discipline: 'boulder',
      gradeScale: 'color_circuit',
      outcome: 'Fail',
      awkwardness: 3,
      style: [],
      failureReasons: [],
      location: DEFAULT_LOCATION,
    },
  })

  const selectedGrade = watch('grade')

  const toggleStyle = (style: Style) => {
    setSelectedStyles((prev) => {
      const newStyles = prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
      setValue('style', newStyles)
      return newStyles
    })
  }

  const toggleReason = (reason: FailureReason) => {
    setSelectedReasons((prev) => {
      const newReasons = prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
      setValue('failureReasons', newReasons)
      return newReasons
    })
  }

  const handleFormSubmit = (data: ClimbForm) => {
    console.log('Climb logged:', data)
    onSubmit?.(data)
  }

  const renderGradePicker = () => {
    if (gradeScale === 'color_circuit') {
      return (
        <div className="flex flex-wrap gap-2">
          {COLOR_CIRCUIT.map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={() => {
                setValue('grade', color.name)
              }}
              className={cn(
                'h-14 w-14 rounded-full flex items-center justify-center text-xs font-black uppercase tracking-wider transition-all',
                color.color,
                selectedGrade === color.name
                  ? 'ring-4 ring-white ring-offset-4 ring-offset-[#0a0a0a]'
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
            onClick={() => setValue('grade', grade)}
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
              Log Climb
            </SheetTitle>
          </SheetHeader>

          <form
            id="climb-form"
            onSubmit={handleSubmit(handleFormSubmit)}
            className="flex-1 overflow-y-auto space-y-6 py-4 pb-24"
          >
            {/* Step 1: The Basics */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
                  Discipline
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscipline('boulder')
                      setValue('discipline', 'boulder')
                    }}
                    className={cn(
                      'flex-1 px-4 py-3 border-2 text-xs font-black uppercase tracking-wider transition-all',
                      discipline === 'boulder'
                        ? 'bg-white/10 border-white/30 text-white'
                        : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
                    )}
                  >
                    Boulder
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscipline('sport')
                      setValue('discipline', 'sport')
                    }}
                    className={cn(
                      'flex-1 px-4 py-3 border-2 text-xs font-black uppercase tracking-wider transition-all',
                      discipline === 'sport'
                        ? 'bg-white/10 border-white/30 text-white'
                        : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
                    )}
                  >
                    Sport
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
                  Grade Scale
                </label>
                <Select
                  value={gradeScale}
                  onValueChange={(value: GradeScale) => {
                    setGradeScale(value)
                    setValue('gradeScale', value)
                    setValue('grade', '')
                  }}
                >
                  <SelectTrigger className="border-white/10 bg-white/[0.02] text-white hover:border-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color_circuit">Color Circuit</SelectItem>
                    <SelectItem value="font">Font Scale</SelectItem>
                    <SelectItem value="v_scale">V-Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
                  Grade
                </label>
                {renderGradePicker()}
              </div>
            </div>

            {/* Step 2: The Result */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="space-y-2">
                <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
                  Outcome
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOutcome('Sent')
                      setValue('outcome', 'Sent')
                      setSelectedReasons([])
                      setValue('failureReasons', [])
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
                      setValue('outcome', 'Fail')
                      setSelectedReasons([])
                      setValue('failureReasons', [])
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
                <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
                  Awkwardness: {getAwkwardnessLabel(awkwardness)}
                </label>
                <Slider
                  value={[awkwardness]}
                  onValueChange={(value) => {
                    const newValue = value[0] ?? 3
                    setAwkwardness(newValue)
                    setValue('awkwardness', newValue)
                  }}
                  min={1}
                  max={5}
                  step={1}
                  className="py-4"
                />
              </div>
            </div>

            {/* Step 3: The "Why" */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="space-y-2">
                <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
                  Style (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((style) => (
                    <Badge
                      key={style}
                      variant={selectedStyles.includes(style) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer text-xs font-mono uppercase',
                        selectedStyles.includes(style) ? '' : 'border-white/20 text-[#ccc]'
                      )}
                      onClick={() => toggleStyle(style)}
                    >
                      {style}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
                  {outcome === 'Fail' ? 'Failure Reasons' : 'Imperfect Aspects'} (select all that
                  apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {getFailureReasons(outcome).map((reason) => (
                    <Badge
                      key={reason}
                      variant={selectedReasons.includes(reason) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer text-xs font-mono uppercase',
                        selectedReasons.includes(reason) ? '' : 'border-white/20 text-[#ccc]'
                      )}
                      onClick={() => toggleReason(reason)}
                    >
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
                  Notes (optional)
                </label>
                <Textarea
                  {...register('notes')}
                  placeholder="Any additional thoughts..."
                  className="border-white/10 bg-white/[0.02] text-white placeholder:text-white/30 hover:border-white/30 focus-visible:border-white/30"
                />
              </div>
            </div>

            {/* Step 4: Location */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="space-y-2">
                <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
                  Location
                </label>
                <Input
                  {...register('location')}
                  placeholder="Gym or crag name"
                  className="border-white/10 bg-white/[0.02] text-white placeholder:text-white/30 hover:border-white/30 focus-visible:border-white/30"
                />
              </div>
            </div>
          </form>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#09090b] border-t border-white/10 z-50 sm:relative sm:border-0 sm:bg-transparent sm:static sm:p-0 sm:z-auto">
            <Button
              type="submit"
              form="climb-form"
              className="w-full bg-white text-black hover:bg-white/90 font-black"
              size="lg"
            >
              LOG CLIMB
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
