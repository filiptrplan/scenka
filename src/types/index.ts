export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_usage: {
        Row: {
          completion_tokens: number
          cost_usd: number
          created_at: string
          endpoint: string
          id: string
          model: string
          prompt_tokens: number
          time_window_start: string
          total_tokens: number
          user_id: string
        }
        Insert: {
          completion_tokens: number
          cost_usd?: number
          created_at?: string
          endpoint: string
          id?: string
          model: string
          prompt_tokens: number
          time_window_start: string
          total_tokens: number
          user_id: string
        }
        Update: {
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          endpoint?: string
          id?: string
          model?: string
          prompt_tokens?: number
          time_window_start?: string
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
          tags_extracted_at: string | null
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
          tags_extracted_at?: string | null
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
          tags_extracted_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          content: string
          context: Json | null
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          context?: Json | null
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          context?: Json | null
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_recommendations: {
        Row: {
          content: Json
          created_at: string
          error_message: string | null
          id: string
          is_cached: boolean
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          is_cached?: boolean
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          is_cached?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          climbing_context: string | null
          close_logger_after_add: boolean
          enabled_hold_colors: string[]
          home_gym: string | null
          id: string
          onboarding_completed: boolean
          preferred_discipline: string
          preferred_grade_scale: string
          updated_at: string
        }
        Insert: {
          climbing_context?: string | null
          close_logger_after_add?: boolean
          enabled_hold_colors?: string[]
          home_gym?: string | null
          id: string
          onboarding_completed?: boolean
          preferred_discipline?: string
          preferred_grade_scale?: string
          updated_at?: string
        }
        Update: {
          climbing_context?: string | null
          close_logger_after_add?: boolean
          enabled_hold_colors?: string[]
          home_gym?: string | null
          id?: string
          onboarding_completed?: boolean
          preferred_discipline?: string
          preferred_grade_scale?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_limits: {
        Row: {
          chat_count: number
          limit_date: string
          rec_count: number
          tag_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_count?: number
          limit_date?: string
          rec_count?: number
          tag_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_count?: number
          limit_date?: string
          rec_count?: number
          tag_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_chat_count: { Args: { p_user_id: string }; Returns: undefined }
      increment_rec_count: { Args: { p_user_id: string }; Returns: undefined }
      increment_tag_count: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
