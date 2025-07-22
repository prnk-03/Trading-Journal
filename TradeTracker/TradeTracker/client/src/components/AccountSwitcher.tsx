import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Account } from "@shared/schema";

interface AccountSwitcherProps {
  selectedAccountId: number | null;
  onAccountChange: (accountId: number) => void;
}

export default function AccountSwitcher({ selectedAccountId, onAccountChange }: AccountSwitcherProps) {
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const formatAccountLabel = (account: Account) => {
    const symbol = account.currency === 'INR' ? '₹' : '$';
    const balance = parseFloat(account.balance).toLocaleString();
    return `${account.name} (${symbol} ${balance})`;
  };

  return (
    <Select
      value={selectedAccountId?.toString() || ""}
      onValueChange={(value) => onAccountChange(parseInt(value))}
    >
      <SelectTrigger className="w-[280px] bg-slate-800 text-slate-100 border-slate-700">
        <SelectValue placeholder="Select account" />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id.toString()}>
            {formatAccountLabel(account)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
