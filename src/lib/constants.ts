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

export const TERRAIN_OPTIONS = ['Slab', 'Vert', 'Overhang', 'Roof', 'Dyno', 'Crimp', 'Sloper', 'Pinch'] as const
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
      return 'Flow State'
    case 2:
      return 'Smooth'
    case 3:
      return 'Normal'
    case 4:
      return 'Awkward'
    case 5:
      return 'Sketchy'
    default:
      return ''
  }
}

export const DEFAULT_LOCATION = 'My Gym'

// Tag extraction (Phase 31) - happens async after climb save (EXTR-03)
export const DAILY_TAG_LIMIT = 50
export const TAG_EXTRACTION_TIMEOUT_MS = 5000 // Edge Function invocation timeout
