-- Create enum types for the ecosystem
CREATE TYPE public.order_status AS ENUM ('pending', 'escrow_locked', 'in_transit', 'delivered', 'completed', 'disputed', 'refunded');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'swap', 'purchase', 'escrow_lock', 'escrow_release');

-- NGNB balance tracking (1:1 with Naira)
CREATE TABLE public.ngnb_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(20, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- KYC data for banking compliance
CREATE TABLE public.kyc_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  bvn TEXT,
  id_number TEXT,
  status kyc_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Banking transactions (deposits/withdrawals)
CREATE TABLE public.banking_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  ngnb_amount DECIMAL(20, 2),
  status TEXT NOT NULL DEFAULT 'pending',
  reference TEXT UNIQUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product listings
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_bimcoin DECIMAL(20, 8) NOT NULL,
  price_naira DECIMAL(20, 2),
  category TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders with escrow
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_bimcoin DECIMAL(20, 8) NOT NULL,
  escrow_address TEXT,
  escrow_tx_hash TEXT,
  status order_status NOT NULL DEFAULT 'pending',
  delivery_address TEXT,
  buyer_notes TEXT,
  tracking_number TEXT,
  delivery_confirmed_at TIMESTAMP WITH TIME ZONE,
  escrow_released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ngnb_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ngnb_balances
CREATE POLICY "Users can view their own NGNB balance"
  ON public.ngnb_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own NGNB balance"
  ON public.ngnb_balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own NGNB balance"
  ON public.ngnb_balances FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for kyc_records
CREATE POLICY "Users can view their own KYC"
  ON public.kyc_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC"
  ON public.kyc_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own KYC"
  ON public.kyc_records FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for banking_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.banking_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.banking_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for products
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Sellers can insert their own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own products"
  ON public.products FOR DELETE
  USING (auth.uid() = seller_id);

-- RLS Policies for orders
CREATE POLICY "Buyers can view their orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view orders for their products"
  ON public.orders FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Buyers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update orders for their products"
  ON public.orders FOR UPDATE
  USING (auth.uid() = seller_id);

-- Triggers for updated_at
CREATE TRIGGER update_ngnb_balances_updated_at
  BEFORE UPDATE ON public.ngnb_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kyc_records_updated_at
  BEFORE UPDATE ON public.kyc_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();