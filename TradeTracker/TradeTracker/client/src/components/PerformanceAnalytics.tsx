import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";

export default function PerformanceAnalytics() {
  const { data: tradingStats } = useQuery<{ 
    totalTrades: number; 
    winRate: number; 
    avgWin: string; 
    avgLoss: string; 
    profitLoss: string; 
  }>({
    queryKey: ["/api/analytics/stats"],
  });

  const { convertToUSD, formatCurrency } = useCurrency();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Performance Chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Performance Overview</CardTitle>
            <div className="flex space-x-2">
              <Button size="sm" className="bg-blue-600 text-white">30D</Button>
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-200">90D</Button>
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-200">1Y</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Placeholder Chart Area */}
          <div className="h-64 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center mb-6">
            <div className="text-center">
              <i className="fas fa-chart-area text-slate-600 text-4xl mb-4"></i>
              <p className="text-slate-500">Performance chart coming soon</p>
              <p className="text-slate-600 text-sm">Chart integration in progress</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-slate-400 text-sm">Total Trades</p>
              <p className="text-white text-xl font-bold">{tradingStats?.totalTrades || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm">Avg Win</p>
              <p className="text-profit text-xl font-bold">${tradingStats?.avgWin || "0.00"}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm">Avg Loss</p>
              <p className="text-loss text-xl font-bold">${tradingStats?.avgLoss || "0.00"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Breakdown */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Market Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Forex Performance */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-forex bg-opacity-20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-exchange-alt text-forex"></i>
                  </div>
                  <div>
                    <p className="text-white font-medium">Forex</p>
                    <p className="text-slate-400 text-sm">71% win rate</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-profit font-bold">+$1,847.50</p>
                  <p className="text-slate-400 text-sm">USD</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-forex h-2 rounded-full" style={{ width: '71%' }}></div>
              </div>
            </div>

            {/* Crypto Performance */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-crypto bg-opacity-20 rounded-lg flex items-center justify-center">
                    <i className="fab fa-bitcoin text-crypto"></i>
                  </div>
                  <div>
                    <p className="text-white font-medium">Crypto</p>
                    <p className="text-slate-400 text-sm">58% win rate</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-profit font-bold">+$623.80</p>
                  <p className="text-slate-400 text-sm">USD</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-crypto h-2 rounded-full" style={{ width: '58%' }}></div>
              </div>
            </div>

            {/* Stocks Performance */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-stocks bg-opacity-20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-chart-line text-stocks"></i>
                  </div>
                  <div>
                    <p className="text-white font-medium">Indian Stocks</p>
                    <p className="text-slate-400 text-sm">64% win rate</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-loss font-bold">-₹12,450</p>
                  <p className="text-slate-400 text-sm">INR</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-stocks h-2 rounded-full" style={{ width: '64%' }}></div>
              </div>
            </div>
          </div>

          {/* Currency Conversion Display */}
          <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Portfolio (USD Equivalent)</span>
              <span className="text-white font-bold font-mono">$4,250.83</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-slate-500 text-sm">Exchange Rate (INR/USD)</span>
              <span className="text-slate-400 text-sm font-mono">83.24</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
