-- Add CHECK constraints to prevent negative balances
ALTER TABLE public.ngnb_balances 
ADD CONSTRAINT ngnb_balances_balance_check CHECK (balance >= 0);

ALTER TABLE public.bimcoin_balances 
ADD CONSTRAINT bimcoin_balances_balance_check CHECK (balance >= 0);

-- Create atomic function for NGNB balance deduction
CREATE OR REPLACE FUNCTION public.atomic_deduct_ngnb_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_affected INTEGER;
BEGIN
  -- Atomic update: deduct only if sufficient balance exists
  UPDATE public.ngnb_balances
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id 
    AND balance >= p_amount;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  -- Return true if update succeeded, false if insufficient balance
  RETURN v_rows_affected > 0;
END;
$$;

-- Create atomic function for NGNB balance credit
CREATE OR REPLACE FUNCTION public.atomic_credit_ngnb_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_affected INTEGER;
BEGIN
  -- Try to update existing balance
  UPDATE public.ngnb_balances
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  -- If no rows updated, insert new balance
  IF v_rows_affected = 0 THEN
    INSERT INTO public.ngnb_balances (user_id, balance)
    VALUES (p_user_id, p_amount)
    ON CONFLICT (user_id) DO UPDATE
    SET balance = ngnb_balances.balance + p_amount,
        updated_at = now();
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create atomic function for Bimcoin balance deduction
CREATE OR REPLACE FUNCTION public.atomic_deduct_bimcoin_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_affected INTEGER;
BEGIN
  -- Atomic update: deduct only if sufficient balance exists
  UPDATE public.bimcoin_balances
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id 
    AND balance >= p_amount;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  -- Return true if update succeeded, false if insufficient balance
  RETURN v_rows_affected > 0;
END;
$$;

-- Create atomic function for Bimcoin balance credit
CREATE OR REPLACE FUNCTION public.atomic_credit_bimcoin_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_affected INTEGER;
BEGIN
  -- Try to update existing balance
  UPDATE public.bimcoin_balances
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  -- If no rows updated, insert new balance
  IF v_rows_affected = 0 THEN
    INSERT INTO public.bimcoin_balances (user_id, balance)
    VALUES (p_user_id, p_amount)
    ON CONFLICT (user_id) DO UPDATE
    SET balance = bimcoin_balances.balance + p_amount,
        updated_at = now();
  END IF;
  
  RETURN TRUE;
END;
$$;