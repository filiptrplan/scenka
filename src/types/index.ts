export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      climbs: {
        Row: {
          awkwardness: number
          climb_type: string
          created_at: string
          failure_reasons: string[]
          grade_scale: string
          grade_value: string
          id: string
          location: string
          notes: string | null
          outcome: string
          style: string[]
          user_id: string
        }
        Insert: {
          awkwardness: number
          climb_type: string
          created_at?: string
          failure_reasons?: string[]
          grade_scale: string
          grade_value: string
          id?: string
          location: string
          notes?: string | null
          outcome: string
          style?: string[]
          user_id: string
        }
        Update: {
          awkwardness?: number
          climb_type?: string
          created_at?: string
          failure_reasons?: string[]
          grade_scale?: string
          grade_value?: string
          id?: string
          location?: string
          notes?: string | null
          outcome?: string
          style?: string[]
          user_id?: string
        }
      }
      profiles: {
        Row: {
          id: string
          preferred_discipline: string
          preferred_grade_scale: string
          updated_at: string
        }
        Insert: {
          id: string
          preferred_discipline?: string
          preferred_grade_scale?: string
          updated_at?: string
        }
        Update: {
          id?: string
          preferred_discipline?: string
          preferred_grade_scale?: string
          updated_at?: string
        }
      }
    }
  }
}

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
export type TablesRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type GradeScale = 'font' | 'v_scale' | 'color_circuit'

export type Discipline = 'boulder' | 'sport'

export type Outcome = 'Sent' | 'Fail'

export type Style = 'Slab' | 'Vert' | 'Overhang' | 'Roof' | 'Dyno' | 'Crimp' | 'Sloper' | 'Pinch'

export type PhysicalReason = 'Pumped' | 'Finger Strength' | 'Core' | 'Power'
export type TechnicalReason = 'Bad Feet' | 'Body Position' | 'Beta Error' | 'Precision'
export type MentalReason = 'Fear' | 'Commitment' | 'Focus'

export type FailureReason = PhysicalReason | TechnicalReason | MentalReason

export type Climb = TablesRow<'climbs'> & {
  style: Style[]
  failure_reasons: FailureReason[]
}

export interface Profile {
  id: string
  preferred_grade_scale: GradeScale
  preferred_discipline: Discipline
  updated_at: string
}
