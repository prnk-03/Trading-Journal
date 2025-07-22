import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { authService } from "./services/authService";
import { authenticateToken, type AuthenticatedRequest } from "./middleware/auth";
import { insertTradeSchema, insertAccountSchema, insertFundTransferSchema, registerUserSchema, loginUserSchema } from "@shared/schema";
import { z } from "zod";
import { currencyService } from "./services/currencyService";
import { calculationService } from "./services/calculationService";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      const result = await authService.register(userData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginUserSchema.parse(req.body);
      const result = await authService.login(credentials);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(401).json({ error: error instanceof Error ? error.message : "Login failed" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (token) {
        await authService.logout(token);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // Currency rates
  app.get("/api/currency/rate/:from/:to", async (req, res) => {
    try {
      const { from, to } = req.params;
      const rate = await currencyService.getExchangeRate(from.toUpperCase(), to.toUpperCase());
      res.json({ rate, from: from.toUpperCase(), to: to.toUpperCase() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exchange rate" });
    }
  });

  // Accounts
  app.get("/api/accounts", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const accounts = await storage.getUserAccounts(userId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const accountData = insertAccountSchema.parse({ ...req.body, userId });
      const account = await storage.createAccount(accountData);
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid account data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create account" });
      }
    }
  });

  // Trades
  app.get("/api/trades", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const trades = await storage.getUserTrades(userId, limit);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  // CSV Export
  app.get("/api/trades/export/csv", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const trades = await storage.getUserTrades(userId);
      
      // CSV Headers
      const csvHeaders = [
        'Date', 'Symbol', 'Market', 'Broker', 'Direction', 'Entry Price', 'Exit Price',
        'Stop Loss', 'Take Profit', 'Position Size', 'Quantity', 'Leverage', 'Currency',
        'P&L', 'Status', 'Entry Emotion', 'Exit Emotion', 'Confidence', 'Notes'
      ];
      
      // Convert trades to CSV format
      const csvRows = trades.map(trade => [
        trade.entryTime ? new Date(trade.entryTime).toLocaleDateString() : '',
        trade.symbol,
        trade.market,
        trade.broker,
        trade.direction,
        trade.entryPrice,
        trade.exitPrice || '',
        trade.stopLoss || '',
        trade.takeProfit || '',
        trade.positionSize || '',
        trade.quantity || '',
        trade.leverage,
        trade.currency,
        trade.pnl || '',
        trade.status,
        trade.entryEmotion || '',
        trade.exitEmotion || '',
        trade.confidenceLevel || '',
        trade.notes || ''
      ]);
      
      // Combine headers and rows
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      // Set headers for file download
      const filename = `trades_export_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ error: "Failed to export trades" });
    }
  });

  app.get("/api/trades/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const trade = await storage.getTrade(id);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }
      res.json(trade);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trade" });
    }
  });

  app.post("/api/trades", authenticateToken, upload.single('entryScreenshot'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      const tradeData = {
        ...req.body,
        userId,
        entryScreenshot: req.file ? req.file.filename : undefined,
      };

      const validatedData = insertTradeSchema.parse(tradeData);
      const trade = await storage.createTrade(validatedData);
      res.json(trade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid trade data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create trade" });
      }
    }
  });

  app.patch("/api/trades/:id", authenticateToken, upload.single('exitScreenshot'), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = {
        ...req.body,
        exitScreenshot: req.file ? req.file.filename : undefined,
        exitTime: req.body.status === 'closed' ? new Date() : undefined,
      };

      const trade = await storage.updateTrade(id, updates);
      res.json(trade);
    } catch (error) {
      res.status(500).json({ error: "Failed to update trade" });
    }
  });

  // Position Calculator
  app.post("/api/calculate/position-size", async (req, res) => {
    try {
      const { accountSize, riskPercentage, entryPrice, stopLoss, leverage = 1 } = req.body;
      
      const result = calculationService.calculatePositionSize({
        accountSize: parseFloat(accountSize),
        riskPercentage: parseFloat(riskPercentage),
        entryPrice: parseFloat(entryPrice),
        stopLoss: parseFloat(stopLoss),
        leverage: parseInt(leverage),
      });

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Invalid calculation parameters" });
    }
  });

  app.post("/api/calculate/profit-loss", async (req, res) => {
    try {
      const { entryPrice, exitPrice, positionSize, direction, leverage = 1 } = req.body;
      
      const result = calculationService.calculateProfitLoss({
        entryPrice: parseFloat(entryPrice),
        exitPrice: parseFloat(exitPrice),
        positionSize: parseFloat(positionSize),
        direction,
        leverage: parseInt(leverage),
      });

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Invalid calculation parameters" });
    }
  });

  // Fund Transfers
  app.post("/api/transfers", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const transferData = insertFundTransferSchema.parse({ ...req.body, userId });
      
      // Get account details for currency conversion
      const fromAccount = await storage.getAccount(transferData.fromAccountId);
      const toAccount = await storage.getAccount(transferData.toAccountId);
      
      if (!fromAccount || !toAccount) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Handle currency conversion if needed
      let convertedAmount = parseFloat(transferData.amount);
      let exchangeRate = 1;
      
      if (fromAccount.currency !== toAccount.currency) {
        const rate = await currencyService.getExchangeRate(fromAccount.currency, toAccount.currency);
        exchangeRate = rate;
        convertedAmount = parseFloat(transferData.amount) * rate;
      }

      const finalTransferData = {
        ...transferData,
        convertedAmount: convertedAmount.toString(),
        convertedCurrency: toAccount.currency,
        exchangeRate: exchangeRate.toString(),
      };

      const transfer = await storage.createFundTransfer(finalTransferData);

      // Update account balances
      const newFromBalance = (parseFloat(fromAccount.balance) - parseFloat(transferData.amount)).toString();
      const newToBalance = (parseFloat(toAccount.balance) + convertedAmount).toString();
      
      await storage.updateAccountBalance(fromAccount.id, newFromBalance);
      await storage.updateAccountBalance(toAccount.id, newToBalance);

      res.json(transfer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid transfer data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to process transfer" });
      }
    }
  });

  // Analytics
  app.get("/api/analytics/portfolio", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const portfolio = await storage.getUserPortfolioValue(userId);
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch portfolio data" });
    }
  });

  app.get("/api/analytics/stats", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const stats = await storage.getUserTradingStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trading stats" });
    }
  });

  // File uploads
  app.get("/api/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(process.cwd(), 'uploads', filename);
    res.sendFile(filepath);
  });

  const httpServer = createServer(app);
  return httpServer;
}
