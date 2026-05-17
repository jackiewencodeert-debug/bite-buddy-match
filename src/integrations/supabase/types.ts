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
      business_invites: {
        Row: {
          business_email: string | null
          business_name: string
          claimed_at: string | null
          claimed_by: string | null
          code: string
          created_at: string
          created_by: string | null
          id: string
          is_claimed: boolean
        }
        Insert: {
          business_email?: string | null
          business_name: string
          claimed_at?: string | null
          claimed_by?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_claimed?: boolean
        }
        Update: {
          business_email?: string | null
          business_name?: string
          claimed_at?: string | null
          claimed_by?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_claimed?: boolean
        }
        Relationships: []
      }
      curated_dishes: {
        Row: {
          allergens: string[] | null
          category: string | null
          created_at: string | null
          description: string | null
          dietary_tags: string[] | null
          id: string
          ingredients: string[] | null
          menu_id: string | null
          name: string
          price_eur: number | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          allergens?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          ingredients?: string[] | null
          menu_id?: string | null
          name: string
          price_eur?: number | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          allergens?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          ingredients?: string[] | null
          menu_id?: string | null
          name?: string
          price_eur?: number | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curated_dishes_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "curated_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      curated_menus: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string | null
          restaurant_id: string | null
          source_type: string | null
          source_url: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string | null
          restaurant_id?: string | null
          source_type?: string | null
          source_url?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string | null
          restaurant_id?: string | null
          source_type?: string | null
          source_url?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curated_menus_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_aliases: {
        Row: {
          alias_name: string
          dish_id: string | null
          id: string
        }
        Insert: {
          alias_name: string
          dish_id?: string | null
          id?: string
        }
        Update: {
          alias_name?: string
          dish_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dish_aliases_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "curated_dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          allergens: string[] | null
          allergens_translations: Json | null
          category: string | null
          created_at: string
          cross_contamination_risk: string[] | null
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
          category?: string | null
          created_at?: string
          cross_contamination_risk?: string[] | null
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
          category?: string | null
          created_at?: string
          cross_contamination_risk?: string[] | null
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
      favorites: {
        Row: {
          created_at: string
          dish_id: string
          id: string
          menu_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dish_id: string
          id?: string
          menu_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dish_id?: string
          id?: string
          menu_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_allergens: {
        Row: {
          allergens: string[]
          created_at: string | null
          id: number
          ingredient_aliases: string[] | null
          ingredient_name: string
          notes: string | null
          verified: boolean | null
        }
        Insert: {
          allergens: string[]
          created_at?: string | null
          id?: number
          ingredient_aliases?: string[] | null
          ingredient_name: string
          notes?: string | null
          verified?: boolean | null
        }
        Update: {
          allergens?: string[]
          created_at?: string | null
          id?: number
          ingredient_aliases?: string[] | null
          ingredient_name?: string
          notes?: string | null
          verified?: boolean | null
        }
        Relationships: []
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
          severity: string | null
          user_id: string
        }
        Insert: {
          characteristics?: string[] | null
          created_at?: string
          id?: string
          preference_type: string
          preference_value: string
          severity?: string | null
          user_id: string
        }
        Update: {
          characteristics?: string[] | null
          created_at?: string
          id?: string
          preference_type?: string
          preference_value?: string
          severity?: string | null
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
      restaurants: {
        Row: {
          address: string | null
          city: string
          country: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string | null
          verified: boolean | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website_url?: string | null
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
      claim_invite_code: { Args: { invite_code: string }; Returns: boolean }
      fuzzy_dish_match: {
        Args: { search_text: string; threshold?: number }
        Returns: {
          allergens: string[]
          description: string
          id: string
          ingredients: string[]
          name: string
          similarity_score: number
        }[]
      }
      get_allergen_patterns: {
        Args: never
        Returns: {
          allergen: string
          confidence_score: number
          ingredient_pattern: string
        }[]
      }
      get_public_menu: {
        Args: { menu_qr_code: string }
        Returns: {
          created_at: string
          dishes: Json
          menu_data: Json
          menu_id: string
          menu_image_url: string
          qr_code: string
        }[]
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_admin: { Args: { uid: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      verify_invite_code: {
        Args: { invite_code: string }
        Returns: {
          business_name: string
          code: string
          id: string
          is_claimed: boolean
        }[]
      }
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
