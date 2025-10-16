// Phase 3: Currency conversion service
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'RUB';

interface ExchangeRates {
  [key: string]: number;
}

class CurrencyService {
  private rates: ExchangeRates = {
    USD: 2.5,
    EUR: 2.3,
    GBP: 2.0,
    JPY: 350,
    RUB: 230,
  };

  async getExchangeRate(currency: Currency): Promise<number> {
    // In production, fetch from real API
    return this.rates[currency] || 2.5;
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
    };
    
    return `${symbols[currency]}${amount}`;
  }
}

export const currencyService = new CurrencyService();
