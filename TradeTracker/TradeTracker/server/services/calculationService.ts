interface PositionSizeParams {
  accountSize: number;
  riskPercentage: number;
  entryPrice: number;
  stopLoss: number;
  leverage?: number;
}

interface ProfitLossParams {
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  direction: 'long' | 'short';
  leverage?: number;
}

interface PositionSizeResult {
  positionSize: number;
  riskAmount: number;
  pipValue: number;
  pips: number;
  leverageUsed: number;
  marginRequired: number;
}

interface ProfitLossResult {
  profitLoss: number;
  pips: number;
  percentage: number;
}

class CalculationService {
  calculatePositionSize(params: PositionSizeParams): PositionSizeResult {
    const { accountSize, riskPercentage, entryPrice, stopLoss, leverage = 1 } = params;
    
    // Calculate risk amount
    const riskAmount = (accountSize * riskPercentage) / 100;
    
    // Calculate pip difference
    const pipDifference = Math.abs(entryPrice - stopLoss);
    
    // For forex pairs, typically 1 pip = 0.0001
    // For JPY pairs, 1 pip = 0.01
    const pipSize = entryPrice > 10 ? 0.01 : 0.0001;
    const pips = pipDifference / pipSize;
    
    // Standard lot size (100,000 units for forex)
    const standardLotSize = 100000;
    
    // Calculate pip value for standard lot
    // For most pairs: pip value = (pip size / quote currency rate) * lot size
    const pipValuePerStandardLot = (pipSize / entryPrice) * standardLotSize;
    
    // Calculate position size in lots
    const positionSizeInUnits = riskAmount / (pips * pipValuePerStandardLot);
    const positionSizeLots = positionSizeInUnits / standardLotSize;
    
    // Apply leverage
    const leveragedPositionSize = positionSizeLots * leverage;
    
    // Calculate margin required
    const marginRequired = (leveragedPositionSize * standardLotSize * entryPrice) / leverage;
    
    // Calculate pip value for this position
    const pipValue = leveragedPositionSize * pipValuePerStandardLot * standardLotSize;

    return {
      positionSize: Number(leveragedPositionSize.toFixed(2)),
      riskAmount: Number(riskAmount.toFixed(2)),
      pipValue: Number(pipValue.toFixed(2)),
      pips: Number(pips.toFixed(1)),
      leverageUsed: leverage,
      marginRequired: Number(marginRequired.toFixed(2)),
    };
  }

  calculateProfitLoss(params: ProfitLossParams): ProfitLossResult {
    const { entryPrice, exitPrice, positionSize, direction, leverage = 1 } = params;
    
    // Calculate price difference
    let priceDifference = direction === 'long' 
      ? exitPrice - entryPrice 
      : entryPrice - exitPrice;
    
    // Calculate pip difference
    const pipSize = entryPrice > 10 ? 0.01 : 0.0001;
    const pips = priceDifference / pipSize;
    
    // Calculate P&L
    const standardLotSize = 100000;
    const positionValue = positionSize * standardLotSize;
    const profitLoss = (priceDifference / entryPrice) * positionValue * leverage;
    
    // Calculate percentage return
    const marginUsed = (positionSize * standardLotSize * entryPrice) / leverage;
    const percentage = (profitLoss / marginUsed) * 100;

    return {
      profitLoss: Number(profitLoss.toFixed(2)),
      pips: Number(pips.toFixed(1)),
      percentage: Number(percentage.toFixed(2)),
    };
  }

  calculateRiskReward(entryPrice: number, stopLoss: number, takeProfit: number, direction: 'long' | 'short'): { ratio: string; riskPips: number; rewardPips: number } {
    const pipSize = entryPrice > 10 ? 0.01 : 0.0001;
    
    let riskPips: number;
    let rewardPips: number;
    
    if (direction === 'long') {
      riskPips = (entryPrice - stopLoss) / pipSize;
      rewardPips = (takeProfit - entryPrice) / pipSize;
    } else {
      riskPips = (stopLoss - entryPrice) / pipSize;
      rewardPips = (entryPrice - takeProfit) / pipSize;
    }
    
    const ratio = rewardPips / riskPips;
    
    return {
      ratio: `1:${ratio.toFixed(2)}`,
      riskPips: Number(riskPips.toFixed(1)),
      rewardPips: Number(rewardPips.toFixed(1)),
    };
  }

  calculateBreakevenWinRate(riskRewardRatio: number): number {
    return (1 / (1 + riskRewardRatio)) * 100;
  }

  calculateLiquidationPrice(entryPrice: number, leverage: number, direction: 'long' | 'short', maintenanceMargin: number = 0.5): number {
    // Simplified liquidation calculation
    // Real liquidation depends on exchange-specific parameters
    
    const liquidationPercentage = (100 - maintenanceMargin) / leverage / 100;
    
    if (direction === 'long') {
      return entryPrice * (1 - liquidationPercentage);
    } else {
      return entryPrice * (1 + liquidationPercentage);
    }
  }
}

export const calculationService = new CalculationService();
