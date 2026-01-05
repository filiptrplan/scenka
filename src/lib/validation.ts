import { z } from 'zod'

export const climbSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  climb_type: z.enum(['boulder', 'sport']),
  grade_scale: z.enum(['font', 'v_scale', 'color_circuit']),
  grade_value: z
    .any()
    .refine((val) => val !== undefined && val !== '', {
      message: 'You must select a grade',
    })
    .pipe(z.string()),
  style: z
    .array(z.enum(['Slab', 'Vert', 'Overhang', 'Roof', 'Dyno', 'Crimp', 'Sloper', 'Pinch']))
    .min(0),
  outcome: z.enum(['Sent', 'Fail']),
  awkwardness: z.number().int().min(1).max(5),
  failure_reasons: z
    .array(
      z.enum([
        'Pumped',
        'Finger Strength',
        'Core',
        'Power',
        'Bad Feet',
        'Body Position',
        'Beta Error',
        'Precision',
        'Fear',
        'Commitment',
        'Focus',
      ])
    )
    .min(0),
  notes: z.string().optional(),
})

export type CreateClimbInput = z.infer<typeof climbSchema>

export const profileSchema = z.object({
  preferred_grade_scale: z.enum(['font', 'v_scale', 'color_circuit']),
  preferred_discipline: z.enum(['boulder', 'sport']),
  home_gym: z.string().optional(),
})

export type UpdateProfileInput = z.infer<typeof profileSchema>
