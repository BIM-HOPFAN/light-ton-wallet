import { useEffect, useState } from 'react';
import { currencyService, Currency } from '@/lib/currency';

export function usePriceUpdates(currency: Currency = 'USD') {
  const [price, setPrice] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPrice = async () => {
      try {
        // Force fresh fetch by bypassing cache occasionally
        await currencyService.fetchLiveRates();
        const rate = await currencyService.getExchangeRate(currency);
        if (mounted) {
          setPrice(rate.toFixed(2));
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch price:', error);
        if (mounted) {
          // Use cached rate on error
          const cachedRate = currencyService.getCachedRate(currency);
          setPrice(cachedRate.toFixed(2));
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchPrice();

    // Update every 15 seconds for real-time fluctuations
    const interval = setInterval(fetchPrice, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currency]);

  return { price, isLoading };
}
