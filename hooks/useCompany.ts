'use client';

import { useState, useCallback } from 'react';

import type { Company, CompanyScores } from '@/types/company';
import type { BuyingWindowPrediction, ConvergenceResult } from '@/types/research';

interface CompanyIntelligence {
  company: Company | null;
  scores: CompanyScores | null;
  buyingWindow: BuyingWindowPrediction | null;
  convergence: ConvergenceResult | null;
  propensity: {
    score: number;
    tier: string;
    topContributors: Array<{ factor: string; score: number; contribution: number }>;
  } | null;
  brief: {
    executiveSummary: string;
    sections: Array<{ title: string; content: string; priority: string }>;
    keyInsights: string[];
    recommendedActions: string[];
  } | null;
}

interface UseCompanyReturn {
  intelligence: CompanyIntelligence;
  loading: boolean;
  error: string | null;
  fetchScores: (companyId: string) => Promise<void>;
  fetchPropensity: (companyId: string) => Promise<void>;
  fetchBuyingWindow: (companyId: string) => Promise<void>;
  fetchConvergence: (companyId: string, windowDays?: number) => Promise<void>;
  fetchBrief: (companyId: string) => Promise<void>;
  fetchCascade: (signalId: string) => Promise<unknown>;
  enrichCompany: (params: { domain?: string; name?: string }) => Promise<unknown>;
  enrichTechStack: (domain: string) => Promise<unknown>;
  enrichFunding: (companyName: string) => Promise<unknown>;
  enrichFinancial: (params: { ticker?: string; companyName?: string }) => Promise<unknown>;
  enrichJobs: (companyName: string, domain?: string) => Promise<unknown>;
  fetchAll: (companyId: string) => Promise<void>;
}

async function apiPost<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export function useCompany(): UseCompanyReturn {
  const [intelligence, setIntelligence] = useState<CompanyIntelligence>({
    company: null,
    scores: null,
    buyingWindow: null,
    convergence: null,
    propensity: null,
    brief: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withLoading = useCallback(async (fn: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchScores = useCallback(
    async (companyId: string) => {
      await withLoading(async () => {
        const data = await apiPost<{ scores: CompanyScores }>('/api/intelligence/score', { companyId });
        setIntelligence((prev) => ({ ...prev, scores: data.scores }));
      });
    },
    [withLoading]
  );

  const fetchPropensity = useCallback(
    async (companyId: string) => {
      await withLoading(async () => {
        const data = await apiPost<{
          propensityScore: number;
          tier: string;
          topContributors: Array<{ factor: string; score: number; contribution: number }>;
        }>('/api/intelligence/propensity', { companyId });
        setIntelligence((prev) => ({
          ...prev,
          propensity: {
            score: data.propensityScore,
            tier: data.tier,
            topContributors: data.topContributors,
          },
        }));
      });
    },
    [withLoading]
  );

  const fetchBuyingWindow = useCallback(
    async (companyId: string) => {
      await withLoading(async () => {
        const data = await apiPost<{ prediction: BuyingWindowPrediction }>(
          '/api/intelligence/window',
          { companyId }
        );
        setIntelligence((prev) => ({ ...prev, buyingWindow: data.prediction }));
      });
    },
    [withLoading]
  );

  const fetchConvergence = useCallback(
    async (companyId: string, windowDays?: number) => {
      await withLoading(async () => {
        const data = await apiPost<{ convergence: ConvergenceResult | null }>(
          '/api/intelligence/convergence',
          { companyId, windowDays }
        );
        setIntelligence((prev) => ({ ...prev, convergence: data.convergence }));
      });
    },
    [withLoading]
  );

  const fetchBrief = useCallback(
    async (companyId: string) => {
      await withLoading(async () => {
        const data = await apiPost<{
          brief: {
            executiveSummary: string;
            sections: Array<{ title: string; content: string; priority: string }>;
            keyInsights: string[];
            recommendedActions: string[];
          };
        }>('/api/intelligence/brief', { companyId });
        setIntelligence((prev) => ({ ...prev, brief: data.brief }));
      });
    },
    [withLoading]
  );

  const fetchCascade = useCallback(
    async (signalId: string) => {
      return apiPost('/api/intelligence/cascade', { signalId });
    },
    []
  );

  const enrichCompany = useCallback(
    async (params: { domain?: string; name?: string }) => {
      return apiPost('/api/enrichment/company', params);
    },
    []
  );

  const enrichTechStack = useCallback(
    async (domain: string) => {
      return apiPost('/api/enrichment/techstack', { domain });
    },
    []
  );

  const enrichFunding = useCallback(
    async (companyName: string) => {
      return apiPost('/api/enrichment/funding', { companyName });
    },
    []
  );

  const enrichFinancial = useCallback(
    async (params: { ticker?: string; companyName?: string }) => {
      return apiPost('/api/enrichment/financial', params);
    },
    []
  );

  const enrichJobs = useCallback(
    async (companyName: string, domain?: string) => {
      return apiPost('/api/enrichment/jobs', { companyName, domain });
    },
    []
  );

  const fetchAll = useCallback(
    async (companyId: string) => {
      setLoading(true);
      setError(null);
      try {
        await Promise.allSettled([
          fetchScores(companyId),
          fetchPropensity(companyId),
          fetchBuyingWindow(companyId),
          fetchConvergence(companyId),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    },
    [fetchScores, fetchPropensity, fetchBuyingWindow, fetchConvergence]
  );

  return {
    intelligence,
    loading,
    error,
    fetchScores,
    fetchPropensity,
    fetchBuyingWindow,
    fetchConvergence,
    fetchBrief,
    fetchCascade,
    enrichCompany,
    enrichTechStack,
    enrichFunding,
    enrichFinancial,
    enrichJobs,
    fetchAll,
  };
}
