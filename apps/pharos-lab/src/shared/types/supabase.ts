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
      disclosures: {
        Row: {
          created_at: string
          disclosure_date: string
          id: string
          importance: string
          stock_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          disclosure_date: string
          id: string
          importance: string
          stock_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          disclosure_date?: string
          id?: string
          importance?: string
          stock_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "disclosures_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_summaries: {
        Row: {
          created_at: string
          disclosure_id: string
          id: string
          impact: string
          model: string
          points: string[]
          sentiment: string
        }
        Insert: {
          created_at?: string
          disclosure_id: string
          id?: string
          impact?: string
          model?: string
          points?: string[]
          sentiment: string
        }
        Update: {
          created_at?: string
          disclosure_id?: string
          id?: string
          impact?: string
          model?: string
          points?: string[]
          sentiment?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_summaries_disclosure_id_fkey"
            columns: ["disclosure_id"]
            isOneToOne: false
            referencedRelation: "disclosures"
            referencedColumns: ["id"]
          },
        ]
      }
      ohlcv: {
        Row: {
          close: number
          created_at: string
          high: number
          id: string
          low: number
          open: number
          stock_id: string
          trade_date: string
          volume: number
        }
        Insert: {
          close: number
          created_at?: string
          high: number
          id?: string
          low: number
          open: number
          stock_id: string
          trade_date: string
          volume?: number
        }
        Update: {
          close?: number
          created_at?: string
          high?: number
          id?: string
          low?: number
          open?: number
          stock_id?: string
          trade_date?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "ohlcv_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ranking_history: {
        Row: {
          created_at: string
          id: string
          rank: number
          rank_date: string
          stock_id: string
          total_score: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          rank: number
          rank_date: string
          stock_id: string
          total_score?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          rank?: number
          rank_date?: string
          stock_id?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ranking_history_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_scores: {
        Row: {
          created_at: string
          disclosure: number
          fundamental: number
          id: string
          institutional: number
          momentum: number
          score_descriptions: Json | null
          score_descriptions_old: string[] | null
          scored_at: string
          stock_id: string
          total: number
        }
        Insert: {
          created_at?: string
          disclosure: number
          fundamental: number
          id?: string
          institutional: number
          momentum: number
          score_descriptions?: Json | null
          score_descriptions_old?: string[] | null
          scored_at?: string
          stock_id: string
          total: number
        }
        Update: {
          created_at?: string
          disclosure?: number
          fundamental?: number
          id?: string
          institutional?: number
          momentum?: number
          score_descriptions?: Json | null
          score_descriptions_old?: string[] | null
          scored_at?: string
          stock_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_scores_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          change: number
          change_rate: number
          code: string
          created_at: string
          id: string
          market: string
          name: string
          price: number
          rank: number | null
          sector: string | null
          updated_at: string
        }
        Insert: {
          change?: number
          change_rate?: number
          code: string
          created_at?: string
          id: string
          market?: string
          name: string
          price?: number
          rank?: number | null
          sector?: string | null
          updated_at?: string
        }
        Update: {
          change?: number
          change_rate?: number
          code?: string
          created_at?: string
          id?: string
          market?: string
          name?: string
          price?: number
          rank?: number | null
          sector?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          stock_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          stock_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          stock_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_trading_pipeline: { Args: never; Returns: Json }
      cleanup_ranking_history: { Args: never; Returns: number }
      sync_to_public_ohlcv: {
        Args: never
        Returns: {
          inserted_count: number
          skipped_count: number
        }[]
      }
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
