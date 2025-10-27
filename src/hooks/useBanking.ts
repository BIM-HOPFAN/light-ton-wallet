import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NGNBBalance {
  balance: number;
}

export interface VirtualAccount {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
}

export function useBanking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: ngnbBalance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['ngnb-balance', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const { data, error } = await supabase
        .from('ngnb_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        await supabase
          .from('ngnb_balances')
          .insert({ user_id: user.id, balance: 0 });
        return 0;
      }

      return parseFloat(data.balance.toString());
    },
    enabled: !!user,
  });

  const { data: virtualAccount, isLoading: isLoadingAccount } = useQuery({
    queryKey: ['virtual-account', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: existing } = await supabase
        .from('virtual_accounts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) return existing as VirtualAccount;

      // Create virtual account via edge function
      const { data, error } = await supabase.functions.invoke('monnify', {
        body: { 
          action: 'create_virtual_account',
          accountName: `Bimlight - ${user.email?.split('@')[0] || 'User'}`
        }
      });

      if (error) throw error;
      return data?.data as VirtualAccount | null;
    },
    enabled: !!user,
  });

  const withdraw = useMutation({
    mutationFn: async ({ 
      amount, 
      recipientAccountNumber, 
      recipientBankCode 
    }: { 
      amount: number; 
      recipientAccountNumber: string; 
      recipientBankCode: string; 
    }) => {
      if (!user) throw new Error('Not authenticated');
      if (!ngnbBalance || amount > ngnbBalance) {
        throw new Error('Insufficient balance');
      }

      const { data, error } = await supabase.functions.invoke('monnify', {
        body: {
          action: 'initiate_transfer',
          amount,
          recipientAccountNumber,
          recipientBankCode,
          narration: 'Transfer from Bimlight'
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Transfer failed');

      // Update balance
      await supabase
        .from('ngnb_balances')
        .update({ balance: ngnbBalance - amount })
        .eq('user_id', user.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngnb-balance'] });
      queryClient.invalidateQueries({ queryKey: ['banking-transactions'] });
    },
  });

  return {
    ngnbBalance: ngnbBalance || 0,
    virtualAccount,
    isLoadingBalance,
    isLoadingAccount,
    withdraw: withdraw.mutate,
    isWithdrawing: withdraw.isPending,
  };
}
