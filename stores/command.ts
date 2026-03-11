import { create } from 'zustand';

interface CommandResult {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  category: 'navigation' | 'action' | 'search' | 'company' | 'contact' | 'signal';
  action: () => void;
  keywords?: string[];
  shortcut?: string;
}

interface CommandState {
  // State
  isOpen: boolean;
  query: string;
  results: CommandResult[];
  selectedIndex: number;
  loading: boolean;
  recentCommands: CommandResult[];
  registeredCommands: CommandResult[];

  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  setResults: (results: CommandResult[]) => void;
  setLoading: (loading: boolean) => void;

  // Selection
  selectResult: (index: number) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  executeSelected: () => void;
  executeResult: (result: CommandResult) => void;

  // Command registration
  registerCommands: (commands: CommandResult[]) => void;
  unregisterCommands: (ids: string[]) => void;

  // Search
  search: (query: string) => CommandResult[];
}

const MAX_RECENT = 5;

export const useCommandStore = create<CommandState>((set, get) => ({
  // Initial state
  isOpen: false,
  query: '',
  results: [],
  selectedIndex: 0,
  loading: false,
  recentCommands: [],
  registeredCommands: [],

  // Open/close
  open: () =>
    set({
      isOpen: true,
      query: '',
      selectedIndex: 0,
      results: get().recentCommands.length > 0 ? get().recentCommands : get().registeredCommands.slice(0, 10),
    }),

  close: () =>
    set({
      isOpen: false,
      query: '',
      results: [],
      selectedIndex: 0,
    }),

  toggle: () => {
    const state = get();
    if (state.isOpen) {
      state.close();
    } else {
      state.open();
    }
  },

  setQuery: (query) => {
    const results = get().search(query);
    set({ query, results, selectedIndex: 0 });
  },

  setResults: (results) => set({ results, selectedIndex: 0 }),
  setLoading: (loading) => set({ loading }),

  // Selection navigation
  selectResult: (index) =>
    set((state) => ({
      selectedIndex: Math.max(0, Math.min(index, state.results.length - 1)),
    })),

  selectNext: () =>
    set((state) => ({
      selectedIndex:
        state.results.length > 0
          ? (state.selectedIndex + 1) % state.results.length
          : 0,
    })),

  selectPrevious: () =>
    set((state) => ({
      selectedIndex:
        state.results.length > 0
          ? (state.selectedIndex - 1 + state.results.length) % state.results.length
          : 0,
    })),

  executeSelected: () => {
    const state = get();
    const selected = state.results[state.selectedIndex];
    if (selected) {
      state.executeResult(selected);
    }
  },

  executeResult: (result) => {
    // Add to recent commands
    set((state) => ({
      recentCommands: [
        result,
        ...state.recentCommands.filter((r) => r.id !== result.id),
      ].slice(0, MAX_RECENT),
    }));

    // Close the palette and execute
    get().close();
    result.action();
  },

  // Command registration
  registerCommands: (commands) =>
    set((state) => {
      const existingIds = new Set(state.registeredCommands.map((c) => c.id));
      const newCommands = commands.filter((c) => !existingIds.has(c.id));
      return {
        registeredCommands: [...state.registeredCommands, ...newCommands],
      };
    }),

  unregisterCommands: (ids) =>
    set((state) => ({
      registeredCommands: state.registeredCommands.filter(
        (c) => !ids.includes(c.id)
      ),
    })),

  // Search function
  search: (query) => {
    if (!query.trim()) {
      const state = get();
      return state.recentCommands.length > 0
        ? state.recentCommands
        : state.registeredCommands.slice(0, 10);
    }

    const lowerQuery = query.toLowerCase();
    const { registeredCommands } = get();

    return registeredCommands
      .map((cmd) => {
        let score = 0;

        // Label match (highest weight)
        if (cmd.label.toLowerCase().includes(lowerQuery)) {
          score += 10;
          if (cmd.label.toLowerCase().startsWith(lowerQuery)) score += 5;
        }

        // Description match
        if (cmd.description?.toLowerCase().includes(lowerQuery)) {
          score += 5;
        }

        // Keyword match
        if (cmd.keywords?.some((kw) => kw.toLowerCase().includes(lowerQuery))) {
          score += 7;
        }

        // Category match
        if (cmd.category.toLowerCase().includes(lowerQuery)) {
          score += 3;
        }

        return { cmd, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ cmd }) => cmd)
      .slice(0, 15);
  },
}));

export type { CommandResult };
