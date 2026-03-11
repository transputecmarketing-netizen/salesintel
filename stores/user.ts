import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PlanTier, CreditUsage } from '@/types/billing';
import type { SignalType, SignalSeverity } from '@/types/signal';

interface ICPConfig {
  industries: string[];
  companySize: { min: number; max: number };
  fundingStages: string[];
  geoTargets: string[];
  techStackRequired: string[];
  techStackPreferred: string[];
  excludeIndustries: string[];
}

interface NotificationPreferences {
  emailDigest: boolean;
  emailDigestFrequency: 'daily' | 'weekly' | 'realtime';
  signalAlerts: boolean;
  signalAlertTypes: SignalType[];
  signalAlertMinSeverity: SignalSeverity;
  researchComplete: boolean;
  weeklyReport: boolean;
  browserNotifications: boolean;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  defaultSignalView: 'feed' | 'table' | 'kanban';
  signalSortBy: 'detectedAt' | 'severity' | 'intentScore';
  signalSortDirection: 'asc' | 'desc';
  dashboardLayout: 'default' | 'compact' | 'expanded';
  timezone: string;
  dateFormat: 'relative' | 'absolute' | 'both';
}

interface UserState {
  // User data
  userId: string | null;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  planTier: PlanTier;
  credits: CreditUsage;

  // Preferences
  preferences: UserPreferences;
  notifications: NotificationPreferences;
  icpConfig: ICPConfig;

  // Actions - User data
  setUser: (data: {
    userId: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    planTier: PlanTier;
  }) => void;
  clearUser: () => void;
  setCredits: (credits: CreditUsage) => void;
  consumeCredits: (amount: number) => void;

  // Actions - Preferences
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  setTheme: (theme: UserPreferences['theme']) => void;
  resetPreferences: () => void;

  // Actions - Notifications
  setNotifications: (notifs: Partial<NotificationPreferences>) => void;
  toggleEmailDigest: () => void;
  toggleSignalAlerts: () => void;

  // Actions - ICP
  setICPConfig: (config: Partial<ICPConfig>) => void;
  resetICPConfig: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  compactMode: false,
  defaultSignalView: 'feed',
  signalSortBy: 'detectedAt',
  signalSortDirection: 'desc',
  dashboardLayout: 'default',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'relative',
};

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  emailDigest: true,
  emailDigestFrequency: 'daily',
  signalAlerts: true,
  signalAlertTypes: ['funding', 'hiring', 'leadership', 'technology', 'competitive'],
  signalAlertMinSeverity: 'medium',
  researchComplete: true,
  weeklyReport: true,
  browserNotifications: false,
};

const DEFAULT_ICP: ICPConfig = {
  industries: [],
  companySize: { min: 50, max: 10000 },
  fundingStages: [],
  geoTargets: [],
  techStackRequired: [],
  techStackPreferred: [],
  excludeIndustries: [],
};

const DEFAULT_CREDITS: CreditUsage = {
  used: 0,
  limit: 100,
  percentage: 0,
  resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export const useUserStore = create<UserState>()(
  persist(
    (set, _get) => ({
      // Initial state
      userId: null,
      email: null,
      fullName: null,
      avatarUrl: null,
      planTier: 'free' as PlanTier,
      credits: { ...DEFAULT_CREDITS },
      preferences: { ...DEFAULT_PREFERENCES },
      notifications: { ...DEFAULT_NOTIFICATIONS },
      icpConfig: { ...DEFAULT_ICP },

      // User data actions
      setUser: (data) =>
        set({
          userId: data.userId,
          email: data.email,
          fullName: data.fullName,
          avatarUrl: data.avatarUrl,
          planTier: data.planTier,
        }),

      clearUser: () =>
        set({
          userId: null,
          email: null,
          fullName: null,
          avatarUrl: null,
          planTier: 'free',
          credits: { ...DEFAULT_CREDITS },
        }),

      setCredits: (credits) => set({ credits }),

      consumeCredits: (amount) =>
        set((state) => {
          const newUsed = state.credits.used + amount;
          return {
            credits: {
              ...state.credits,
              used: newUsed,
              percentage: state.credits.limit > 0
                ? Math.round((newUsed / state.credits.limit) * 100)
                : 100,
            },
          };
        }),

      // Preference actions
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      setTheme: (theme) =>
        set((state) => ({
          preferences: { ...state.preferences, theme },
        })),

      resetPreferences: () =>
        set({ preferences: { ...DEFAULT_PREFERENCES } }),

      // Notification actions
      setNotifications: (notifs) =>
        set((state) => ({
          notifications: { ...state.notifications, ...notifs },
        })),

      toggleEmailDigest: () =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            emailDigest: !state.notifications.emailDigest,
          },
        })),

      toggleSignalAlerts: () =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            signalAlerts: !state.notifications.signalAlerts,
          },
        })),

      // ICP actions
      setICPConfig: (config) =>
        set((state) => ({
          icpConfig: { ...state.icpConfig, ...config },
        })),

      resetICPConfig: () =>
        set({ icpConfig: { ...DEFAULT_ICP } }),
    }),
    {
      name: 'salesintel-user-preferences',
      partialize: (state) => ({
        preferences: state.preferences,
        notifications: state.notifications,
        icpConfig: state.icpConfig,
      }),
    }
  )
);
