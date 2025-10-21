-- Create virtual_accounts table to store Monnify virtual account details
CREATE TABLE public.virtual_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL DEFAULT 'Wema Bank',
  bank_code TEXT NOT NULL DEFAULT '035',
  account_reference TEXT NOT NULL UNIQUE,
  currency_code TEXT NOT NULL DEFAULT 'NGN',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own virtual account"
  ON public.virtual_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own virtual account"
  ON public.virtual_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_virtual_accounts_updated_at
  BEFORE UPDATE ON public.virtual_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();