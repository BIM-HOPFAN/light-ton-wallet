import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type OrderStatus = 'pending' | 'escrow_locked' | 'in_transit' | 'delivered' | 'completed' | 'disputed' | 'refunded';

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  total_bimcoin: number;
  status: OrderStatus;
  delivery_address: string | null;
  tracking_number: string | null;
  buyer_notes: string | null;
  escrow_address: string | null;
  escrow_tx_hash: string | null;
  delivery_confirmed_at: string | null;
  escrow_released_at: string | null;
  created_at: string;
  updated_at: string;
  products?: {
    title: string;
    images: any;
  };
}

export function useOrders(type: 'buyer' | 'seller' | 'all' = 'all') {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', type, user?.id],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('orders')
        .select('*, products(title, images)');

      if (type === 'buyer') {
        query = query.eq('buyer_id', user.id);
      } else if (type === 'seller') {
        query = query.eq('seller_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status, updates }: { 
      orderId: string; 
      status: OrderStatus;
      updates?: Partial<Order>;
    }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, ...updates })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const confirmDelivery = useMutation({
    mutationFn: async (orderId: string) => {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error('Order not found');

      // Get seller's balance
      const { data: sellerBalance, error: balanceError } = await supabase
        .from('bimcoin_balances')
        .select('balance')
        .eq('user_id', order.seller_id)
        .maybeSingle();

      const newBalance = sellerBalance 
        ? parseFloat(sellerBalance.balance.toString()) + order.total_bimcoin
        : order.total_bimcoin;

      // Release escrow to seller
      const { error: releaseError } = await supabase
        .from('bimcoin_balances')
        .upsert({
          user_id: order.seller_id,
          balance: newBalance
        });

      if (releaseError) throw releaseError;

      // Update order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          delivery_confirmed_at: new Date().toISOString(),
          escrow_released_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['bimcoin-balance'] });
    },
  });

  return {
    orders,
    isLoading,
    updateOrderStatus: updateOrderStatus.mutate,
    confirmDelivery: confirmDelivery.mutate,
    isUpdating: updateOrderStatus.isPending,
    isConfirming: confirmDelivery.isPending,
  };
}
