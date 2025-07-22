import {
  users,
  accounts,
  trades,
  currencyRates,
  fundTransfers,
  userSessions,
  type User,
  type InsertUser,
  type Account,
  type InsertAccount,
  type Trade,
  type InsertTrade,
  type CurrencyRate,
  type InsertCurrencyRate,
  type FundTransfer,
  type InsertFundTransfer,
  type UserSession,
  type InsertUserSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sum, count, avg } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // User Sessions
  getUserSession(token: string): Promise<UserSession | undefined>;
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  deleteUserSession(token: string): Promise<void>;

  // Accounts
  getUserAccounts(userId: number): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccountBalance(accountId: number, newBalance: string): Promise<void>;

  // Trades
  getUserTrades(userId: number, limit?: number): Promise<Trade[]>;
  getAccountTrades(accountId: number): Promise<Trade[]>;
  getTrade(id: number): Promise<Trade | undefined>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, updates: Partial<Trade>): Promise<Trade>;

  // Currency Rates
  getCurrencyRate(fromCurrency: string, toCurrency: string): Promise<CurrencyRate | undefined>;
  updateCurrencyRate(rate: InsertCurrencyRate): Promise<CurrencyRate>;

  // Fund Transfers
  createFundTransfer(transfer: InsertFundTransfer): Promise<FundTransfer>;
  getUserTransfers(userId: number): Promise<FundTransfer[]>;

  // Analytics
  getUserPortfolioValue(userId: number): Promise<{ totalValue: string; currency: string }>;
  getUserTradingStats(userId: number): Promise<{
    totalTrades: number;
    winRate: number;
    avgWin: string;
    avgLoss: string;
    profitLoss: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // User Sessions
  async getUserSession(token: string): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.token, token));
    return session || undefined;
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [userSession] = await db.insert(userSessions).values(session).returning();
    return userSession;
  }

  async deleteUserSession(token: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.token, token));
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.userId, userId));
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccountBalance(accountId: number, newBalance: string): Promise<void> {
    await db.update(accounts).set({ balance: newBalance }).where(eq(accounts.id, accountId));
  }

  async getUserTrades(userId: number, limit?: number): Promise<Trade[]> {
    const query = db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.entryTime));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async getAccountTrades(accountId: number): Promise<Trade[]> {
    return await db.select().from(trades).where(eq(trades.accountId, accountId)).orderBy(desc(trades.entryTime));
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade || undefined;
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [newTrade] = await db.insert(trades).values(trade).returning();
    return newTrade;
  }

  async updateTrade(id: number, updates: Partial<Trade>): Promise<Trade> {
    const [updatedTrade] = await db.update(trades).set(updates).where(eq(trades.id, id)).returning();
    return updatedTrade;
  }

  async getCurrencyRate(fromCurrency: string, toCurrency: string): Promise<CurrencyRate | undefined> {
    const [rate] = await db
      .select()
      .from(currencyRates)
      .where(and(eq(currencyRates.fromCurrency, fromCurrency), eq(currencyRates.toCurrency, toCurrency)));
    return rate || undefined;
  }

  async updateCurrencyRate(rate: InsertCurrencyRate): Promise<CurrencyRate> {
    const existing = await this.getCurrencyRate(rate.fromCurrency, rate.toCurrency);
    
    if (existing) {
      const [updatedRate] = await db
        .update(currencyRates)
        .set({ rate: rate.rate, updatedAt: new Date() })
        .where(eq(currencyRates.id, existing.id))
        .returning();
      return updatedRate;
    } else {
      const [newRate] = await db.insert(currencyRates).values(rate).returning();
      return newRate;
    }
  }

  async createFundTransfer(transfer: InsertFundTransfer): Promise<FundTransfer> {
    const [newTransfer] = await db.insert(fundTransfers).values(transfer).returning();
    return newTransfer;
  }

  async getUserTransfers(userId: number): Promise<FundTransfer[]> {
    return await db.select().from(fundTransfers).where(eq(fundTransfers.userId, userId)).orderBy(desc(fundTransfers.transferTime));
  }

  async getUserPortfolioValue(userId: number): Promise<{ totalValue: string; currency: string }> {
    const userAccounts = await this.getUserAccounts(userId);
    let totalValueUsd = 0;

    for (const account of userAccounts) {
      let valueInUsd = parseFloat(account.balance);
      
      if (account.currency === 'INR') {
        const rate = await this.getCurrencyRate('INR', 'USD');
        if (rate) {
          valueInUsd = valueInUsd / parseFloat(rate.rate);
        }
      }
      
      totalValueUsd += valueInUsd;
    }

    return {
      totalValue: totalValueUsd.toFixed(2),
      currency: 'USD'
    };
  }

  async getUserTradingStats(userId: number): Promise<{
    totalTrades: number;
    winRate: number;
    avgWin: string;
    avgLoss: string;
    profitLoss: string;
  }> {
    const closedTrades = await db
      .select()
      .from(trades)
      .where(and(eq(trades.userId, userId), eq(trades.status, 'closed')));

    const totalTrades = closedTrades.length;
    
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        avgWin: '0.00',
        avgLoss: '0.00',
        profitLoss: '0.00'
      };
    }

    const winningTrades = closedTrades.filter(t => parseFloat(t.pnl || '0') > 0);
    const losingTrades = closedTrades.filter(t => parseFloat(t.pnl || '0') < 0);
    
    const winRate = (winningTrades.length / totalTrades) * 100;
    
    const avgWin = winningTrades.length > 0 
      ? (winningTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0) / winningTrades.length).toFixed(2)
      : '0.00';
    
    const avgLoss = losingTrades.length > 0
      ? (losingTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0) / losingTrades.length).toFixed(2)
      : '0.00';
    
    const profitLoss = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0).toFixed(2);

    return {
      totalTrades,
      winRate: parseFloat(winRate.toFixed(1)),
      avgWin,
      avgLoss,
      profitLoss
    };
  }
}

export const storage = new DatabaseStorage();
