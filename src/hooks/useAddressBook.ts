import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AddressEntry {
  id: string;
  user_id: string;
  name: string;
  address: string;
  network: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useAddressBook() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['address-book', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('address_book')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AddressEntry[];
    },
    enabled: !!user,
  });

  const addAddress = useMutation({
    mutationFn: async (addressData: Omit<AddressEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('address_book')
        .insert([{ ...addressData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['address-book'] });
    },
  });

  const updateAddress = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AddressEntry> }) => {
      const { data, error } = await supabase
        .from('address_book')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['address-book'] });
    },
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('address_book')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['address-book'] });
    },
  });

  return {
    addresses,
    isLoading,
    addAddress: addAddress.mutate,
    updateAddress: updateAddress.mutate,
    deleteAddress: deleteAddress.mutate,
    isAdding: addAddress.isPending,
    isUpdating: updateAddress.isPending,
    isDeleting: deleteAddress.isPending,
  };
}
