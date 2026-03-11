'use client';

import { useState, useCallback, useEffect } from 'react';

import { useTargetStore, type Target } from '@/stores/targets';

interface UseTargetsOptions {
  autoFetch?: boolean;
}

interface UseTargetsReturn {
  targets: Target[];
  filteredTargets: Target[];
  loading: boolean;
  error: string | null;
  allTags: string[];
  fetch: () => Promise<void>;
  addTarget: (companyId: string, options?: { priority?: number; tags?: string[]; notes?: string }) => Promise<void>;
  removeTarget: (targetId: string) => Promise<void>;
  updatePriority: (targetId: string, priority: number) => Promise<void>;
  updateTags: (targetId: string, tags: string[]) => Promise<void>;
  updateNotes: (targetId: string, notes: string) => Promise<void>;
  isTracked: (companyId: string) => boolean;
  setSearch: (search: string) => void;
  setTagFilter: (tags: string[]) => void;
  setSort: (field: 'addedAt' | 'priority' | 'healthScore' | 'companyName' | 'recentSignals') => void;
}

export function useTargets(options: UseTargetsOptions = {}): UseTargetsReturn {
  const { autoFetch = true } = options;
  const store = useTargetStore();
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const fetchTargets = useCallback(async () => {
    setLocalLoading(true);
    setLocalError(null);
    store.setLoading(true);

    try {
      // In production: fetch from API
      // const res = await fetch('/api/targets');
      // const data = await res.json();
      // store.setTargets(data.targets);

      // For now, targets are loaded from the store / API when available
      store.setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch targets';
      setLocalError(message);
      store.setError(message);
    } finally {
      setLocalLoading(false);
      store.setLoading(false);
    }
  }, [store]);

  const addTarget = useCallback(
    async (
      companyId: string,
      options?: { priority?: number; tags?: string[]; notes?: string }
    ) => {
      setLocalLoading(true);
      setLocalError(null);

      try {
        // In production: POST /api/targets
        // const res = await fetch('/api/targets', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ companyId, ...options }),
        // });
        // const data = await res.json();

        const newTarget: Target = {
          id: crypto.randomUUID(),
          userId: '',
          companyId,
          priority: options?.priority ?? 0,
          notes: options?.notes ?? null,
          tags: options?.tags ?? [],
          addedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        store.addTarget(newTarget);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add target';
        setLocalError(message);
        throw err;
      } finally {
        setLocalLoading(false);
      }
    },
    [store]
  );

  const removeTarget = useCallback(
    async (targetId: string) => {
      setLocalLoading(true);
      setLocalError(null);

      try {
        // In production: DELETE /api/targets/:id
        store.removeTarget(targetId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove target';
        setLocalError(message);
        throw err;
      } finally {
        setLocalLoading(false);
      }
    },
    [store]
  );

  const updatePriority = useCallback(
    async (targetId: string, priority: number) => {
      try {
        // In production: PATCH /api/targets/:id
        store.updatePriority(targetId, priority);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update priority';
        setLocalError(message);
      }
    },
    [store]
  );

  const updateTags = useCallback(
    async (targetId: string, tags: string[]) => {
      try {
        store.updateTags(targetId, tags);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update tags';
        setLocalError(message);
      }
    },
    [store]
  );

  const updateNotes = useCallback(
    async (targetId: string, notes: string) => {
      try {
        store.updateNotes(targetId, notes);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update notes';
        setLocalError(message);
      }
    },
    [store]
  );

  const isTracked = useCallback(
    (companyId: string) => {
      return store.getTargetByCompanyId(companyId) !== undefined;
    },
    [store]
  );

  const setSearch = useCallback(
    (search: string) => store.setFilters({ search }),
    [store]
  );

  const setTagFilter = useCallback(
    (tags: string[]) => store.setFilters({ tags }),
    [store]
  );

  const setSort = useCallback(
    (field: 'addedAt' | 'priority' | 'healthScore' | 'companyName' | 'recentSignals') => store.setSort(field),
    [store]
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchTargets();
    }
  }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    targets: store.targets,
    filteredTargets: store.getSortedTargets(),
    loading: localLoading || store.loading,
    error: localError || store.error,
    allTags: store.getAllTags(),
    fetch: fetchTargets,
    addTarget,
    removeTarget,
    updatePriority,
    updateTags,
    updateNotes,
    isTracked,
    setSearch,
    setTagFilter,
    setSort,
  };
}
