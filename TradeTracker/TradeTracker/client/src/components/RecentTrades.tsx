import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Trade } from "@shared/schema";

export default function RecentTrades() {
  const { data: trades = [] } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
    select: (data) => data.slice(0, 5), // Show only 5 recent trades
  });

  const getMarketIcon = (market: string) => {
    switch (market) {
      case 'forex':
        return { icon: 'fas fa-exchange-alt', color: 'text-forex', bg: 'bg-forex' };
      case 'crypto':
        return { icon: 'fab fa-bitcoin', color: 'text-crypto', bg: 'bg-crypto' };
      case 'stocks':
        return { icon: 'fas fa-chart-line', color: 'text-stocks', bg: 'bg-stocks' };
      default:
        return { icon: 'fas fa-chart-line', color: 'text-slate-400', bg: 'bg-slate-400' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed':
        return 'bg-profit/20 text-profit';
      case 'open':
        return 'bg-yellow-600/20 text-yellow-400';
      default:
        return 'bg-slate-600/20 text-slate-400';
    }
  };

  const formatCurrency = (amount: string | null, currency: string) => {
    if (!amount) return "N/A";
    const symbol = currency === 'INR' ? '₹' : '$';
    const value = parseFloat(amount);
    return `${symbol}${Math.abs(value).toLocaleString()}`;
  };

  const formatPnL = (pnl: string | null, currency: string) => {
    if (!pnl) return "N/A";
    const value = parseFloat(pnl);
    const symbol = currency === 'INR' ? '₹' : '$';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${symbol}${value.toLocaleString()}`;
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Recent Trades</CardTitle>
          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trades.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No trades yet</p>
              <p className="text-sm">Start by logging your first trade</p>
            </div>
          ) : (
            trades.map((trade) => {
              const marketInfo = getMarketIcon(trade.market);
              return (
                <div key={trade.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 ${marketInfo.bg} bg-opacity-20 rounded-lg flex items-center justify-center`}>
                        <i className={`${marketInfo.icon} ${marketInfo.color} text-xs`}></i>
                      </div>
                      <div>
                        <p className="text-white font-medium">{trade.symbol}</p>
                        <p className="text-slate-400 text-sm">{trade.broker}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(trade.status)}>
                      {trade.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 text-sm">P&L</p>
                      <p className={`font-medium ${
                        trade.pnl && parseFloat(trade.pnl) >= 0 ? 'text-profit' : 'text-loss'
                      }`}>
                        {formatPnL(trade.pnl, trade.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">Size</p>
                      <p className="text-slate-300 text-sm font-mono">
                        {parseFloat(trade.positionSize).toFixed(2)} lots
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
