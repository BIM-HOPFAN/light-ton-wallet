import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NFT {
  id: string;
  user_id: string;
  wallet_address: string;
  nft_address: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  collection_name: string | null;
  metadata: any;
  created_at: string;
}

export function useNFTs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: nfts = [], isLoading } = useQuery({
    queryKey: ['nfts', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('nft_collection')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as NFT[];
    },
    enabled: !!user,
  });

  const addNFT = useMutation({
    mutationFn: async (nftData: Omit<NFT, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('nft_collection')
        .insert([nftData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
    },
  });

  const deleteNFT = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('nft_collection')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
    },
  });

  return {
    nfts,
    isLoading,
    addNFT: addNFT.mutate,
    deleteNFT: deleteNFT.mutate,
    isAdding: addNFT.isPending,
    isDeleting: deleteNFT.isPending,
  };
}
