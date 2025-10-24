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
      banking_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          ngnb_amount: number | null
          reference: string | null
          status: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          ngnb_amount?: number | null
          reference?: string | null
          status?: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          ngnb_amount?: number | null
          reference?: string | null
          status?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      bimcoin_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
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
      kyc_records: {
        Row: {
          bvn: string | null
          created_at: string
          full_name: string
          id: string
          id_number: string | null
          phone_number: string
          status: Database["public"]["Enums"]["kyc_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          bvn?: string | null
          created_at?: string
          full_name: string
          id?: string
          id_number?: string | null
          phone_number: string
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          bvn?: string | null
          created_at?: string
          full_name?: string
          id?: string
          id_number?: string | null
          phone_number?: string
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
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
      ngnb_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          buyer_id: string
          buyer_notes: string | null
          created_at: string
          delivery_address: string | null
          delivery_confirmed_at: string | null
          escrow_address: string | null
          escrow_released_at: string | null
          escrow_tx_hash: string | null
          id: string
          product_id: string
          quantity: number
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          total_bimcoin: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          buyer_notes?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_confirmed_at?: string | null
          escrow_address?: string | null
          escrow_released_at?: string | null
          escrow_tx_hash?: string | null
          id?: string
          product_id: string
          quantity?: number
          seller_id: string
          status?: Database["public"]["Enums"]["order_status"]
          total_bimcoin: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          buyer_notes?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_confirmed_at?: string | null
          escrow_address?: string | null
          escrow_released_at?: string | null
          escrow_tx_hash?: string | null
          id?: string
          product_id?: string
          quantity?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_bimcoin?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          images: Json | null
          is_active: boolean
          price_bimcoin: number
          price_naira: number | null
          seller_id: string
          stock_quantity: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean
          price_bimcoin: number
          price_naira?: number | null
          seller_id: string
          stock_quantity?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean
          price_bimcoin?: number
          price_naira?: number | null
          seller_id?: string
          stock_quantity?: number
          title?: string
          updated_at?: string
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
      virtual_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_reference: string
          bank_code: string
          bank_name: string
          created_at: string
          currency_code: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_reference: string
          bank_code?: string
          bank_name?: string
          created_at?: string
          currency_code?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_reference?: string
          bank_code?: string
          bank_name?: string
          created_at?: string
          currency_code?: string
          id?: string
          updated_at?: string
          user_id?: string
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
      kyc_status: "pending" | "approved" | "rejected"
      order_status:
        | "pending"
        | "escrow_locked"
        | "in_transit"
        | "delivered"
        | "completed"
        | "disputed"
        | "refunded"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "swap"
        | "purchase"
        | "escrow_lock"
        | "escrow_release"
        | "swap_to_wallet"
        | "swap_to_bank"
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
      kyc_status: ["pending", "approved", "rejected"],
      order_status: [
        "pending",
        "escrow_locked",
        "in_transit",
        "delivered",
        "completed",
        "disputed",
        "refunded",
      ],
      transaction_type: [
        "deposit",
        "withdrawal",
        "swap",
        "purchase",
        "escrow_lock",
        "escrow_release",
        "swap_to_wallet",
        "swap_to_bank",
      ],
    },
  },
} as const
