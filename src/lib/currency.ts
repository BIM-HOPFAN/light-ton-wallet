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
  private rates: ExchangeRates = {
    USD: 2.5,
    EUR: 2.3,
    GBP: 2.0,
    JPY: 350,
    RUB: 230,
    NGN: 4000,
  };
  private lastFetch: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes

  async fetchLiveRates(): Promise<void> {
    // Only fetch if cache is expired
    if (Date.now() - this.lastFetch < this.cacheDuration) {
      return;
    }

    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=toncoin&vs_currencies=usd,eur,gbp,jpy,rub,ngn'
      );
      
      if (!response.ok) throw new Error('Failed to fetch rates');
      
      const data: CoinGeckoResponse = await response.json();
      
      this.rates = {
        USD: data.toncoin.usd,
        EUR: data.toncoin.eur,
        GBP: data.toncoin.gbp,
        JPY: data.toncoin.jpy,
        RUB: data.toncoin.rub,
        NGN: data.toncoin.ngn,
      };
      
      this.lastFetch = Date.now();
    } catch (error) {
      console.error('Failed to fetch live exchange rates:', error);
      // Keep using cached rates on error
    }
  }

  async getExchangeRate(currency: Currency): Promise<number> {
    await this.fetchLiveRates();
    return this.rates[currency] || this.rates.USD;
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

  getCachedRate(currency: Currency): number {
    return this.rates[currency] || this.rates.USD;
  }

  isCacheValid(): boolean {
    return Date.now() - this.lastFetch < this.cacheDuration;
  }
}

export const currencyService = new CurrencyService();
