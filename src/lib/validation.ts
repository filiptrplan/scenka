import { z } from 'zod'

import type { HoldColor } from '@/types'

const DEFAULT_COLORS: HoldColor[] = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink']

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
  hold_color: z.enum(['red', 'green', 'blue', 'yellow', 'black', 'white', 'orange', 'purple', 'pink', 'teal']).optional(),
  style: z
    .array(
      z.enum([
        'Slab',
        'Vert',
        'Overhang',
        'Roof',
        'Dyno',
        'Crimp',
        'Sloper',
        'Pinch',
        'Compression',
        'Tension',
      ])
    )
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
        'Flexibility',
        'Balance',
        'Endurance',
        'Bad Feet',
        'Body Position',
        'Beta Error',
        'Precision',
        'Precision (Feet)',
        'Precision (Hands)',
        'Coordination (Hands)',
        'Coordination (Feet)',
        'Foot Swap',
        'Heel Hook',
        'Toe Hook',
        'Rockover',
        'Pistol Squat',
        'Drop Knee',
        'Twist Lock',
        'Flagging',
        'Dyno',
        'Deadpoint',
        'Latch',
        'Mantle',
        'Undercling',
        'Gaston',
        'Match',
        'Cross',
        'Fear',
        'Commitment',
        'Focus',
      ])
    )
    .min(0),
  notes: z.string().optional(),
  redemption_at: z.string().optional(),
})

export type CreateClimbInput = z.infer<typeof climbSchema>

export const profileSchema = z.object({
  preferred_grade_scale: z.enum(['font', 'v_scale', 'color_circuit']),
  preferred_discipline: z.enum(['boulder', 'sport']),
  home_gym: z.string().optional(),
  enabled_hold_colors: z.array(z.enum(['red', 'green', 'blue', 'yellow', 'black', 'white', 'orange', 'purple', 'pink', 'teal'])).default(DEFAULT_COLORS),
  close_logger_after_add: z.boolean().default(true),
  climbing_context: z.string().max(2000).optional(),
})

export type UpdateProfileInput = z.infer<typeof profileSchema>

export const onboardingSchema = z.object({
  preferred_grade_scale: z.enum(['font', 'v_scale', 'color_circuit']),
  preferred_discipline: z.enum(['boulder', 'sport']),
  home_gym: z.string().min(1, 'Please enter your home gym name'),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
