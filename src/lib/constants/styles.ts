import type { Style, FailureReason, Outcome } from '@/types'

export const STYLE_OPTIONS = [
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
] as const satisfies readonly Style[]

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

export const PHYSICAL_REASONS = [
  'Pumped',
  'Finger Strength',
  'Core',
  'Power',
  'Flexibility',
  'Balance',
  'Endurance',
] as const satisfies readonly FailureReason[]

export const TECHNICAL_REASONS = [
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
] as const satisfies readonly FailureReason[]

export const MENTAL_REASONS = [
  'Fear',
  'Commitment',
  'Focus',
] as const satisfies readonly FailureReason[]

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
