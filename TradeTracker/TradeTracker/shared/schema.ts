import { pgTable, text, serial, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User sessions for JWT token management
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  broker: text("broker").notNull(),
  market: text("market").notNull(), // forex, crypto, stocks
  currency: text("currency").notNull(), // USD, INR
  accountType: text("account_type").notNull(), // main, sub
  parentAccountId: integer("parent_account_id"),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull(),
  leverage: integer("leverage").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountId: integer("account_id").notNull(),
  symbol: text("symbol").notNull(),
  direction: text("direction").notNull(), // long, short
  market: text("market").notNull(),
  broker: text("broker").notNull(),
  entryPrice: decimal("entry_price", { precision: 15, scale: 8 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 15, scale: 8 }),
  stopLoss: decimal("stop_loss", { precision: 15, scale: 8 }),
  takeProfit: decimal("take_profit", { precision: 15, scale: 8 }),
  positionSize: decimal("position_size", { precision: 15, scale: 8 }),
  quantity: integer("quantity"), // For stocks - number of shares
  leverage: integer("leverage").default(1),
  riskPercentage: decimal("risk_percentage", { precision: 5, scale: 2 }),
  riskAmount: decimal("risk_amount", { precision: 15, scale: 2 }),
  usedAmount: decimal("used_amount", { precision: 15, scale: 2 }), // Amount used for this trade
  pnl: decimal("pnl", { precision: 15, scale: 2 }),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("open"), // open, closed, pending
  entryTime: timestamp("entry_time").defaultNow(),
  exitTime: timestamp("exit_time"),
  notes: text("notes"),
  entryEmotion: text("entry_emotion"),
  exitEmotion: text("exit_emotion"),
  confidenceLevel: integer("confidence_level"),
  entryScreenshot: text("entry_screenshot"),
  exitScreenshot: text("exit_screenshot"),
  tags: text("tags").array(),
});

export const currencyRates = pgTable("currency_rates", {
  id: serial("id").primaryKey(),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  rate: decimal("rate", { precision: 15, scale: 8 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fundTransfers = pgTable("fund_transfers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fromAccountId: integer("from_account_id").notNull(),
  toAccountId: integer("to_account_id").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  convertedAmount: decimal("converted_amount", { precision: 15, scale: 2 }),
  convertedCurrency: text("converted_currency"),
  exchangeRate: decimal("exchange_rate", { precision: 15, scale: 8 }),
  transferTime: timestamp("transfer_time").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  trades: many(trades),
  fundTransfers: many(fundTransfers),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  parentAccount: one(accounts, {
    fields: [accounts.parentAccountId],
    references: [accounts.id],
  }),
  subAccounts: many(accounts),
  trades: many(trades),
  fromTransfers: many(fundTransfers, {
    relationName: "fromAccount",
  }),
  toTransfers: many(fundTransfers, {
    relationName: "toAccount",
  }),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  user: one(users, {
    fields: [trades.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [trades.accountId],
    references: [accounts.id],
  }),
}));

export const fundTransfersRelations = relations(fundTransfers, ({ one }) => ({
  user: one(users, {
    fields: [fundTransfers.userId],
    references: [users.id],
  }),
  fromAccount: one(accounts, {
    fields: [fundTransfers.fromAccountId],
    references: [accounts.id],
    relationName: "fromAccount",
  }),
  toAccount: one(accounts, {
    fields: [fundTransfers.toAccountId],
    references: [accounts.id],
    relationName: "toAccount",
  }),
}));

// Relations for user sessions
export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const registerUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
}).extend({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  entryTime: true,
  exitTime: true,
});

export const insertCurrencyRateSchema = createInsertSchema(currencyRates).omit({
  id: true,
  updatedAt: true,
});

export const insertFundTransferSchema = createInsertSchema(fundTransfers).omit({
  id: true,
  transferTime: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export type CurrencyRate = typeof currencyRates.$inferSelect;
export type InsertCurrencyRate = z.infer<typeof insertCurrencyRateSchema>;

export type FundTransfer = typeof fundTransfers.$inferSelect;
export type InsertFundTransfer = z.infer<typeof insertFundTransferSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
