import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Currency } from '@/lib/currency';

export interface PriceAlert {
  id: string;
  user_id: string;
  target_price: number;
  currency: Currency;
  condition: 'above' | 'below';
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export function usePriceAlerts(userId: string | undefined) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching price alerts:', error);
      } else {
        setAlerts((data || []).map(alert => ({
          ...alert,
          currency: alert.currency as Currency,
          condition: alert.condition as 'above' | 'below',
        })));
      }
      setIsLoading(false);
    };

    fetchAlerts();

    // Set up realtime subscription
    const channel = supabase
      .channel('price_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_alerts',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const createAlert = async (
    targetPrice: number,
    currency: Currency,
    condition: 'above' | 'below'
  ) => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: userId,
        target_price: targetPrice,
        currency,
        condition,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating alert:', error);
      throw error;
    }

    return data;
  };

  const deleteAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', alertId);

    if (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('price_alerts')
      .update({ is_active: isActive })
      .eq('id', alertId);

    if (error) {
      console.error('Error toggling alert:', error);
      throw error;
    }
  };

  return {
    alerts,
    isLoading,
    createAlert,
    deleteAlert,
    toggleAlert,
  };
}
