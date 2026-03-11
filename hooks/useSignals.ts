'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import type { Signal, SignalFilters, SignalType, SignalSeverity } from '@/types/signal';
import { useSignalStore } from '@/stores/signals';

interface UseSignalsOptions {
  autoFetch?: boolean;
  pollInterval?: number; // ms, 0 to disable
  pageSize?: number;
}

interface UseSignalsReturn {
  signals: Signal[];
  loading: boolean;
  error: string | null;
  filters: SignalFilters;
  page: number;
  totalCount: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
  fetchMore: () => Promise<void>;
  setFilters: (filters: Partial<SignalFilters>) => void;
  resetFilters: () => void;
  markAsRead: (signalId: string) => Promise<void>;
  dismiss: (signalId: string) => Promise<void>;
  classify: (headline: string, content: string, sourceTier?: number) => Promise<unknown>;
}

export function useSignals(options: UseSignalsOptions = {}): UseSignalsReturn {
  const {
    autoFetch = true,
    pollInterval = 0,
    pageSize = 25,
  } = options;

  const store = useSignalStore();
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const buildQueryString = useCallback(
    (page: number, filters: SignalFilters): string => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      if (filters.types?.length) params.set('types', filters.types.join(','));
      if (filters.severities?.length) params.set('severity', filters.severities.join(','));
      if (filters.companyId) params.set('companyId', filters.companyId);
      if (filters.dateRange?.start) params.set('dateFrom', filters.dateRange.start);
      if (filters.dateRange?.end) params.set('dateTo', filters.dateRange.end);

      return params.toString();
    },
    [pageSize]
  );

  const fetchSignals = useCallback(
    async (page = 1, append = false) => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLocalLoading(true);
      setLocalError(null);
      store.setLoading(true);

      try {
        const qs = buildQueryString(page, store.filters);
        const res = await fetch(`/api/signals/search?${qs}`, {
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json();

        if (append) {
          store.appendSignals(data.signals);
        } else {
          store.setSignals(data.signals);
        }

        store.setPage(page);
        store.setTotalCount(data.pagination.totalCount);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Failed to fetch signals';
        setLocalError(message);
        store.setError(message);
      } finally {
        setLocalLoading(false);
        store.setLoading(false);
      }
    },
    [store, buildQueryString]
  );

  const refetch = useCallback(() => fetchSignals(1, false), [fetchSignals]);

  const fetchMore = useCallback(() => {
    if (!store.hasMore || localLoading) return Promise.resolve();
    return fetchSignals(store.page + 1, true);
  }, [fetchSignals, store.hasMore, store.page, localLoading]);

  const setFilters = useCallback(
    (filters: Partial<SignalFilters>) => {
      store.setFilters(filters);
      // Trigger refetch on next tick (after state update)
      setTimeout(() => fetchSignals(1, false), 0);
    },
    [store, fetchSignals]
  );

  const resetFilters = useCallback(() => {
    store.resetFilters();
    setTimeout(() => fetchSignals(1, false), 0);
  }, [store, fetchSignals]);

  const markAsRead = useCallback(
    async (signalId: string) => {
      store.markAsRead(signalId);
      // In production: PATCH /api/signals/status
      // await fetch(`/api/signals/${signalId}/status`, { method: 'PATCH', body: ... });
    },
    [store]
  );

  const dismiss = useCallback(
    async (signalId: string) => {
      store.dismiss(signalId);
      // In production: PATCH /api/signals/status
    },
    [store]
  );

  const classify = useCallback(
    async (headline: string, content: string, sourceTier?: number) => {
      const res = await fetch('/api/signals/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, content, sourceTier }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      return res.json();
    },
    []
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchSignals(1, false);
    }

    return () => {
      abortRef.current?.abort();
    };
  }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling
  useEffect(() => {
    if (pollInterval > 0) {
      pollRef.current = setInterval(() => {
        fetchSignals(1, false);
      }, pollInterval);

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [pollInterval]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    signals: store.signals,
    loading: localLoading || store.loading,
    error: localError || store.error,
    filters: store.filters,
    page: store.page,
    totalCount: store.totalCount,
    hasMore: store.hasMore,
    refetch,
    fetchMore,
    setFilters,
    resetFilters,
    markAsRead,
    dismiss,
    classify,
  };
}
