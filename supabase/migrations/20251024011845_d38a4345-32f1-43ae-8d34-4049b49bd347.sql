-- Create bimcoin_balances table for internal Bimcoin tracking
CREATE TABLE IF NOT EXISTS public.bimcoin_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bimcoin_balances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own Bimcoin balance"
ON public.bimcoin_balances
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Bimcoin balance"
ON public.bimcoin_balances
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Bimcoin balance"
ON public.bimcoin_balances
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_bimcoin_balances_updated_at
BEFORE UPDATE ON public.bimcoin_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();