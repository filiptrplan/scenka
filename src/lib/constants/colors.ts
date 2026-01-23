import type { HoldColor } from '@/types'

export const ALL_HOLD_COLORS = [
  'red',
  'green',
  'blue',
  'yellow',
  'black',
  'white',
  'orange',
  'purple',
  'pink',
  'teal',
] as const satisfies readonly HoldColor[]

export const HOLD_COLOR_MAP: Record<HoldColor, string> = {
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  yellow: '#eab308',
  black: '#18181b',
  white: '#fafafa',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
  teal: '#14b8a6',
}

export const DEFAULT_COLORS: HoldColor[] = [
  'red',
  'green',
  'blue',
  'yellow',
  'orange',
  'purple',
  'pink',
]
