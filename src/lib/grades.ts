import type { GradeScale } from '@/types'

export const FONT_GRADES = [
  '3',
  '3a',
  '4',
  '4a',
  '4b',
  '4c',
  '5',
  '5a',
  '5b',
  '5c',
  '6a',
  '6a+',
  '6b',
  '6b+',
  '6c',
  '6c+',
  '7a',
  '7a+',
  '7b',
  '7b+',
  '7c',
  '7c+',
  '8a',
  '8a+',
  '8b',
  '8b+',
  '8c',
  '8c+',
  '9a',
  '9a+',
  '9b',
  '9b+',
  '9c',
]

export const V_SCALE_GRADES = [
  'VB',
  'V0',
  'V1',
  'V2',
  'V3',
  'V4',
  'V5',
  'V6',
  'V7',
  'V8',
  'V9',
  'V10',
  'V11',
  'V12',
  'V13',
  'V14',
  'V15',
  'V16',
  'V17',
]

export const COLOR_CIRCUIT = [
  {
    name: 'Teal',
    letter: 'T',
    color: 'bg-teal-500',
    textColor: 'text-teal-400',
    description: 'Up to 3',
  },
  {
    name: 'Pink',
    letter: 'P',
    color: 'bg-pink-500',
    textColor: 'text-pink-400',
    description: '3 to 5a',
  },
  {
    name: 'Green',
    letter: 'G',
    color: 'bg-green-500',
    textColor: 'text-green-400',
    description: '5a to 6a',
  },
  {
    name: 'Blue',
    letter: 'B',
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    description: '6a to 6c',
  },
  {
    name: 'Yellow',
    letter: 'Y',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    description: '6b+ to 7a+',
  },
  {
    name: 'Red',
    letter: 'R',
    color: 'bg-red-500',
    textColor: 'text-red-400',
    description: '7a to 7c',
  },
  {
    name: 'Black',
    letter: 'K',
    color: 'bg-neutral-950 border border-neutral-700',
    textColor: 'text-neutral-400',
    description: '7b+ to 8c+',
  },
]

export function getGradesForScale(scale: GradeScale): string[] {
  switch (scale) {
    case 'font':
      return FONT_GRADES
    case 'v_scale':
      return V_SCALE_GRADES
    case 'color_circuit':
      return COLOR_CIRCUIT.map((c) => c.name)
    default:
      return []
  }
}

export function getNumericValue(scale: GradeScale, grade: string): number {
  switch (scale) {
    case 'font':
      return FONT_GRADES.indexOf(grade) + 1
    case 'v_scale':
      return V_SCALE_GRADES.indexOf(grade) + 1
    case 'color_circuit':
      return COLOR_CIRCUIT.findIndex((c) => c.name === grade) + 1
    default:
      return 0
  }
}

export const COLOR_MAPPINGS: Record<string, number> = {
  Teal: 1,
  Pink: 2,
  Green: 3,
  Blue: 4,
  Yellow: 5,
  Red: 6,
  Black: 7,
}

// Convert any grade to a normalized 1-100 scale for comparison
export function normalizeGrade(scale: GradeScale, grade: string): number {
  const numericValue = getNumericValue(scale, grade)
  if (numericValue === 0) {return 0}

  switch (scale) {
    case 'font':
      // Font: 3 (1) → 9c (37) → normalize to 1-100
      return Math.round((numericValue / FONT_GRADES.length) * 100)
    case 'v_scale':
      // V-Scale: VB (1) → V17 (18) → normalize to 1-100
      return Math.round((numericValue / V_SCALE_GRADES.length) * 100)
    case 'color_circuit':
      // Color: Teal (1) → Black (7) → normalize to 1-100
      return Math.round((numericValue / COLOR_CIRCUIT.length) * 100)
    default:
      return 0
  }
}

// Convert normalized grade to difficulty bucket
export function getDifficultyBucket(normalizedGrade: number): string {
  if (normalizedGrade === 0) {return 'Unknown'}
  if (normalizedGrade <= 25) {return 'Beginner'}
  if (normalizedGrade <= 50) {return 'Intermediate'}
  if (normalizedGrade <= 75) {return 'Advanced'}
  return 'Elite'
}

// Get ordered list of all buckets
export function getAllGradeBuckets(): string[] {
  return ['Beginner', 'Intermediate', 'Advanced', 'Elite']
}
