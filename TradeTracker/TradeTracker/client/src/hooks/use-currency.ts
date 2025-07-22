import { useQuery } from "@tanstack/react-query";

interface CurrencyRateResponse {
  rate: number;
  from: string;
  to: string;
}

export function useCurrency() {
  const { data: usdToInrRate } = useQuery<CurrencyRateResponse>({
    queryKey: ["/api/currency/rate/USD/INR"],
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const { data: inrToUsdRate } = useQuery<CurrencyRateResponse>({
    queryKey: ["/api/currency/rate/INR/USD"],
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const convertToUSD = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === 'USD') return amount;
    if (fromCurrency === 'INR' && inrToUsdRate) {
      return amount * inrToUsdRate.rate;
    }
    return amount;
  };

  const convertToINR = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === 'INR') return amount;
    if (fromCurrency === 'USD' && usdToInrRate) {
      return amount * usdToInrRate.rate;
    }
    return amount;
  };

  const formatCurrency = (amount: number, currency: string): string => {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getExchangeRate = (from: string, to: string): number => {
    if (from === to) return 1;
    if (from === 'USD' && to === 'INR' && usdToInrRate) {
      return usdToInrRate.rate;
    }
    if (from === 'INR' && to === 'USD' && inrToUsdRate) {
      return inrToUsdRate.rate;
    }
    return 1;
  };

  return {
    convertToUSD,
    convertToINR,
    formatCurrency,
    getExchangeRate,
    usdToInrRate: usdToInrRate?.rate,
    inrToUsdRate: inrToUsdRate?.rate,
  };
}
