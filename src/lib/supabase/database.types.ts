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
    PostgrestVersion: "14.5"
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
      department_items: {
        Row: {
          added_at: string
          added_by: string | null
          deleted_at: string | null
          department_id: string
          id: string
          item_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          deleted_at?: string | null
          department_id: string
          id?: string
          item_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          deleted_at?: string | null
          department_id?: string
          id?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_items_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      item_groups: {
        Row: {
          code: string | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      item_subgroups: {
        Row: {
          code: string | null
          created_at: string
          deleted_at: string | null
          group_id: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          group_id: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          group_id?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_subgroups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "item_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          barcode: string
          code: string
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          price: number
          subgroup_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          barcode: string
          code: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          price?: number
          subgroup_id: string
          unit: string
          updated_at?: string
        }
        Update: {
          barcode?: string
          code?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          price?: number
          subgroup_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_subgroup_id_fkey"
            columns: ["subgroup_id"]
            isOneToOne: false
            referencedRelation: "item_subgroups"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_queue_items: {
        Row: {
          added_by: string | null
          barcode: string
          department_id: string
          id: string
          item_code: string
          item_group: string
          item_name: string
          pending_since: string
          quantity: number
        }
        Insert: {
          added_by?: string | null
          barcode: string
          department_id: string
          id?: string
          item_code: string
          item_group?: string
          item_name: string
          pending_since?: string
          quantity: number
        }
        Update: {
          added_by?: string | null
          barcode?: string
          department_id?: string
          id?: string
          item_code?: string
          item_group?: string
          item_name?: string
          pending_since?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "pending_queue_items_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department_id: string | null
          email: string
          full_name: string | null
          id: string
          role: string
          username: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string
          username: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_batch_items: {
        Row: {
          barcode: string
          batch_id: string
          id: string
          item_code: string
          item_name: string
          quantity: number
          verified: boolean
        }
        Insert: {
          barcode: string
          batch_id: string
          id?: string
          item_code: string
          item_name: string
          quantity: number
          verified?: boolean
        }
        Update: {
          barcode?: string
          batch_id?: string
          id?: string
          item_code?: string
          item_name?: string
          quantity?: number
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "scan_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "scan_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_batches: {
        Row: {
          department_id: string
          id: string
          mode: string
          saved_at: string
          user_id: string
        }
        Insert: {
          department_id: string
          id?: string
          mode: string
          saved_at?: string
          user_id: string
        }
        Update: {
          department_id?: string
          id?: string
          mode?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_batches_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_departments: {
        Row: {
          created_at: string
          department_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_departments_user_id_fkey"
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
      is_admin: { Args: never; Returns: boolean }
      is_department_manager: { Args: { dept: string }; Returns: boolean }
      manager_can_view_profile: { Args: { target: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      user_department_id: { Args: never; Returns: string }
      user_has_department: { Args: { dept: string }; Returns: boolean }
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
