import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import FileUpload from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Save } from "lucide-react";
import { useAccounts } from "@/hooks/use-accounts";

const tradeSchema = z.object({
  accountId: z.number(),
  symbol: z.string().min(1, "Symbol is required"),
  direction: z.enum(["long", "short"]),
  market: z.string().min(1, "Market is required"),
  broker: z.string().min(1, "Broker is required"),
  entryPrice: z.string().min(1, "Entry price is required"),
  stopLoss: z.string().optional(),
  takeProfit: z.string().optional(),
  positionSize: z.string().optional(),
  quantity: z.string().optional(),
  leverage: z.number().default(1),
  riskPercentage: z.string().optional(),
  usedAmount: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  notes: z.string().optional(),
  entryEmotion: z.string().optional(),
  confidenceLevel: z.number().optional(),
}).refine((data) => {
  // For Indian stocks, quantity is required instead of position size
  if (data.market === "Indian Stocks") {
    return data.quantity && !isNaN(parseInt(data.quantity));
  }
  // For other markets, position size is required
  return data.positionSize && !isNaN(parseFloat(data.positionSize));
}, {
  message: "Either position size (for forex/crypto) or quantity (for stocks) is required",
  path: ["positionSize"],
});

type TradeFormData = z.infer<typeof tradeSchema>;

interface TradeEntryFormProps {
  selectedAccountId: number | null;
}

