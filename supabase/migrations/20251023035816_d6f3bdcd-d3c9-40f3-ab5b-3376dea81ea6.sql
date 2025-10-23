-- Add new transaction types for NGNB swaps
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'swap_to_wallet';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'swap_to_bank';