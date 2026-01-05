export type GradeScale = 'font' | 'v_scale' | 'color_circuit'

export type Discipline = 'boulder' | 'sport'

export type Outcome = 'Sent' | 'Fail'

export type Style =
  | 'Slab'
  | 'Vert'
  | 'Overhang'
  | 'Roof'
  | 'Dyno'
  | 'Crimp'
  | 'Sloper'
  | 'Pinch'

export type PhysicalReason = 'Pumped' | 'Finger Strength' | 'Core' | 'Power'
export type TechnicalReason = 'Bad Feet' | 'Body Position' | 'Beta Error' | 'Precision'
export type MentalReason = 'Fear' | 'Commitment' | 'Focus'

export type FailureReason = PhysicalReason | TechnicalReason | MentalReason

export interface Climb {
  id: string
  user_id: string
  created_at: string
  location: string
  climb_type: Discipline
  grade_scale: GradeScale
  grade_value: string
  style: Style[]
  outcome: Outcome
  awkwardness: number
  failure_reasons: FailureReason[]
  notes?: string
}

export interface CreateClimbInput {
  location: string
  climb_type: Discipline
  grade_scale: GradeScale
  grade_value: string
  style: Style[]
  outcome: Outcome
  awkwardness: number
  failure_reasons: FailureReason[]
  notes?: string
}

export interface Profile {
  id: string
  preferred_grade_scale: GradeScale
  preferred_discipline: Discipline
  updated_at: string
}
