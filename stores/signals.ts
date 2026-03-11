import { create } from 'zustand';

import type {
  Signal,
  SignalType,
  SignalSeverity,
  SignalFilters,
  UserSignalStatus,
} from '@/types/signal';

interface SignalState {
  // Data
  signals: Signal[];
  selectedSignal: Signal | null;
  filters: SignalFilters;
  loading: boolean;
  error: string | null;

  // Pagination
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;

  // Actions
  setSignals: (signals: Signal[]) => void;
  appendSignals: (signals: Signal[]) => void;
  addSignal: (signal: Signal) => void;
  removeSignal: (signalId: string) => void;
  selectSignal: (signal: Signal | null) => void;

  // Filter actions
  setFilters: (filters: Partial<SignalFilters>) => void;
  resetFilters: () => void;
  updateFilter: <K extends keyof SignalFilters>(key: K, value: SignalFilters[K]) => void;

  // Status actions
  markAsRead: (signalId: string) => void;
  markAsActioned: (signalId: string) => void;
  dismiss: (signalId: string) => void;
  bulkUpdateStatus: (signalIds: string[], status: UserSignalStatus) => void;

  // Loading/error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Pagination
  setPage: (page: number) => void;
  setTotalCount: (count: number) => void;
  nextPage: () => void;
}

const DEFAULT_FILTERS: SignalFilters = {
  types: undefined,
  severities: undefined,
  dateRange: undefined,
  companyId: undefined,
  status: undefined,
  minIntentScore: undefined,
};

export const useSignalStore = create<SignalState>((set, get) => ({
  // Initial state
  signals: [],
  selectedSignal: null,
  filters: { ...DEFAULT_FILTERS },
  loading: false,
  error: null,
  page: 1,
  pageSize: 25,
  totalCount: 0,
  hasMore: false,

  // Signal CRUD
  setSignals: (signals) =>
    set({ signals, error: null }),

  appendSignals: (newSignals) =>
    set((state) => ({
      signals: [...state.signals, ...newSignals],
      hasMore: newSignals.length === state.pageSize,
    })),

  addSignal: (signal) =>
    set((state) => ({
      signals: [signal, ...state.signals],
      totalCount: state.totalCount + 1,
    })),

  removeSignal: (signalId) =>
    set((state) => ({
      signals: state.signals.filter((s) => s.id !== signalId),
      totalCount: Math.max(0, state.totalCount - 1),
      selectedSignal:
        state.selectedSignal?.id === signalId ? null : state.selectedSignal,
    })),

  selectSignal: (signal) =>
    set({ selectedSignal: signal }),

  // Filters
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      page: 1, // Reset page on filter change
    })),

  resetFilters: () =>
    set({ filters: { ...DEFAULT_FILTERS }, page: 1 }),

  updateFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      page: 1,
    })),

  // Status updates
  markAsRead: (signalId) =>
    set((state) => ({
      signals: state.signals.map((s) =>
        s.id === signalId ? { ...s, userStatus: 'read' as const } : s
      ),
    })),

  markAsActioned: (signalId) =>
    set((state) => ({
      signals: state.signals.map((s) =>
        s.id === signalId ? { ...s, userStatus: 'actioned' as const } : s
      ),
    })),

  dismiss: (signalId) =>
    set((state) => ({
      signals: state.signals.map((s) =>
        s.id === signalId ? { ...s, userStatus: 'dismissed' as const } : s
      ),
    })),

  bulkUpdateStatus: (signalIds, status) =>
    set((state) => ({
      signals: state.signals.map((s) =>
        signalIds.includes(s.id) ? { ...s, userStatus: status } : s
      ),
    })),

  // Loading/error
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  // Pagination
  setPage: (page) => set({ page }),
  setTotalCount: (totalCount) =>
    set((state) => ({
      totalCount,
      hasMore: state.page * state.pageSize < totalCount,
    })),
  nextPage: () => {
    const state = get();
    if (state.hasMore) {
      set({ page: state.page + 1 });
    }
  },
}));
