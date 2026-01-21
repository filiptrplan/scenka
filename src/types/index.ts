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
          climbing_context: string | null
        }
        Insert: {
          id: string
          preferred_discipline?: string
          preferred_grade_scale?: string
          home_gym?: string | null
          onboarding_completed?: boolean
          updated_at?: string
          enabled_hold_colors?: string[]
          climbing_context?: string | null
        }
        Update: {
          id?: string
          preferred_discipline?: string
          preferred_grade_scale?: string
          home_gym?: string | null
          onboarding_completed?: boolean
          updated_at?: string
          enabled_hold_colors?: string[]
          climbing_context?: string | null
        }
      }
      coach_recommendations: {
        Row: {
          id: string
          user_id: string
          created_at: string
          content: Json
          is_cached: boolean
          error_message: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          content?: Json
          is_cached?: boolean
          error_message?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          content?: Json
          is_cached?: boolean
          error_message?: string | null
        }
      }
      coach_messages: {
        Row: {
          id: string
          user_id: string
          created_at: string
          role: 'user' | 'assistant'
          content: string
          context: Json
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          role: 'user' | 'assistant'
          content: string
          context?: Json
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          role?: 'user' | 'assistant'
          content?: string
          context?: Json
        }
      }
      coach_api_usage: {
        Row: {
          id: string
          user_id: string
          created_at: string
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          cost_usd: number
          model: string
          endpoint: string
          time_window_start: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          cost_usd: number
          model: string
          endpoint: string
          time_window_start?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          prompt_tokens?: number
          completion_tokens?: number
          total_tokens?: number
          cost_usd?: number
          model?: string
          endpoint?: string
          time_window_start?: string
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

export type TerrainType = 'Slab' | 'Vert' | 'Overhang' | 'Roof' | 'Dyno' | 'Crimp' | 'Sloper' | 'Pinch'

export type AwkwardnessLevel = 'smooth' | 'normal' | 'awkward'

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

export type HoldColor = 'red' | 'green' | 'blue' | 'yellow' | 'black' | 'white' | 'orange' | 'purple' | 'pink' | 'teal'

// Pattern Analysis Types (for AI Coach)
export interface FailurePatterns {
  most_common_failure_reasons: Array<{
    reason: string
    count: number
    percentage: number
  }>
}

export interface StyleWeaknesses {
  struggling_styles: Array<{
    style: string
    fail_count: number
    total_attempts: number
    fail_rate: number
  }>
}

export interface ClimbingFrequency {
  climbs_per_week: Array<{
    week: string
    count: number
  }>
  climbs_per_month: number
  avg_climbs_per_session: number
}

export interface RecentSuccesses {
  recent_sends: Climb[]
  grade_progression: Array<{
    grade: string
    date: string
  }>
  redemption_count: number
}

export interface PatternAnalysis {
  failure_patterns: FailurePatterns
  style_weaknesses: StyleWeaknesses
  climbing_frequency: ClimbingFrequency
  recent_successes: RecentSuccesses
}

// AI Coach Types (Privacy-Safe for External APIs)
export interface AnonymizedClimb {
  location: string
  grade_scale: string
  grade_value: string
  climb_type: string
  style: Style[]
  outcome: string
  awkwardness: number
  failure_reasons: FailureReason[]
  notes?: string | null
  date: string
}

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
  climbing_context: string | null
}
