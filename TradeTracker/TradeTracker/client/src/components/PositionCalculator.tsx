import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CalculationResult {
  positionSize: number;
  riskAmount: number;
  pipValue: number;
  pips: number;
  leverageUsed: number;
  marginRequired: number;
}

export default function PositionCalculator() {
  const [accountSize, setAccountSize] = useState("");
  const [riskPercentage, setRiskPercentage] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [leverage, setLeverage] = useState("1");
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/calculate/position-size", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleCalculate = () => {
    if (!accountSize || !riskPercentage || !entryPrice || !stopLoss) {
      return;
    }

    calculateMutation.mutate({
      accountSize,
      riskPercentage,
      entryPrice,
      stopLoss,
      leverage: parseInt(leverage),
    });
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Position Size Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="accountSize" className="text-slate-300">Account Size</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
            <Input
              id="accountSize"
              type="number"
              placeholder="2000"
              value={accountSize}
              onChange={(e) => setAccountSize(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 pl-8 font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="riskPercentage" className="text-slate-300">Risk %</Label>
          <div className="relative">
            <Input
              id="riskPercentage"
              type="number"
              step="0.1"
              placeholder="2.0"
              value={riskPercentage}
              onChange={(e) => setRiskPercentage(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 font-mono"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entryPrice" className="text-slate-300">Entry</Label>
            <Input
              id="entryPrice"
              type="number"
              step="0.00001"
              placeholder="1.0845"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stopLoss" className="text-slate-300">Stop Loss</Label>
            <Input
              id="stopLoss"
              type="number"
              step="0.00001"
              placeholder="1.0820"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="leverage" className="text-slate-300">Leverage</Label>
          <Input
            id="leverage"
            type="number"
            placeholder="1"
            value={leverage}
            onChange={(e) => setLeverage(e.target.value)}
            className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 font-mono"
          />
        </div>

        {result && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Recommended Position Size:</span>
              <span className="text-blue-400 font-mono font-bold">{result.positionSize} lots</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Risk Amount:</span>
              <span className="text-slate-300 font-mono">${result.riskAmount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Pip Value:</span>
              <span className="text-slate-300 font-mono">${result.pipValue}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Margin Required:</span>
              <span className="text-slate-300 font-mono">${result.marginRequired}</span>
            </div>
          </div>
        )}

        <Button 
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Calculator className="w-4 h-4 mr-2" />
          {calculateMutation.isPending ? "Calculating..." : "Calculate"}
        </Button>
      </CardContent>
    </Card>
  );
}
