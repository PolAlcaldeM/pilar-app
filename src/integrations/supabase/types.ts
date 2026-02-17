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
  public: {
    Tables: {
      daily_habit_logs: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed: boolean
          created_at?: string
          date?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "user_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reflections: {
        Row: {
          content: string | null
          created_at: string
          date: string
          id: string
          pilar_id: number
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          date?: string
          id?: string
          pilar_id: number
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          date?: string
          id?: string
          pilar_id?: number
          user_id?: string
        }
        Relationships: []
      }
      letters: {
        Row: {
          content: string
          created_at: string
          from_user_id: string
          id: string
          is_public: boolean
          is_read: boolean
          to_user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          from_user_id: string
          id?: string
          is_public?: boolean
          is_read?: boolean
          to_user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_user_id?: string
          id?: string
          is_public?: boolean
          is_read?: boolean
          to_user_id?: string
        }
        Relationships: []
      }
      love_notifications: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          onboarding_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          onboarding_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          onboarding_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      relationship_settings: {
        Row: {
          created_at: string
          habit_review_time: string
          id: string
          partner1_name: string
          partner2_name: string
          relationship_id: string
          relationship_start_date: string
          spiritual_mode: boolean
          updated_at: string
          weekly_review_day: number
        }
        Insert: {
          created_at?: string
          habit_review_time?: string
          id?: string
          partner1_name: string
          partner2_name: string
          relationship_id: string
          relationship_start_date: string
          spiritual_mode?: boolean
          updated_at?: string
          weekly_review_day?: number
        }
        Update: {
          created_at?: string
          habit_review_time?: string
          id?: string
          partner1_name?: string
          partner2_name?: string
          relationship_id?: string
          relationship_start_date?: string
          spiritual_mode?: boolean
          updated_at?: string
          weekly_review_day?: number
        }
        Relationships: [
          {
            foreignKeyName: "relationship_settings_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: true
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          created_at: string
          id: string
          status: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      shared_events: {
        Row: {
          created_at: string
          created_by: string
          date: string
          event_type: string
          id: string
          relationship_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          event_type?: string
          id?: string
          relationship_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          event_type?: string
          id?: string
          relationship_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_events_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      user_habits: {
        Row: {
          best_streak: number
          created_at: string
          current_streak: number
          habit_name: string
          id: string
          is_active: boolean
          is_custom: boolean
          user_id: string
        }
        Insert: {
          best_streak?: number
          created_at?: string
          current_streak?: number
          habit_name: string
          id?: string
          is_active?: boolean
          is_custom?: boolean
          user_id: string
        }
        Update: {
          best_streak?: number
          created_at?: string
          current_streak?: number
          habit_name?: string
          id?: string
          is_active?: boolean
          is_custom?: boolean
          user_id?: string
        }
        Relationships: []
      }
      weekly_summaries: {
        Row: {
          created_at: string
          id: string
          relationship_id: string
          summary_text: string | null
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          relationship_id: string
          summary_text?: string | null
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          relationship_id?: string
          summary_text?: string | null
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_summaries_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
