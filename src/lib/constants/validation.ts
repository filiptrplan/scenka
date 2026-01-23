import { z } from 'zod'

import { ALL_HOLD_COLORS } from './colors'
import { STYLE_OPTIONS, PHYSICAL_REASONS, TECHNICAL_REASONS, MENTAL_REASONS } from './styles'

export const STYLE_ENUM = z.enum(STYLE_OPTIONS)

export const FAILURE_REASON_ENUM = z.enum([
  ...PHYSICAL_REASONS,
  ...TECHNICAL_REASONS,
  ...MENTAL_REASONS,
])

export const HOLD_COLOR_ENUM = z.enum(ALL_HOLD_COLORS)

export const GRADE_SCALE_ENUM = z.enum(['font', 'v_scale', 'color_circuit'])

export const DISCIPLINE_ENUM = z.enum(['boulder', 'sport'])

export const OUTCOME_ENUM = z.enum(['Sent', 'Fail'])

export const AWKWARDNESS_ENUM = z.literal(1).or(z.literal(3)).or(z.literal(5))

export const TERRAIN_ENUM = z.enum([
  'Slab',
  'Vert',
  'Overhang',
  'Roof',
  'Dyno',
  'Crimp',
  'Sloper',
  'Pinch',
])

export const AWKWARDNESS_OPTIONS_ENUM = z.enum(['smooth', 'normal', 'awkward'])
