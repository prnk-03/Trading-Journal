import { useState } from "react";
import TradeEntryForm from "@/components/TradeEntryForm";
import AccountSwitcher from "@/components/AccountSwitcher";
import PositionCalculator from "@/components/PositionCalculator";
import RecentTrades from "@/components/RecentTrades";
import PerformanceAnalytics from "@/components/PerformanceAnalytics";
import AccountManagement from "@/components/AccountManagement";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Moon, Sun, Bell, Plus, Download, LogOut, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const { user, logout, exportTrades } = useAuth();
  const { toast } = useToast();

  // Fetch portfolio data
  const { data: portfolioData } = useQuery<{ totalValue: string; currency: string }>({
    queryKey: ["/api/analytics/portfolio"],
  });

  const { data: tradingStats } = useQuery<{ 
    totalTrades: number; 
    winRate: number; 
    avgWin: string; 
    avgLoss: string; 
    profitLoss: string; 
  }>({
    queryKey: ["/api/analytics/stats"],
  });

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleExportTrades = async () => {
    try {
      await exportTrades();
      toast({
        title: "Export Successful",
        description: "Your trades have been exported to CSV.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export trades. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-white text-sm"></i>
                </div>
                <h1 className="text-xl font-bold text-white">TradeMaster Pro</h1>
              </div>
              
              <AccountSwitcher 
                selectedAccountId={selectedAccountId}
                onAccountChange={setSelectedAccountId}
              />
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-blue-400 font-medium">Dashboard</a>
              <a href="#" className="text-slate-400 hover:text-slate-200">Trades</a>
              <a href="#" className="text-slate-400 hover:text-slate-200">Analytics</a>
              <a href="#" className="text-slate-400 hover:text-slate-200">Accounts</a>
              <a href="#" className="text-slate-400 hover:text-slate-200">Calculator</a>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportTrades}
                className="text-slate-400 hover:text-slate-200"
                title="Export Trades to CSV"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="text-slate-400 hover:text-slate-200"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl} alt={user?.username} />
                      <AvatarFallback className="bg-blue-600">
                        {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.firstName || user?.username}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportTrades}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Trades
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
              
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-sm font-medium">
                JK
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Overview */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Trading Dashboard</h2>
              <p className="text-slate-400">Track your performance across all markets</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-4 sm:mt-0">
              <Plus className="w-4 h-4 mr-2" />
              New Trade
            </Button>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Portfolio Value */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-600 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-wallet text-blue-400"></i>
                </div>
                <span className="text-slate-400 text-sm">24h</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Portfolio</p>
                <p className="text-2xl font-bold text-white">
                  ${portfolioData?.totalValue || "0.00"}
                </p>
                <p className="text-profit text-sm font-medium">
                  <i className="fas fa-arrow-up"></i> +5.2% (+$210.50)
                </p>
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-profit bg-opacity-20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-target text-profit"></i>
                </div>
                <span className="text-slate-400 text-sm">30d</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Win Rate</p>
                <p className="text-2xl font-bold text-white">
                  {tradingStats?.winRate || 0}%
                </p>
                <p className="text-profit text-sm font-medium">
                  <i className="fas fa-arrow-up"></i> +2.1%
                </p>
              </div>
            </div>

            {/* Active Trades */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-crypto bg-opacity-20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-crypto"></i>
                </div>
                <span className="text-slate-400 text-sm">Live</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Active Trades</p>
                <p className="text-2xl font-bold text-white">12</p>
                <p className="text-slate-400 text-sm font-medium">
                  <i className="fas fa-clock"></i> 3 pending
                </p>
              </div>
            </div>

            {/* Profit/Loss */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-forex bg-opacity-20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shield-alt text-forex"></i>
                </div>
                <span className="text-slate-400 text-sm">Total</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Total P&L</p>
                <p className="text-2xl font-bold text-white">
                  ${tradingStats?.profitLoss || "0.00"}
                </p>
                <p className="text-profit text-sm font-medium">
                  <i className="fas fa-check"></i> Profitable
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trade Entry Form */}
          <div className="lg:col-span-2">
            <TradeEntryForm selectedAccountId={selectedAccountId} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <RecentTrades />
            <PositionCalculator />
          </div>
        </div>

        {/* Performance Analytics */}
        <div className="mt-8">
          <PerformanceAnalytics />
        </div>

        {/* Account Management */}
        <div className="mt-8">
          <AccountManagement />
        </div>
      </div>
    </div>
  );
}
