import { useEffect, useState } from 'react';
import { currencyService, Currency } from '@/lib/currency';

export function usePriceUpdates(currency: Currency = 'USD') {
  const [price, setPrice] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPrice = async () => {
      try {
        const rate = await currencyService.getExchangeRate(currency);
        if (mounted) {
          setPrice(rate.toFixed(2));
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch price:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchPrice();

    // Update every 30 seconds
    const interval = setInterval(fetchPrice, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currency]);

  return { price, isLoading };
}
