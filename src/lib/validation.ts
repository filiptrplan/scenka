import { z } from 'zod'

import { DEFAULT_COLORS } from '@/lib/constants/colors'
import {
  GRADE_SCALE_ENUM,
  DISCIPLINE_ENUM,
  HOLD_COLOR_ENUM,
  STYLE_ENUM,
  OUTCOME_ENUM,
  AWKWARDNESS_ENUM,
  FAILURE_REASON_ENUM,
  TERRAIN_ENUM,
  AWKWARDNESS_OPTIONS_ENUM,
} from '@/lib/constants/validation'

export { DEFAULT_COLORS }

export const climbSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  climb_type: DISCIPLINE_ENUM,
  grade_scale: GRADE_SCALE_ENUM,
  grade_value: z
    .any()
    .refine((val) => val !== undefined && val !== '', {
      message: 'You must select a grade',
    })
    .pipe(z.string()),
  hold_color: HOLD_COLOR_ENUM.optional(),
  style: z.array(STYLE_ENUM).min(0),
  outcome: OUTCOME_ENUM,
  awkwardness: AWKWARDNESS_ENUM,
  failure_reasons: z.array(FAILURE_REASON_ENUM).min(0),
  notes: z.string().optional(),
  redemption_at: z.string().optional(),
})

export type CreateClimbInput = z.infer<typeof climbSchema>

export const profileSchema = z.object({
  preferred_grade_scale: GRADE_SCALE_ENUM,
  preferred_discipline: DISCIPLINE_ENUM,
  home_gym: z.string().optional(),
  enabled_hold_colors: z.array(HOLD_COLOR_ENUM).default(DEFAULT_COLORS),
  close_logger_after_add: z.boolean().default(true),
  climbing_context: z.string().max(2000).optional(),
})

export type UpdateProfileInput = z.infer<typeof profileSchema>

export const simplifiedClimbSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  climb_type: DISCIPLINE_ENUM,
  grade_scale: GRADE_SCALE_ENUM,
  grade_value: z
    .any()
    .refine((val) => val !== undefined && val !== '', {
      message: 'You must select a grade',
    })
    .pipe(z.string()),
  hold_color: HOLD_COLOR_ENUM.optional(),
  outcome: OUTCOME_ENUM,
  terrain_type: TERRAIN_ENUM,
  awkwardness: AWKWARDNESS_OPTIONS_ENUM,
  notes: z.string().optional(),
})

export type SimplifiedClimbInput = z.infer<typeof simplifiedClimbSchema>

export const onboardingSchema = z.object({
  preferred_grade_scale: GRADE_SCALE_ENUM,
  preferred_discipline: DISCIPLINE_ENUM,
  home_gym: z.string().min(1, 'Please enter your home gym name'),
  enabled_hold_colors: z.array(HOLD_COLOR_ENUM).min(1, 'Select at least one color'),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
