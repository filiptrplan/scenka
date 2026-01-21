import type { Style, FailureReason, Outcome } from '@/types'

export const STYLE_OPTIONS: Style[] = [
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
]

export const TERRAIN_OPTIONS = [
  'Slab',
  'Vert',
  'Overhang',
  'Roof',
  'Dyno',
  'Crimp',
  'Sloper',
  'Pinch',
] as const
export const AWKWARDNESS_OPTIONS = ['smooth', 'normal', 'awkward'] as const

export const PHYSICAL_REASONS: FailureReason[] = [
  'Pumped',
  'Finger Strength',
  'Core',
  'Power',
  'Flexibility',
  'Balance',
  'Endurance',
]

export const TECHNICAL_REASONS: FailureReason[] = [
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
]

export const MENTAL_REASONS: FailureReason[] = ['Fear', 'Commitment', 'Focus']

export function getFailureReasons(outcome: Outcome): FailureReason[] {
  if (outcome === 'Fail') {
    return [...PHYSICAL_REASONS, ...TECHNICAL_REASONS, ...MENTAL_REASONS]
  }
  return [
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
    'Pumped',
    'Finger Strength',
    'Core',
    'Power',
    'Flexibility',
    'Balance',
    'Endurance',
    'Focus',
    'Commitment',
  ]
}

export function getAwkwardnessLabel(value: number): string {
  switch (value) {
    case 1:
      return 'Smooth'
    case 3:
      return 'Normal'
    case 5:
      return 'Awkward'
    default:
      return ''
  }
}

export const AWKWARDNESS_VALUE_MAPPING: Record<number, 'smooth' | 'normal' | 'awkward'> = {
  1: 'smooth',
  3: 'normal',
  5: 'awkward',
}

export const AWKWARDNESS_LABEL_TO_VALUE: Record<string, number> = {
  smooth: 1,
  normal: 3,
  awkward: 5,
}

// Normalize database awkwardness value to valid 1, 3, or 5
// Maps 1-2 → 1 (smooth), 3 → 3 (normal), 4-5 → 5 (awkward)
export function normalizeAwkwardnessValue(value: number): 1 | 3 | 5 {
  if (value <= 2) return 1
  if (value === 3) return 3
  return 5
}

export const DEFAULT_LOCATION = 'My Gym'

// Tag extraction (Phase 31) - happens async after climb save (EXTR-03)
export const DAILY_TAG_LIMIT = 50
export const TAG_EXTRACTION_TIMEOUT_MS = 20000 // Edge Function invocation timeout
