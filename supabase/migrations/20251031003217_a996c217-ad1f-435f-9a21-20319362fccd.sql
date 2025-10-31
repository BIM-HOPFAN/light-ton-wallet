-- Add admin access policies for KYC records
CREATE POLICY "Admins can view all KYC records"
ON public.kyc_records
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins can update KYC status"
ON public.kyc_records
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'moderator'::app_role)
);

-- Ensure transaction immutability
CREATE POLICY "Prevent transaction deletion"
ON public.banking_transactions
FOR DELETE
TO authenticated
USING (false);

CREATE POLICY "Prevent transaction updates"
ON public.banking_transactions
FOR UPDATE
TO authenticated
USING (false);