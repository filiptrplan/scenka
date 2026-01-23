export const DAILY_TAG_LIMIT = 50

export const TAG_EXTRACTION_TIMEOUT_MS = 20000

export const DEFAULT_LOCATION = 'My Gym'

export const AWKWARDNESS_OPTIONS = ['smooth', 'normal', 'awkward'] as const

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

export function normalizeAwkwardnessValue(value: number): 1 | 3 | 5 {
  if (value <= 2) {
    return 1
  }
  if (value === 3) {
    return 3
  }
  return 5
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

export const QUERY_LIMITS = {
  PATTERN_ANALYSIS_CLIMBS: 100,
  RECENT_CLIMBS_FOR_AI: 30,
  COACH_MESSAGES: 20,
  LATEST_RECOMMENDATIONS: 1,
  TOP_FAILURE_REASONS: 5,
  TOP_STYLE_WEAKNESSES: 5,
  WEEKLY_CLIMBS: 12,
  RECENT_SENDS: 10,
} as const

export const QUERY_CONFIG = {
  STALE_TIME: {
    SHORT: 5 * 60 * 1000,
    MEDIUM: 60 * 60 * 1000,
    LONG: 24 * 60 * 60 * 1000,
  },
  GC_TIME: {
    SHORT: 30 * 1000,
    MEDIUM: 5 * 60 * 1000,
    LONG: 7 * 24 * 60 * 60 * 1000,
  },
} as const
