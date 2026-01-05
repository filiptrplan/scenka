import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { getGradesForScale, COLOR_CIRCUIT } from '@/lib/grades'
import {
  STYLE_OPTIONS,
  getFailureReasons,
  getAwkwardnessLabel,
  DEFAULT_LOCATION,
} from '@/lib/constants'
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
                'h-14 w-14 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                color.color,
                selectedGrade === color.name
                  ? 'ring-4 ring-white ring-offset-4 ring-offset-background'
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
              'px-3 py-2 text-sm rounded-md border transition-all',
              selectedGrade === grade
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'
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
      <SheetContent className="w-full sm:max-w-lg">
        <div className="h-full flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Log Climb</SheetTitle>
          </SheetHeader>

          <form
            id="climb-form"
            onSubmit={handleSubmit(handleFormSubmit)}
            className="flex-1 overflow-y-auto space-y-6 py-4 pb-24"
          >
            {/* Step 1: The Basics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Discipline</label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Boulder</span>
                  <Switch
                    checked={discipline === 'sport'}
                    onCheckedChange={(checked) => {
                      const newDiscipline = checked ? 'sport' : 'boulder'
                      setDiscipline(newDiscipline)
                      setValue('discipline', newDiscipline)
                    }}
                  />
                  <span className="text-sm">Sport</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Grade Scale</label>
                <Select
                  value={gradeScale}
                  onValueChange={(value: GradeScale) => {
                    setGradeScale(value)
                    setValue('gradeScale', value)
                    setValue('grade', '')
                  }}
                >
                  <SelectTrigger>
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
                <label className="text-sm font-medium">Grade</label>
                {renderGradePicker()}
              </div>
            </div>

            {/* Step 2: The Result */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Outcome</label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Sent</span>
                  <Switch
                    checked={outcome === 'Fail'}
                    onCheckedChange={(checked) => {
                      const newOutcome = checked ? 'Fail' : 'Sent'
                      setOutcome(newOutcome)
                      setValue('outcome', newOutcome)
                      setSelectedReasons([])
                      setValue('failureReasons', [])
                    }}
                  />
                  <span className="text-sm">Fail</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
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
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">Style (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((style) => (
                    <Badge
                      key={style}
                      variant={selectedStyles.includes(style) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleStyle(style)}
                    >
                      {style}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {outcome === 'Fail' ? 'Failure Reasons' : 'Imperfect Aspects'} (select all that
                  apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {getFailureReasons(outcome).map((reason) => (
                    <Badge
                      key={reason}
                      variant={selectedReasons.includes(reason) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleReason(reason)}
                    >
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea {...register('notes')} placeholder="Any additional thoughts..." />
              </div>
            </div>

            {/* Step 4: Location */}
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input {...register('location')} placeholder="Gym or crag name" />
              </div>
            </div>
          </form>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50 sm:relative sm:border-0 sm:bg-transparent sm:static sm:p-0 sm:z-auto">
            <Button type="submit" form="climb-form" className="w-full" size="lg">
              Log Climb
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
