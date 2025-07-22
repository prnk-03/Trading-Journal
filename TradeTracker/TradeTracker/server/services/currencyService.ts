import { storage } from "../storage";

class CurrencyService {
  private readonly API_KEY = process.env.EXCHANGE_RATE_API_KEY || process.env.CURRENCY_API_KEY || "demo_key";
  private readonly BASE_URL = "https://api.exchangerate-api.com/v4/latest";

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    try {
      // First, try to get from database cache
      const cachedRate = await storage.getCurrencyRate(fromCurrency, toCurrency);
      
      // If cached rate is less than 1 hour old, use it
      if (cachedRate && this.isRateRecent(cachedRate.updatedAt)) {
        return parseFloat(cachedRate.rate);
      }

      // Fetch fresh rate from API
      const response = await fetch(`${this.BASE_URL}/${fromCurrency}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const rate = data.rates[toCurrency];

      if (!rate) {
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }

      // Cache the rate
      await storage.updateCurrencyRate({
        fromCurrency,
        toCurrency,
        rate: rate.toString(),
      });

      return rate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      
      // Fallback to cached rate if available
      const fallbackCachedRate = await storage.getCurrencyRate(fromCurrency, toCurrency);
      if (fallbackCachedRate) {
        return parseFloat(fallbackCachedRate.rate);
      }

      // Fallback rates for common pairs
      return this.getFallbackRate(fromCurrency, toCurrency);
    }
  }

  private isRateRecent(updatedAt: Date | null): boolean {
    if (!updatedAt) return false;
    
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    return updatedAt > hourAgo;
  }

  private getFallbackRate(fromCurrency: string, toCurrency: string): number {
    // Fallback exchange rates (approximate)
    const fallbackRates: Record<string, number> = {
      'INR_USD': 0.012, // 1 INR = 0.012 USD (approximately 83 INR = 1 USD)
      'USD_INR': 83.0,  // 1 USD = 83 INR
    };

    const key = `${fromCurrency}_${toCurrency}`;
    const reverseKey = `${toCurrency}_${fromCurrency}`;
    
    if (fallbackRates[key]) {
      return fallbackRates[key];
    }
    
    if (fallbackRates[reverseKey]) {
      return 1 / fallbackRates[reverseKey];
    }

    // Default fallback
    return 1;
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }
}

export const currencyService = new CurrencyService();
