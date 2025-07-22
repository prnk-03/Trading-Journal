import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Crown, ArrowRightLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Account } from "@shared/schema";

export default function AccountManagement() {
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/accounts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsAddAccountOpen(false);
      toast({
        title: "Account created successfully",
        description: "Your new trading account has been set up.",
      });
    },
  });

  const transferFundsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/transfers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setFromAccount("");
      setToAccount("");
      setTransferAmount("");
      toast({
        title: "Transfer completed",
        description: "Funds have been transferred successfully.",
      });
    },
  });

  const handleCreateAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const accountData = {
      name: formData.get("name") as string,
      broker: formData.get("broker") as string,
      market: formData.get("market") as string,
      currency: formData.get("currency") as string,
      accountType: formData.get("accountType") as string,
      balance: formData.get("balance") as string,
      leverage: parseInt(formData.get("leverage") as string || "1"),
    };

    createAccountMutation.mutate(accountData);
  };

  const handleTransfer = () => {
    if (!fromAccount || !toAccount || !transferAmount) {
      toast({
        title: "Invalid transfer",
        description: "Please fill all transfer fields.",
        variant: "destructive",
      });
      return;
    }

    transferFundsMutation.mutate({
      fromAccountId: parseInt(fromAccount),
      toAccountId: parseInt(toAccount),
      amount: transferAmount,
      currency: accounts.find(a => a.id === parseInt(fromAccount))?.currency || "USD",
    });
  };

  const getAccountIcon = (market: string, accountType: string) => {
    if (accountType === 'main') {
      return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400' };
    }
    
    switch (market) {
      case 'forex':
        return { icon: () => <i className="fas fa-exchange-alt" />, color: 'text-forex', bg: 'bg-forex' };
      case 'crypto':
        return { icon: () => <i className="fab fa-bitcoin" />, color: 'text-crypto', bg: 'bg-crypto' };
      case 'stocks':
        return { icon: () => <i className="fas fa-chart-line" />, color: 'text-stocks', bg: 'bg-stocks' };
      default:
        return { icon: () => <i className="fas fa-chart-area" />, color: 'text-purple-400', bg: 'bg-purple-400' };
    }
  };

  const formatBalance = (balance: string, currency: string) => {
    const symbol = currency === 'INR' ? '₹' : '$';
    const amount = parseFloat(balance).toLocaleString();
    return `${symbol}${amount}`;
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Account Management</CardTitle>
          <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-800 hover:bg-slate-700 text-slate-300">
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Account Name</Label>
                    <Input
                      name="name"
                      placeholder="Trading Account 1"
                      className="bg-slate-800 border-slate-700"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type</Label>
                    <Select name="accountType" required>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main Account</SelectItem>
                        <SelectItem value="sub">Sub Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="broker">Broker</Label>
                    <Select name="broker" required>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Select broker" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exness">Exness</SelectItem>
                        <SelectItem value="xm">XM Global</SelectItem>
                        <SelectItem value="binance">Binance</SelectItem>
                        <SelectItem value="dhan">Dhan</SelectItem>
                        <SelectItem value="grow">Grow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="market">Market</Label>
                    <Select name="market" required>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Select market" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="forex">Forex</SelectItem>
                        <SelectItem value="crypto">Crypto</SelectItem>
                        <SelectItem value="stocks">Stocks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select name="currency" required>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balance">Initial Balance</Label>
                    <Input
                      name="balance"
                      type="number"
                      placeholder="1000"
                      className="bg-slate-800 border-slate-700"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leverage">Leverage (optional)</Label>
                  <Select name="leverage">
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select leverage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1:1</SelectItem>
                      <SelectItem value="10">1:10</SelectItem>
                      <SelectItem value="50">1:50</SelectItem>
                      <SelectItem value="100">1:100</SelectItem>
                      <SelectItem value="200">1:200</SelectItem>
                      <SelectItem value="500">1:500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Create Account
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {accounts.map((account) => {
            const accountInfo = getAccountIcon(account.market, account.accountType);
            const IconComponent = accountInfo.icon;
            
            return (
              <div
                key={account.id}
                className={
                  account.accountType === 'main'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white'
                    : 'bg-slate-800 border border-slate-700 rounded-lg p-6'
                }
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 ${account.accountType === 'main' ? 'bg-white bg-opacity-20' : `${accountInfo.bg} bg-opacity-20`} rounded-lg flex items-center justify-center`}>
                    {account.accountType === 'main' ? (
                      <Crown className="w-5 h-5 text-white" />
                    ) : (
                      <IconComponent />
                    )}
                  </div>
                  <Badge 
                    className={
                      account.accountType === 'main'
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }
                  >
                    {account.accountType === 'main' ? 'Main' : 'Sub'}
                  </Badge>
                </div>
                <div>
                  <p className={`text-sm mb-1 ${account.accountType === 'main' ? 'text-blue-100' : 'text-slate-400'}`}>
                    {account.name}
                  </p>
                  <p className={`text-2xl font-bold ${account.accountType === 'main' ? 'text-white' : 'text-white'}`}>
                    {formatBalance(account.balance, account.currency)}
                  </p>
                  <p className={`text-sm mt-2 ${account.accountType === 'main' ? 'text-blue-200' : 'text-slate-400'}`}>
                    {account.broker} • {account.leverage && account.leverage > 1 ? `1:${account.leverage} Leverage` : account.market}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fund Transfer Section */}
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center mb-4">
            <ArrowRightLeft className="w-5 h-5 text-blue-400 mr-2" />
            <h4 className="text-white font-medium">Internal Fund Transfer</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromAccount" className="text-slate-300">From Account</Label>
              <Select value={fromAccount} onValueChange={setFromAccount}>
                <SelectTrigger className="bg-slate-900 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} ({formatBalance(account.balance, account.currency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="toAccount" className="text-slate-300">To Account</Label>
              <Select value={toAccount} onValueChange={setToAccount}>
                <SelectTrigger className="bg-slate-900 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.id.toString() !== fromAccount).map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} ({formatBalance(account.balance, account.currency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transferAmount" className="text-slate-300">Amount</Label>
              <Input
                id="transferAmount"
                type="number"
                placeholder="1000"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="bg-slate-900 border-slate-600 text-slate-100"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleTransfer}
                disabled={transferFundsMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {transferFundsMutation.isPending ? "Transferring..." : "Transfer Funds"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
