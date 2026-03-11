import { create } from 'zustand';

import type { Company, CompanyScores } from '@/types/company';

export interface Target {
  id: string;
  userId: string;
  companyId: string;
  priority: number;
  notes: string | null;
  tags: string[];
  addedAt: string;
  createdAt: string;
  // Joined data
  company?: Company;
  scores?: CompanyScores;
  recentSignalCount?: number;
}

type SortField = 'addedAt' | 'priority' | 'healthScore' | 'companyName' | 'recentSignals';
type SortDirection = 'asc' | 'desc';

interface TargetFilters {
  search: string;
  tags: string[];
  minPriority: number;
  industry: string | null;
}

interface TargetState {
  // Data
  targets: Target[];
  loading: boolean;
  error: string | null;

  // Filters & sorting
  filters: TargetFilters;
  sortField: SortField;
  sortDirection: SortDirection;

  // Actions
  setTargets: (targets: Target[]) => void;
  addTarget: (target: Target) => void;
  removeTarget: (targetId: string) => void;
  updateTarget: (targetId: string, updates: Partial<Target>) => void;
  updatePriority: (targetId: string, priority: number) => void;
  updateTags: (targetId: string, tags: string[]) => void;
  updateNotes: (targetId: string, notes: string) => void;

  // Filter & sort actions
  setFilters: (filters: Partial<TargetFilters>) => void;
  resetFilters: () => void;
  setSort: (field: SortField, direction?: SortDirection) => void;

  // Loading/error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getFilteredTargets: () => Target[];
  getSortedTargets: () => Target[];
  getTargetByCompanyId: (companyId: string) => Target | undefined;
  getAllTags: () => string[];
}

const DEFAULT_FILTERS: TargetFilters = {
  search: '',
  tags: [],
  minPriority: 0,
  industry: null,
};

export const useTargetStore = create<TargetState>((set, get) => ({
  // Initial state
  targets: [],
  loading: false,
  error: null,
  filters: { ...DEFAULT_FILTERS },
  sortField: 'addedAt',
  sortDirection: 'desc',

  // Target CRUD
  setTargets: (targets) => set({ targets, error: null }),

  addTarget: (target) =>
    set((state) => ({ targets: [target, ...state.targets] })),

  removeTarget: (targetId) =>
    set((state) => ({
      targets: state.targets.filter((t) => t.id !== targetId),
    })),

  updateTarget: (targetId, updates) =>
    set((state) => ({
      targets: state.targets.map((t) =>
        t.id === targetId ? { ...t, ...updates } : t
      ),
    })),

  updatePriority: (targetId, priority) =>
    set((state) => ({
      targets: state.targets.map((t) =>
        t.id === targetId ? { ...t, priority } : t
      ),
    })),

  updateTags: (targetId, tags) =>
    set((state) => ({
      targets: state.targets.map((t) =>
        t.id === targetId ? { ...t, tags } : t
      ),
    })),

  updateNotes: (targetId, notes) =>
    set((state) => ({
      targets: state.targets.map((t) =>
        t.id === targetId ? { ...t, notes } : t
      ),
    })),

  // Filters
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () =>
    set({ filters: { ...DEFAULT_FILTERS } }),

  setSort: (field, direction) =>
    set((state) => ({
      sortField: field,
      sortDirection: direction ?? (state.sortField === field && state.sortDirection === 'asc' ? 'desc' : 'asc'),
    })),

  // Loading/error
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  // Computed getters
  getFilteredTargets: () => {
    const { targets, filters } = get();
    return targets.filter((t) => {
      if (filters.search && t.company) {
        const searchLower = filters.search.toLowerCase();
        if (
          !t.company.name.toLowerCase().includes(searchLower) &&
          !(t.company.domain ?? '').toLowerCase().includes(searchLower) &&
          !(t.company.industry ?? '').toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      if (filters.tags.length > 0) {
        if (!filters.tags.some((tag) => t.tags.includes(tag))) return false;
      }

      if (filters.minPriority > 0 && t.priority < filters.minPriority) return false;

      if (filters.industry && t.company?.industry !== filters.industry) return false;

      return true;
    });
  },

  getSortedTargets: () => {
    const { sortField, sortDirection } = get();
    const filtered = get().getFilteredTargets();

    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'addedAt':
          comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          break;
        case 'priority':
          comparison = a.priority - b.priority;
          break;
        case 'healthScore':
          comparison = (a.scores?.healthScore ?? 0) - (b.scores?.healthScore ?? 0);
          break;
        case 'companyName':
          comparison = (a.company?.name ?? '').localeCompare(b.company?.name ?? '');
          break;
        case 'recentSignals':
          comparison = (a.recentSignalCount ?? 0) - (b.recentSignalCount ?? 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  },

  getTargetByCompanyId: (companyId) =>
    get().targets.find((t) => t.companyId === companyId),

  getAllTags: () => {
    const allTags = new Set<string>();
    for (const target of get().targets) {
      for (const tag of target.tags) {
        allTags.add(tag);
      }
    }
    return Array.from(allTags).sort();
  },
}));
