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
      api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          is_active: boolean
          name: string
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          is_active?: boolean
          name: string
          provider: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          is_active?: boolean
          name?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_settings: {
        Row: {
          id: string
          registration_open: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          registration_open?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          registration_open?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      host_settings: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      karaoke_instances: {
        Row: {
          coordinator_id: string
          created_at: string
          id: string
          instance_code: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          coordinator_id: string
          created_at?: string
          id?: string
          instance_code: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          coordinator_id?: string
          created_at?: string
          id?: string
          instance_code?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      performances: {
        Row: {
          cantor: string
          created_at: string
          id: string
          karaoke_instance_id: string | null
          musica: string
          nota_media: number | null
          status: string
          total_votos: number | null
          video_changed_at: string | null
          youtube_url: string | null
        }
        Insert: {
          cantor: string
          created_at?: string
          id?: string
          karaoke_instance_id?: string | null
          musica: string
          nota_media?: number | null
          status?: string
          total_votos?: number | null
          video_changed_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          cantor?: string
          created_at?: string
          id?: string
          karaoke_instance_id?: string | null
          musica?: string
          nota_media?: number | null
          status?: string
          total_votos?: number | null
          video_changed_at?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performances_karaoke_instance_id_fkey"
            columns: ["karaoke_instance_id"]
            isOneToOne: false
            referencedRelation: "karaoke_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          device_id: string
          id: string
          karaoke_instance_id: string | null
          nota: number
          performance_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          karaoke_instance_id?: string | null
          nota: number
          performance_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          karaoke_instance_id?: string | null
          nota?: number
          performance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_karaoke_instance_id_fkey"
            columns: ["karaoke_instance_id"]
            isOneToOne: false
            referencedRelation: "karaoke_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          id: string
          karaoke_instance_id: string | null
          priority: number
          registered_by: string | null
          singer_name: string
          song_title: string
          status: string
          times_sung: number
          youtube_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          karaoke_instance_id?: string | null
          priority?: number
          registered_by?: string | null
          singer_name: string
          song_title: string
          status?: string
          times_sung?: number
          youtube_url: string
        }
        Update: {
          created_at?: string
          id?: string
          karaoke_instance_id?: string | null
          priority?: number
          registered_by?: string | null
          singer_name?: string
          song_title?: string
          status?: string
          times_sung?: number
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_karaoke_instance_id_fkey"
            columns: ["karaoke_instance_id"]
            isOneToOne: false
            referencedRelation: "karaoke_instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_instance_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_coordinator: { Args: never; Returns: boolean }
      is_host: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "host" | "admin" | "coordinator"
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
      app_role: ["host", "admin", "coordinator"],
    },
  },
} as const
