// Generated from the live Supabase project (uvgekzergvtbvvhvuyyh).
// Regenerate after every migration:
//   supabase gen types typescript --project-id uvgekzergvtbvvhvuyyh > src/lib/supabase/types.ts
// or via the Supabase MCP `generate_typescript_types` tool.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          ip: unknown
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: number
          ip?: unknown
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: number
          ip?: unknown
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_assignments: {
        Row: {
          campaign_id: string
          created_at: string
          daily_target: number | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          daily_target?: number | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          daily_target?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assignments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_fields: {
        Row: {
          campaign_id: string
          field_type: string
          id: string
          is_required: boolean
          key: string
          label: string
          options: Json | null
          show_in_list: boolean
          sort_order: number
        }
        Insert: {
          campaign_id: string
          field_type: string
          id?: string
          is_required?: boolean
          key: string
          label: string
          options?: Json | null
          show_in_list?: boolean
          sort_order?: number
        }
        Update: {
          campaign_id?: string
          field_type?: string
          id?: string
          is_required?: boolean
          key?: string
          label?: string
          options?: Json | null
          show_in_list?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_fields_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audience: string
          call_days: number[]
          call_window_end: string
          call_window_start: string
          client_id: string
          code: string
          created_at: string
          dpa_reference: string | null
          id: string
          is_active: boolean
          market: string
          max_attempts: number
          min_hours_between_attempts: number
          name: string
          objection_handling_md: string | null
          opening_disclosure: string | null
          requires_ctps_screening: boolean
          requires_offshore_disclosure: boolean
          requires_tps_screening: boolean
          requires_us_dnc_screening: boolean
          risk_tier: string
          screening_max_age_days: number
          script_md: string | null
          vertical: string
          vertical_preset_overridden: boolean
        }
        Insert: {
          audience: string
          call_days?: number[]
          call_window_end?: string
          call_window_start?: string
          client_id: string
          code: string
          created_at?: string
          dpa_reference?: string | null
          id?: string
          is_active?: boolean
          market: string
          max_attempts?: number
          min_hours_between_attempts?: number
          name: string
          objection_handling_md?: string | null
          opening_disclosure?: string | null
          requires_ctps_screening?: boolean
          requires_offshore_disclosure?: boolean
          requires_tps_screening?: boolean
          requires_us_dnc_screening?: boolean
          risk_tier?: string
          screening_max_age_days?: number
          script_md?: string | null
          vertical?: string
          vertical_preset_overridden?: boolean
        }
        Update: {
          audience?: string
          call_days?: number[]
          call_window_end?: string
          call_window_start?: string
          client_id?: string
          code?: string
          created_at?: string
          dpa_reference?: string | null
          id?: string
          is_active?: boolean
          market?: string
          max_attempts?: number
          min_hours_between_attempts?: number
          name?: string
          objection_handling_md?: string | null
          opening_disclosure?: string | null
          requires_ctps_screening?: boolean
          requires_offshore_disclosure?: boolean
          requires_tps_screening?: boolean
          requires_us_dnc_screening?: boolean
          risk_tier?: string
          screening_max_age_days?: number
          script_md?: string | null
          vertical?: string
          vertical_preset_overridden?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contract_ref: string | null
          country: string | null
          created_at: string
          dpa_signed_on: string | null
          id: string
          is_active: boolean
          is_data_controller: boolean
          name: string
          notes: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contract_ref?: string | null
          country?: string | null
          created_at?: string
          dpa_signed_on?: string | null
          id?: string
          is_active?: boolean
          is_data_controller?: boolean
          name: string
          notes?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contract_ref?: string | null
          country?: string | null
          created_at?: string
          dpa_signed_on?: string | null
          id?: string
          is_active?: boolean
          is_data_controller?: boolean
          name?: string
          notes?: string | null
        }
        Relationships: []
      }
      credential_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event: string
          id: number
          ip: unknown
          note: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event: string
          id?: number
          ip?: unknown
          note?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event?: string
          id?: number
          ip?: unknown
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credential_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agent_code: string | null
          allow_login_outside_shift: boolean
          client_id: string | null
          created_at: string
          failed_login_count: number
          full_name: string
          id: string
          is_active: boolean
          joined_on: string | null
          last_login_at: string | null
          last_login_ip: unknown
          locked_until: string | null
          must_change_password: boolean
          password_set_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          team_id: string | null
          timezone: string
          totp_enabled: boolean
          updated_at: string
        }
        Insert: {
          agent_code?: string | null
          allow_login_outside_shift?: boolean
          client_id?: string | null
          created_at?: string
          failed_login_count?: number
          full_name: string
          id: string
          is_active?: boolean
          joined_on?: string | null
          last_login_at?: string | null
          last_login_ip?: unknown
          locked_until?: string | null
          must_change_password?: boolean
          password_set_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string | null
          timezone?: string
          totp_enabled?: boolean
          updated_at?: string
        }
        Update: {
          agent_code?: string | null
          allow_login_outside_shift?: boolean
          client_id?: string | null
          created_at?: string
          failed_login_count?: number
          full_name?: string
          id?: string
          is_active?: boolean
          joined_on?: string | null
          last_login_at?: string | null
          last_login_ip?: unknown
          locked_until?: string | null
          must_change_password?: boolean
          password_set_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string | null
          timezone?: string
          totp_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          team_lead_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          team_lead_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          team_lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_team_lead_id_fkey"
            columns: ["team_lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          ended_at: string | null
          ended_reason: string | null
          id: string
          ip: unknown
          last_seen_at: string | null
          started_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          ended_reason?: string | null
          id?: string
          ip?: unknown
          last_seen_at?: string | null
          started_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          ended_at?: string | null
          ended_reason?: string | null
          id?: string
          ip?: unknown
          last_seen_at?: string | null
          started_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_manager: { Args: never; Returns: boolean }
      my_team_members: { Args: never; Returns: string[] }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "ops_manager"
        | "team_lead"
        | "qa"
        | "agent"
        | "client_viewer"
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
    Enums: {
      app_role: [
        "super_admin",
        "ops_manager",
        "team_lead",
        "qa",
        "agent",
        "client_viewer",
      ],
    },
  },
} as const
