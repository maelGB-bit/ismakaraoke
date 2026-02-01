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
      coordinator_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          current_password: string | null
          email: string
          expires_at: string | null
          id: string
          instance_name: string | null
          interest: Database["public"]["Enums"]["subscription_interest"]
          ip_address: string | null
          last_access_at: string | null
          must_change_password: boolean | null
          name: string
          phone: string
          status: Database["public"]["Enums"]["coordinator_request_status"]
          temp_password: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          current_password?: string | null
          email: string
          expires_at?: string | null
          id?: string
          instance_name?: string | null
          interest: Database["public"]["Enums"]["subscription_interest"]
          ip_address?: string | null
          last_access_at?: string | null
          must_change_password?: boolean | null
          name: string
          phone: string
          status?: Database["public"]["Enums"]["coordinator_request_status"]
          temp_password?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          current_password?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          instance_name?: string | null
          interest?: Database["public"]["Enums"]["subscription_interest"]
          ip_address?: string | null
          last_access_at?: string | null
          must_change_password?: boolean | null
          name?: string
          phone?: string
          status?: Database["public"]["Enums"]["coordinator_request_status"]
          temp_password?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      event_archives: {
        Row: {
          created_at: string
          event_date: string
          id: string
          instance_code: string
          instance_name: string
          karaoke_instance_id: string | null
          rankings: Json
        }
        Insert: {
          created_at?: string
          event_date?: string
          id?: string
          instance_code: string
          instance_name: string
          karaoke_instance_id?: string | null
          rankings?: Json
        }
        Update: {
          created_at?: string
          event_date?: string
          id?: string
          instance_code?: string
          instance_name?: string
          karaoke_instance_id?: string | null
          rankings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "event_archives_karaoke_instance_id_fkey"
            columns: ["karaoke_instance_id"]
            isOneToOne: false
            referencedRelation: "karaoke_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      event_settings: {
        Row: {
          id: string
          karaoke_instance_id: string | null
          registration_open: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          karaoke_instance_id?: string | null
          registration_open?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          karaoke_instance_id?: string | null
          registration_open?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_settings_karaoke_instance_id_fkey"
            columns: ["karaoke_instance_id"]
            isOneToOne: false
            referencedRelation: "karaoke_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_carousel_slides: {
        Row: {
          created_at: string
          desktop_image_url: string
          id: string
          is_active: boolean
          link_url: string | null
          mobile_image_url: string | null
          sort_order: number
          tablet_image_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          desktop_image_url: string
          id?: string
          is_active?: boolean
          link_url?: string | null
          mobile_image_url?: string | null
          sort_order?: number
          tablet_image_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          desktop_image_url?: string
          id?: string
          is_active?: boolean
          link_url?: string | null
          mobile_image_url?: string | null
          sort_order?: number
          tablet_image_url?: string | null
          title?: string | null
          updated_at?: string
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
      instruction_video_settings: {
        Row: {
          current_video_index: number
          id: string
          insertion_frequency: number
          updated_at: string
        }
        Insert: {
          current_video_index?: number
          id?: string
          insertion_frequency?: number
          updated_at?: string
        }
        Update: {
          current_video_index?: number
          id?: string
          insertion_frequency?: number
          updated_at?: string
        }
        Relationships: []
      }
      instruction_videos: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
          youtube_url: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          youtube_url: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          youtube_url?: string
        }
        Relationships: []
      }
      karaoke_instances: {
        Row: {
          coordinator_id: string
          created_at: string
          expires_at: string | null
          id: string
          instance_code: string
          name: string
          status: string
          updated_at: string
          video_insertions_enabled: boolean
          video_insertions_mandatory: boolean
        }
        Insert: {
          coordinator_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          instance_code: string
          name: string
          status?: string
          updated_at?: string
          video_insertions_enabled?: boolean
          video_insertions_mandatory?: boolean
        }
        Update: {
          coordinator_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          instance_code?: string
          name?: string
          status?: string
          updated_at?: string
          video_insertions_enabled?: boolean
          video_insertions_mandatory?: boolean
        }
        Relationships: []
      }
      participants: {
        Row: {
          created_at: string
          device_id: string
          email: string
          id: string
          karaoke_instance_id: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          device_id: string
          email: string
          id?: string
          karaoke_instance_id: string
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          device_id?: string
          email?: string
          id?: string
          karaoke_instance_id?: string
          name?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_karaoke_instance_id_fkey"
            columns: ["karaoke_instance_id"]
            isOneToOne: false
            referencedRelation: "karaoke_instances"
            referencedColumns: ["id"]
          },
        ]
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
      site_contacts: {
        Row: {
          created_at: string
          icon: string
          id: string
          key: string
          label: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          key: string
          label: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          key?: string
          label?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      site_images: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          key: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          key: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_videos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
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
            referencedRelation: "monthly_ranking"
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
      youtube_search_cache: {
        Row: {
          created_at: string
          expires_at: string
          hit_count: number
          id: string
          results: Json
          search_query: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          hit_count?: number
          id?: string
          results: Json
          search_query: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          hit_count?: number
          id?: string
          results?: Json
          search_query?: string
        }
        Relationships: []
      }
    }
    Views: {
      compiled_participants: {
        Row: {
          email: string | null
          id: string | null
          instance_code: string | null
          instance_name: string | null
          karaoke_instance_id: string | null
          name: string | null
          phone: string | null
          registration_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_karaoke_instance_id_fkey"
            columns: ["karaoke_instance_id"]
            isOneToOne: false
            referencedRelation: "karaoke_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_ranking: {
        Row: {
          cantor: string | null
          created_at: string | null
          global_score: number | null
          id: string | null
          instance_code: string | null
          instance_name: string | null
          musica: string | null
          nota_media: number | null
          total_votos: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_email: { Args: never; Returns: string }
      get_user_instance_id: { Args: never; Returns: string }
      has_any_hosts: { Args: never; Returns: boolean }
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
      coordinator_request_status:
        | "pending"
        | "approved"
        | "expired"
        | "rejected"
        | "duplicado"
        | "deleted_by_admin"
      subscription_interest: "single_event" | "weekly" | "monthly" | "yearly"
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
      coordinator_request_status: [
        "pending",
        "approved",
        "expired",
        "rejected",
        "duplicado",
        "deleted_by_admin",
      ],
      subscription_interest: ["single_event", "weekly", "monthly", "yearly"],
    },
  },
} as const
