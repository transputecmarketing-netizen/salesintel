import { CREDIT_COSTS } from '@/lib/utils/constants';

export interface CreditBalance {
  userId: string;
  available: number;
  used: number;
  limit: number;
  percentage: number;
  resetDate: string;
  lastUpdated: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  operation: 'consume' | 'refund' | 'reset' | 'bonus';
  reason: string;
  jobId: string | null;
  balanceAfter: number;
  createdAt: string;
}

export interface CreditCheckResult {
  allowed: boolean;
  currentBalance: number;
  requiredCredits: number;
  shortfall: number;
}

// In-memory store for development/testing. Production uses database.
const creditBalances = new Map<string, CreditBalance>();
const creditTransactions = new Map<string, CreditTransaction[]>();

function getMonthlyResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}

/**
 * Get the current credit balance for a user.
 */
export async function getBalance(userId: string): Promise<CreditBalance> {
  const existing = creditBalances.get(userId);
  if (existing) {
    // Check if balance needs monthly reset
    if (new Date(existing.resetDate) <= new Date()) {
      return resetBalance(userId, existing.limit);
    }
    return existing;
  }

  // Default balance for new users (free tier)
  return {
    userId,
    available: 100,
    used: 0,
    limit: 100,
    percentage: 0,
    resetDate: getMonthlyResetDate(),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Check if a user has enough credits for an operation.
 */
export async function checkCredits(
  userId: string,
  requiredCredits: number
): Promise<CreditCheckResult> {
  const balance = await getBalance(userId);

  return {
    allowed: balance.available >= requiredCredits,
    currentBalance: balance.available,
    requiredCredits,
    shortfall: Math.max(0, requiredCredits - balance.available),
  };
}

/**
 * Consume credits for an operation. Returns false if insufficient balance.
 */
export async function consumeCredits(
  userId: string,
  amount: number,
  reason: string,
  jobId: string | null = null
): Promise<{ success: boolean; balance: CreditBalance; transaction?: CreditTransaction }> {
  const balance = await getBalance(userId);

  if (balance.available < amount) {
    return { success: false, balance };
  }

  const newBalance: CreditBalance = {
    ...balance,
    available: balance.available - amount,
    used: balance.used + amount,
    percentage: Math.round(((balance.used + amount) / balance.limit) * 100),
    lastUpdated: new Date().toISOString(),
  };

  creditBalances.set(userId, newBalance);

  const transaction: CreditTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    amount: -amount,
    operation: 'consume',
    reason,
    jobId,
    balanceAfter: newBalance.available,
    createdAt: new Date().toISOString(),
  };

  const transactions = creditTransactions.get(userId) ?? [];
  transactions.push(transaction);
  creditTransactions.set(userId, transactions);

  return { success: true, balance: newBalance, transaction };
}

/**
 * Refund credits to a user (e.g., if a job fails).
 */
export async function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  jobId: string | null = null
): Promise<CreditBalance> {
  const balance = await getBalance(userId);

  const newBalance: CreditBalance = {
    ...balance,
    available: Math.min(balance.available + amount, balance.limit),
    used: Math.max(balance.used - amount, 0),
    percentage: Math.round((Math.max(balance.used - amount, 0) / balance.limit) * 100),
    lastUpdated: new Date().toISOString(),
  };

  creditBalances.set(userId, newBalance);

  const transaction: CreditTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    amount,
    operation: 'refund',
    reason,
    jobId,
    balanceAfter: newBalance.available,
    createdAt: new Date().toISOString(),
  };

  const transactions = creditTransactions.get(userId) ?? [];
  transactions.push(transaction);
  creditTransactions.set(userId, transactions);

  return newBalance;
}

/**
 * Reset balance at the start of a new billing period.
 */
export async function resetBalance(userId: string, limit: number): Promise<CreditBalance> {
  const newBalance: CreditBalance = {
    userId,
    available: limit,
    used: 0,
    limit,
    percentage: 0,
    resetDate: getMonthlyResetDate(),
    lastUpdated: new Date().toISOString(),
  };

  creditBalances.set(userId, newBalance);

  const transaction: CreditTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    amount: limit,
    operation: 'reset',
    reason: 'Monthly credit reset',
    jobId: null,
    balanceAfter: limit,
    createdAt: new Date().toISOString(),
  };

  const transactions = creditTransactions.get(userId) ?? [];
  transactions.push(transaction);
  creditTransactions.set(userId, transactions);

  return newBalance;
}

/**
 * Set a user's credit limit (e.g., when they upgrade plans).
 */
export async function setCreditLimit(userId: string, newLimit: number): Promise<CreditBalance> {
  const balance = await getBalance(userId);
  const additionalCredits = Math.max(0, newLimit - balance.limit);

  const newBalance: CreditBalance = {
    ...balance,
    available: balance.available + additionalCredits,
    limit: newLimit,
    percentage: Math.round((balance.used / newLimit) * 100),
    lastUpdated: new Date().toISOString(),
  };

  creditBalances.set(userId, newBalance);
  return newBalance;
}

/**
 * Get credit transaction history for a user.
 */
export async function getTransactionHistory(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<CreditTransaction[]> {
  const transactions = creditTransactions.get(userId) ?? [];
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 50;

  return sorted.slice(offset, offset + limit);
}

/**
 * Get the credit cost for a specific operation.
 */
export function getCreditCost(operation: keyof typeof CREDIT_COSTS): number {
  return CREDIT_COSTS[operation] ?? 0;
}
