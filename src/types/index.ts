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
          hold_color: string | null
          id: string
          location: string
          notes: string | null
          outcome: string
          redemption_at: string | null
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
          hold_color?: string | null
          id?: string
          location: string
          notes?: string | null
          outcome: string
          redemption_at?: string | null
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
          hold_color?: string | null
          id?: string
          location?: string
          notes?: string | null
          outcome?: string
          redemption_at?: string | null
          style?: string[]
          user_id?: string
        }
      }
      profiles: {
        Row: {
          id: string
          preferred_discipline: string
          preferred_grade_scale: string
          home_gym: string | null
          onboarding_completed: boolean
          updated_at: string
          enabled_hold_colors: string[]
        }
        Insert: {
          id: string
          preferred_discipline?: string
          preferred_grade_scale?: string
          home_gym?: string | null
          onboarding_completed?: boolean
          updated_at?: string
          enabled_hold_colors?: string[]
        }
        Update: {
          id?: string
          preferred_discipline?: string
          preferred_grade_scale?: string
          home_gym?: string | null
          onboarding_completed?: boolean
          updated_at?: string
          enabled_hold_colors?: string[]
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

export type Style = 'Slab' | 'Vert' | 'Overhang' | 'Roof' | 'Dyno' | 'Crimp' | 'Sloper' | 'Pinch' | 'Compression' | 'Tension'

export type PhysicalReason = 'Pumped' | 'Finger Strength' | 'Core' | 'Power' | 'Flexibility' | 'Balance' | 'Endurance'
export type TechnicalReason =
  | 'Bad Feet'
  | 'Body Position'
  | 'Beta Error'
  | 'Precision'
  | 'Precision (Feet)'
  | 'Precision (Hands)'
  | 'Coordination (Hands)'
  | 'Coordination (Feet)'
  | 'Foot Swap'
  | 'Heel Hook'
  | 'Toe Hook'
  | 'Rockover'
  | 'Pistol Squat'
  | 'Drop Knee'
  | 'Twist Lock'
  | 'Flagging'
  | 'Dyno'
  | 'Deadpoint'
  | 'Latch'
  | 'Mantle'
  | 'Undercling'
  | 'Gaston'
  | 'Match'
  | 'Cross'
export type MentalReason = 'Fear' | 'Commitment' | 'Focus'

export type FailureReason = PhysicalReason | TechnicalReason | MentalReason

export type HoldColor = 'red' | 'green' | 'blue' | 'yellow' | 'black' | 'white' | 'orange' | 'purple' | 'pink'

export type Climb = TablesRow<'climbs'> & {
  style: Style[]
  failure_reasons: FailureReason[]
  hold_color?: HoldColor
}

export interface Profile {
  id: string
  preferred_grade_scale: GradeScale
  preferred_discipline: Discipline
  home_gym: string | null
  onboarding_completed: boolean
  updated_at: string
  enabled_hold_colors: HoldColor[]
  close_logger_after_add: boolean
}
