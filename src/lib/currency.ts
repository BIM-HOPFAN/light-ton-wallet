// Real currency conversion with live exchange rates
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'RUB' | 'NGN';

interface ExchangeRates {
  [key: string]: number;
}

interface CoinGeckoResponse {
  toncoin: {
    usd: number;
    eur: number;
    gbp: number;
    jpy: number;
    rub: number;
    ngn: number;
  };
}

class CurrencyService {
  private rates: ExchangeRates = {};
  private lastFetch: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes
  private isFetching: boolean = false;
  private fetchError: string | null = null;

  async fetchLiveRates(): Promise<void> {
    // Only fetch if cache is valid or already fetching
    if (Date.now() - this.lastFetch < this.cacheDuration || this.isFetching) {
      return;
    }

    this.isFetching = true;
    this.fetchError = null;

    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=toncoin&vs_currencies=usd,eur,gbp,jpy,rub,ngn',
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
      
      const data: CoinGeckoResponse = await response.json();
      
      if (!data.toncoin) {
        throw new Error('Invalid API response: missing toncoin data');
      }
      
      this.rates = {
        USD: data.toncoin.usd,
        EUR: data.toncoin.eur,
        GBP: data.toncoin.gbp,
        JPY: data.toncoin.jpy,
        RUB: data.toncoin.rub,
        NGN: data.toncoin.ngn,
      };
      
      this.lastFetch = Date.now();
      this.fetchError = null;
      console.log('✅ Successfully fetched live TON rates:', this.rates);
    } catch (error) {
      this.fetchError = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to fetch live exchange rates:', this.fetchError);
      
      // If we have no rates at all, throw error
      if (Object.keys(this.rates).length === 0) {
        throw new Error('Unable to fetch TON prices. Please check your internet connection.');
      }
    } finally {
      this.isFetching = false;
    }
  }

  async getExchangeRate(currency: Currency): Promise<number> {
    await this.fetchLiveRates();
    const rate = this.rates[currency];
    
    if (!rate) {
      throw new Error(`Exchange rate for ${currency} not available`);
    }
    
    return rate;
  }

  async convertTONtoFiat(tonAmount: string, currency: Currency): Promise<string> {
    const rate = await this.getExchangeRate(currency);
    const amount = parseFloat(tonAmount) * rate;
    return amount.toFixed(2);
  }

  formatCurrency(amount: string, currency: Currency): string {
    const symbols: Record<Currency, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      RUB: '₽',
      NGN: '₦',
    };
    
    return `${symbols[currency]}${amount}`;
  }

  getCachedRate(currency: Currency): number | null {
    return this.rates[currency] || null;
  }

  isCacheValid(): boolean {
    return Date.now() - this.lastFetch < this.cacheDuration && Object.keys(this.rates).length > 0;
  }

  getLastError(): string | null {
    return this.fetchError;
  }

  hasRates(): boolean {
    return Object.keys(this.rates).length > 0;
  }
}

export const currencyService = new CurrencyService();
