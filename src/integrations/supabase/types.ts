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
      address_book: {
        Row: {
          address: string
          created_at: string
          id: string
          name: string
          network: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          name: string
          network?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          name?: string
          network?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      connected_dapps: {
        Row: {
          connected_at: string
          dapp_icon: string | null
          dapp_name: string
          dapp_url: string
          id: string
          last_used: string | null
          permissions: Json | null
          user_id: string
        }
        Insert: {
          connected_at?: string
          dapp_icon?: string | null
          dapp_name: string
          dapp_url: string
          id?: string
          last_used?: string | null
          permissions?: Json | null
          user_id: string
        }
        Update: {
          connected_at?: string
          dapp_icon?: string | null
          dapp_name?: string
          dapp_url?: string
          id?: string
          last_used?: string | null
          permissions?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      nft_collection: {
        Row: {
          collection_name: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          name: string | null
          nft_address: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          collection_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string | null
          nft_address: string
          user_id: string
          wallet_address: string
        }
        Update: {
          collection_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string | null
          nft_address?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      transaction_history: {
        Row: {
          amount: string
          block_number: number | null
          created_at: string
          fee: string | null
          id: string
          memo: string | null
          network: string
          recipient_address: string | null
          sender_address: string | null
          status: string
          timestamp: string
          token: string
          tx_hash: string
          type: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          amount: string
          block_number?: number | null
          created_at?: string
          fee?: string | null
          id?: string
          memo?: string | null
          network?: string
          recipient_address?: string | null
          sender_address?: string | null
          status?: string
          timestamp?: string
          token?: string
          tx_hash: string
          type: string
          user_id: string
          wallet_address: string
        }
        Update: {
          amount?: string
          block_number?: number | null
          created_at?: string
          fee?: string | null
          id?: string
          memo?: string | null
          network?: string
          recipient_address?: string | null
          sender_address?: string | null
          status?: string
          timestamp?: string
          token?: string
          tx_hash?: string
          type?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      wallet_settings: {
        Row: {
          auto_lock_minutes: number | null
          biometric_enabled: boolean | null
          created_at: string
          currency: string
          id: string
          network: string
          push_notifications_enabled: boolean | null
          transaction_limit_daily: string | null
          transaction_limit_per_tx: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_lock_minutes?: number | null
          biometric_enabled?: boolean | null
          created_at?: string
          currency?: string
          id?: string
          network?: string
          push_notifications_enabled?: boolean | null
          transaction_limit_daily?: string | null
          transaction_limit_per_tx?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_lock_minutes?: number | null
          biometric_enabled?: boolean | null
          created_at?: string
          currency?: string
          id?: string
          network?: string
          push_notifications_enabled?: boolean | null
          transaction_limit_daily?: string | null
          transaction_limit_per_tx?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
