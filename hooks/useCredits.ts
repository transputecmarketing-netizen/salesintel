'use client';

import { useState, useCallback, useEffect } from 'react';

import { useUserStore } from '@/stores/user';
import type { CreditUsage, PlanTier } from '@/types/billing';
import { PLANS } from '@/types/billing';

interface CreditBreakdown {
  research: number;
  deepResearch: number;
  enrichment: number;
  outreach: number;
  signals: number;
  other: number;
}

interface UseCreditsReturn {
  credits: CreditUsage;
  planTier: PlanTier;
  planName: string;
  planLimit: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
  remainingCredits: number;
  percentUsed: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canAfford: (cost: number) => boolean;
  consume: (amount: number, category?: string) => Promise<boolean>;
  getBreakdown: () => CreditBreakdown;
  getDaysUntilReset: () => number;
}

export function useCredits(): UseCreditsReturn {
  const userStore = useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<CreditBreakdown>({
    research: 0,
    deepResearch: 0,
    enrichment: 0,
    outreach: 0,
    signals: 0,
    other: 0,
  });

  const credits = userStore.credits;
  const planTier = userStore.planTier;
  const plan = PLANS[planTier];
  const remainingCredits = Math.max(0, credits.limit - credits.used);
  const percentUsed = credits.limit > 0 ? Math.round((credits.used / credits.limit) * 100) : 0;
  const isNearLimit = percentUsed >= 80;
  const isOverLimit = credits.used >= credits.limit && credits.limit > 0;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // In production: fetch from API
      // const res = await fetch('/api/billing/credits');
      // const data = await res.json();
      // userStore.setCredits(data.credits);
      // setBreakdown(data.breakdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh credits');
    } finally {
      setLoading(false);
    }
  }, []);

  const canAfford = useCallback(
    (cost: number): boolean => {
      if (planTier === 'enterprise') return true; // Unlimited
      return credits.used + cost <= credits.limit;
    },
    [credits, planTier]
  );

  const consume = useCallback(
    async (amount: number, _category?: string): Promise<boolean> => {
      if (!canAfford(amount)) {
        setError('Insufficient credits');
        return false;
      }

      try {
        // In production: POST /api/billing/consume
        userStore.consumeCredits(amount);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to consume credits');
        return false;
      }
    },
    [canAfford, userStore]
  );

  const getBreakdown = useCallback(() => breakdown, [breakdown]);

  const getDaysUntilReset = useCallback(() => {
    if (!credits.resetDate) return 30;
    const resetTime = new Date(credits.resetDate).getTime();
    const now = Date.now();
    const diffMs = resetTime - now;
    return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  }, [credits.resetDate]);

  // Auto-refresh on mount
  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    credits,
    planTier,
    planName: plan.name,
    planLimit: plan.creditsPerMonth,
    isNearLimit,
    isOverLimit,
    remainingCredits,
    percentUsed,
    loading,
    error,
    refresh,
    canAfford,
    consume,
    getBreakdown,
    getDaysUntilReset,
  };
}