export default function TradeEntryForm({ selectedAccountId }: TradeEntryFormProps) {
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [confidenceLevel, setConfidenceLevel] = useState([7]);
  const [entryScreenshot, setEntryScreenshot] = useState<File | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: accounts } = useAccounts(1);

  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      direction: "long",
      leverage: 1,
      confidenceLevel: 7,
      accountId: selectedAccountId || 0,
    },
  });

  // Auto-set currency based on market
  useEffect(() => {
    if (selectedMarket === "Indian Stocks" || selectedMarket === "Indian Forex") {
      form.setValue("currency", "INR");
    } else if (selectedMarket === "Crypto" || selectedMarket === "International Forex") {
      form.setValue("currency", "USD");
    }
  }, [selectedMarket, form]);

  // Check if current market uses quantities (Indian stocks)
  const usesQuantities = selectedMarket === "Indian Stocks";
  const isIndianMarket = selectedMarket === "Indian Stocks" || selectedMarket === "Indian Forex";

  const createTradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      if (entryScreenshot) {
        formData.append('entryScreenshot', entryScreenshot);
      }

      return apiRequest("POST", "/api/trades", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      toast({
        title: "Trade logged successfully",
        description: "Your trade entry has been recorded.",
      });
      form.reset();
      setEntryScreenshot(null);
    },
    onError: (error) => {
      toast({
        title: "Error logging trade",
        description: "Please check your inputs and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TradeFormData) => {
    if (!selectedAccountId) {
      toast({
        title: "No account selected",
        description: "Please select an account first.",
        variant: "destructive",
      });
      return;
    }

    createTradeMutation.mutate({
      ...data,
      accountId: selectedAccountId,
      direction,
      confidenceLevel: confidenceLevel[0],
    });
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          Log New Trade
          <span className="px-3 py-1 bg-blue-600 bg-opacity-20 text-blue-400 rounded-full text-sm font-medium">
            Entry
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Market and Broker Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="market" className="text-slate-300">Market</Label>
              <Select onValueChange={(value) => {
                form.setValue("market", value);
                setSelectedMarket(value);
              }}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Select market" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="International Forex">International Forex (USD)</SelectItem>
                  <SelectItem value="Crypto">Crypto (USD)</SelectItem>
                  <SelectItem value="Indian Stocks">Indian Stocks (INR)</SelectItem>
                  <SelectItem value="Indian Forex">Indian Forex (INR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="broker" className="text-slate-300">Broker</Label>
              <Select onValueChange={(value) => form.setValue("broker", value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Select broker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exness">Exness MT4</SelectItem>
                  <SelectItem value="xm">XM Global</SelectItem>
                  <SelectItem value="binance">Binance Futures</SelectItem>
                  <SelectItem value="dhan">Dhan</SelectItem>
                  <SelectItem value="grow">Grow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Symbol and Direction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol" className="text-slate-300">Symbol</Label>
              <Input
                {...form.register("symbol")}
                placeholder="EUR/USD"
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Direction</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={direction === "long" ? "default" : "outline"}
                  className={direction === "long" 
                    ? "flex-1 bg-profit text-white hover:bg-profit/90" 
                    : "flex-1 bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                  }
                  onClick={() => setDirection("long")}
                >
                  <i className="fas fa-arrow-up mr-2"></i>Long
                </Button>
                <Button
                  type="button"
                  variant={direction === "short" ? "default" : "outline"}
                  className={direction === "short" 
                    ? "flex-1 bg-loss text-white hover:bg-loss/90" 
                    : "flex-1 bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                  }
                  onClick={() => setDirection("short")}
                >
                  <i className="fas fa-arrow-down mr-2"></i>Short
                </Button>
              </div>
            </div>
          </div>

          {/* Price Levels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryPrice" className="text-slate-300">Entry Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  {isIndianMarket ? "₹" : "$"}
                </span>
                <Input
                  {...form.register("entryPrice")}
                  type="number"
                  step={isIndianMarket ? "0.01" : "0.00001"}
                  placeholder={isIndianMarket ? "150.50" : "1.08450"}
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 pl-8 font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stopLoss" className="text-slate-300">Stop Loss</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  {isIndianMarket ? "₹" : "$"}
                </span>
                <Input
                  {...form.register("stopLoss")}
                  type="number"
                  step={isIndianMarket ? "0.01" : "0.00001"}
                  placeholder={isIndianMarket ? "148.20" : "1.08200"}
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 pl-8 font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="takeProfit" className="text-slate-300">Take Profit</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  {isIndianMarket ? "₹" : "$"}
                </span>
                <Input
                  {...form.register("takeProfit")}
                  type="number"
                  step={isIndianMarket ? "0.01" : "0.00001"}
                  placeholder={isIndianMarket ? "154.95" : "1.08950"}
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 pl-8 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Position Sizing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {usesQuantities ? (
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-slate-300">Quantity</Label>
                <div className="relative">
                  <Input
                    {...form.register("quantity")}
                    type="number"
                    step="1"
                    placeholder="100"
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 font-mono"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">shares</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="positionSize" className="text-slate-300">Position Size</Label>
                <div className="relative">
                  <Input
                    {...form.register("positionSize")}
                    type="number"
                    step="0.01"
                    placeholder="0.50"
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 font-mono"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">lots</span>
                </div>
              </div>
            )}
            
            {usesQuantities && (
              <div className="space-y-2">
                <Label htmlFor="usedAmount" className="text-slate-300">Amount Used</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">₹</span>
                  <Input
                    {...form.register("usedAmount")}
                    type="number"
                    step="0.01"
                    placeholder="15000.00"
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 pl-8 font-mono"
                  />
                </div>
              </div>
            )}
            
            {!usesQuantities && (
              <div className="space-y-2">
                <Label htmlFor="leverage" className="text-slate-300">Leverage</Label>
                <Select onValueChange={(value) => form.setValue("leverage", parseInt(value))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
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
            )}
          </div>

          {/* Risk Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="riskPercentage" className="text-slate-300">Risk %</Label>
              <div className="relative">
                <Input
                  {...form.register("riskPercentage")}
                  type="number"
                  step="0.1"
                  placeholder="2.0"
                  max="5"
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 font-mono"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-slate-300">Currency</Label>
              <Select 
                value={form.watch("currency")} 
                onValueChange={(value) => form.setValue("currency", value)}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Entry Screenshot */}
          <div className="space-y-2">
            <Label className="text-slate-300">Entry Screenshot</Label>
            <FileUpload
              onFileSelect={setEntryScreenshot}
              accept="image/*"
              className="border-slate-700 hover:border-slate-600"
            />
          </div>

          {/* Trading Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">Trade Notes</Label>
            <Textarea
              {...form.register("notes")}
              placeholder="Describe your trade setup, rationale, and key observations..."
              rows={4}
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 resize-none"
            />
          </div>

          {/* Emotion Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryEmotion" className="text-slate-300">Pre-Trade Emotion</Label>
              <Select onValueChange={(value) => form.setValue("entryEmotion", value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Select emotion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calm">😌 Calm & Focused</SelectItem>
                  <SelectItem value="anxious">😰 Anxious</SelectItem>
                  <SelectItem value="overconfident">😤 Overconfident</SelectItem>
                  <SelectItem value="fearful">😨 Fearful</SelectItem>
                  <SelectItem value="uncertain">🤔 Uncertain</SelectItem>
                  <SelectItem value="optimistic">😊 Optimistic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Confidence Level</Label>
              <div className="flex items-center space-x-3">
                <span className="text-slate-400 text-sm">Low</span>
                <Slider
                  value={confidenceLevel}
                  onValueChange={setConfidenceLevel}
                  max={10}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <span className="text-slate-400 text-sm">High</span>
                <span className="text-blue-400 font-medium w-8 text-center">
                  {confidenceLevel[0]}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={createTradeMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              {createTradeMutation.isPending ? "Logging..." : "Log Trade Entry"}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              className="bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
