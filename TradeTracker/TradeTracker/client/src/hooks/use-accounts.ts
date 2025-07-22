import { useQuery } from "@tanstack/react-query";
import type { Account } from "@shared/schema";

export function useAccounts(userId?: number) {
  const { data: accounts = [], isLoading, error } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const getAccountsByType = (type: 'main' | 'sub') => {
    return accounts.filter(account => account.accountType === type);
  };

  const getAccountsByMarket = (market: string) => {
    return accounts.filter(account => account.market === market);
  };

  const getAccountsByCurrency = (currency: string) => {
    return accounts.filter(account => account.currency === currency);
  };

  const getMainAccounts = () => getAccountsByType('main');
  
  const getSubAccounts = () => getAccountsByType('sub');

  const getTotalBalance = (currency?: string) => {
    const filteredAccounts = currency 
      ? getAccountsByCurrency(currency)
      : accounts;
    
    return filteredAccounts.reduce((total, account) => {
      return total + parseFloat(account.balance);
    }, 0);
  };

  const getAccountById = (id: number) => {
    return accounts.find(account => account.id === id);
  };

  const formatAccountName = (account: Account) => {
    const symbol = account.currency === 'INR' ? '₹' : '$';
    const balance = parseFloat(account.balance).toLocaleString();
    return `${account.name} (${symbol} ${balance})`;
  };

  return {
    accounts,
    isLoading,
    error,
    getAccountsByType,
    getAccountsByMarket,
    getAccountsByCurrency,
    getMainAccounts,
    getSubAccounts,
    getTotalBalance,
    getAccountById,
    formatAccountName,
  };
}
