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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_analytics: {
        Row: {
          ad_type: string
          countdown_value: number | null
          created_at: string
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          ad_type?: string
          countdown_value?: number | null
          created_at?: string
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          ad_type?: string
          countdown_value?: number | null
          created_at?: string
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      allergen_feedback: {
        Row: {
          confirmed_allergens: string[]
          created_at: string
          detected_allergens: string[]
          dish_name: string
          false_positives: string[]
          feedback_type: string
          id: string
          ingredients: string[] | null
          is_processed: boolean
          missed_allergens: string[]
          user_id: string | null
        }
        Insert: {
          confirmed_allergens?: string[]
          created_at?: string
          detected_allergens?: string[]
          dish_name: string
          false_positives?: string[]
          feedback_type?: string
          id?: string
          ingredients?: string[] | null
          is_processed?: boolean
          missed_allergens?: string[]
          user_id?: string | null
        }
        Update: {
          confirmed_allergens?: string[]
          created_at?: string
          detected_allergens?: string[]
          dish_name?: string
          false_positives?: string[]
          feedback_type?: string
          id?: string
          ingredients?: string[] | null
          is_processed?: boolean
          missed_allergens?: string[]
          user_id?: string | null
        }
        Relationships: []
      }
      allergen_patterns: {
        Row: {
          allergen: string
          confidence_score: number
          created_at: string
          feedback_count: number
          id: string
          ingredient_pattern: string
          updated_at: string
        }
        Insert: {
          allergen: string
          confidence_score?: number
          created_at?: string
          feedback_count?: number
          id?: string
          ingredient_pattern: string
          updated_at?: string
        }
        Update: {
          allergen?: string
          confidence_score?: number
          created_at?: string
          feedback_count?: number
          id?: string
          ingredient_pattern?: string
          updated_at?: string
        }
        Relationships: []
      }
      dishes: {
        Row: {
          allergens: string[] | null
          allergens_translations: Json | null
          created_at: string
          description: string | null
          dietary_info: string[] | null
          dietary_info_translations: Json | null
          id: string
          ingredients: string[] | null
          ingredients_translations: Json | null
          is_available: boolean | null
          menu_id: string
          name: string
          name_translations: Json | null
          price: string | null
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          allergens_translations?: Json | null
          created_at?: string
          description?: string | null
          dietary_info?: string[] | null
          dietary_info_translations?: Json | null
          id?: string
          ingredients?: string[] | null
          ingredients_translations?: Json | null
          is_available?: boolean | null
          menu_id: string
          name: string
          name_translations?: Json | null
          price?: string | null
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          allergens_translations?: Json | null
          created_at?: string
          description?: string | null
          dietary_info?: string[] | null
          dietary_info_translations?: Json | null
          id?: string
          ingredients?: string[] | null
          ingredients_translations?: Json | null
          is_available?: boolean | null
          menu_id?: string
          name?: string
          name_translations?: Json | null
          price?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dishes_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_scans: {
        Row: {
          allergies_checked: string[] | null
          id: string
          menu_id: string
          preferences_checked: string[] | null
          scanned_at: string
          scanner_user_id: string | null
        }
        Insert: {
          allergies_checked?: string[] | null
          id?: string
          menu_id: string
          preferences_checked?: string[] | null
          scanned_at?: string
          scanner_user_id?: string | null
        }
        Update: {
          allergies_checked?: string[] | null
          id?: string
          menu_id?: string
          preferences_checked?: string[] | null
          scanned_at?: string
          scanner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_scans_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_scans_scanner_user_id_fkey"
            columns: ["scanner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          business_user_id: string
          created_at: string
          id: string
          menu_data: Json | null
          menu_image_url: string | null
          qr_code: string
        }
        Insert: {
          business_user_id: string
          created_at?: string
          id?: string
          menu_data?: Json | null
          menu_image_url?: string | null
          qr_code: string
        }
        Update: {
          business_user_id?: string
          created_at?: string
          id?: string
          menu_data?: Json | null
          menu_image_url?: string | null
          qr_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_business_user_id_fkey"
            columns: ["business_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      preferences: {
        Row: {
          characteristics: string[] | null
          created_at: string
          id: string
          preference_type: string
          preference_value: string
          user_id: string
        }
        Insert: {
          characteristics?: string[] | null
          created_at?: string
          id?: string
          preference_type: string
          preference_value: string
          user_id: string
        }
        Update: {
          characteristics?: string[] | null
          created_at?: string
          id?: string
          preference_type?: string
          preference_value?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_allergen_warnings: string[] | null
          created_at: string
          email: string
          id: string
          qr_color: string | null
          qr_position: string | null
          qr_text_above: string | null
          qr_text_below: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          business_allergen_warnings?: string[] | null
          created_at?: string
          email: string
          id: string
          qr_color?: string | null
          qr_position?: string | null
          qr_text_above?: string | null
          qr_text_below?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          business_allergen_warnings?: string[] | null
          created_at?: string
          email?: string
          id?: string
          qr_color?: string | null
          qr_position?: string | null
          qr_text_above?: string | null
          qr_text_below?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      scans: {
        Row: {
          created_at: string
          id: string
          scan_method: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          scan_method: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          scan_method?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      user_type: "eter" | "eetgever"
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
      app_role: ["admin", "user"],
      user_type: ["eter", "eetgever"],
    },
  },
} as const
