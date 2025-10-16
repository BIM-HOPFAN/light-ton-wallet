-- Phase 1-4: Complete Wallet Backend Schema

-- Address Book table for storing saved addresses
CREATE TABLE public.address_book (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'TON',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.address_book ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own addresses"
  ON public.address_book FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own addresses"
  ON public.address_book FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own addresses"
  ON public.address_book FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own addresses"
  ON public.address_book FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Transaction History table for blockchain transactions
CREATE TABLE public.transaction_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('send', 'receive')),
  amount TEXT NOT NULL,
  token TEXT NOT NULL DEFAULT 'TON',
  network TEXT NOT NULL DEFAULT 'mainnet',
  recipient_address TEXT,
  sender_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  memo TEXT,
  fee TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  block_number BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transaction_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions"
  ON public.transaction_history FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own transactions"
  ON public.transaction_history FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- NFT Gallery table
CREATE TABLE public.nft_collection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  nft_address TEXT NOT NULL,
  name TEXT,
  description TEXT,
  image_url TEXT,
  collection_name TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nft_collection ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own NFTs"
  ON public.nft_collection FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own NFTs"
  ON public.nft_collection FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own NFTs"
  ON public.nft_collection FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Wallet Settings table for user preferences
CREATE TABLE public.wallet_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  auto_lock_minutes INTEGER DEFAULT 5,
  biometric_enabled BOOLEAN DEFAULT false,
  network TEXT NOT NULL DEFAULT 'mainnet' CHECK (network IN ('mainnet', 'testnet')),
  currency TEXT NOT NULL DEFAULT 'USD',
  transaction_limit_daily TEXT,
  transaction_limit_per_tx TEXT,
  push_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own settings"
  ON public.wallet_settings FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own settings"
  ON public.wallet_settings FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own settings"
  ON public.wallet_settings FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Connected DApps table
CREATE TABLE public.connected_dapps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dapp_name TEXT NOT NULL,
  dapp_url TEXT NOT NULL,
  dapp_icon TEXT,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used TIMESTAMP WITH TIME ZONE,
  permissions JSONB
);

-- Enable RLS
ALTER TABLE public.connected_dapps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own connected dapps"
  ON public.connected_dapps FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own connected dapps"
  ON public.connected_dapps FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own connected dapps"
  ON public.connected_dapps FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_address_book_updated_at
  BEFORE UPDATE ON public.address_book
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallet_settings_updated_at
  BEFORE UPDATE ON public.wallet_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for better query performance
CREATE INDEX idx_address_book_user_id ON public.address_book(user_id);
CREATE INDEX idx_transaction_history_user_id ON public.transaction_history(user_id);
CREATE INDEX idx_transaction_history_wallet_address ON public.transaction_history(wallet_address);
CREATE INDEX idx_transaction_history_tx_hash ON public.transaction_history(tx_hash);
CREATE INDEX idx_nft_collection_user_id ON public.nft_collection(user_id);
CREATE INDEX idx_nft_collection_wallet_address ON public.nft_collection(wallet_address);
CREATE INDEX idx_connected_dapps_user_id ON public.connected_dapps(user_id);