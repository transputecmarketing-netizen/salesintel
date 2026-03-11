import type { PlanTier } from '@/types/billing';
import { PLANS } from '@/types/billing';

export type Feature =
  | 'basic_signals'
  | 'company_research'
  | 'deep_research'
  | 'ai_outreach'
  | 'buying_window'
  | 'signal_convergence'
  | 'team_collaboration'
  | 'shared_watchlists'
  | 'crm_integrations'
  | 'analytics_dashboard'
  | 'priority_signals'
  | 'custom_integrations'
  | 'sso_saml'
  | 'dedicated_support'
  | 'on_premise'
  | 'unlimited_credits'
  | 'api_access';

const FEATURE_TIERS: Record<Feature, PlanTier[]> = {
  basic_signals: ['free', 'pro', 'team', 'enterprise'],
  company_research: ['free', 'pro', 'team', 'enterprise'],
  deep_research: ['pro', 'team', 'enterprise'],
  ai_outreach: ['free', 'pro', 'team', 'enterprise'],
  buying_window: ['pro', 'team', 'enterprise'],
  signal_convergence: ['pro', 'team', 'enterprise'],
  team_collaboration: ['team', 'enterprise'],
  shared_watchlists: ['team', 'enterprise'],
  crm_integrations: ['team', 'enterprise'],
  analytics_dashboard: ['team', 'enterprise'],
  priority_signals: ['pro', 'team', 'enterprise'],
  custom_integrations: ['enterprise'],
  sso_saml: ['enterprise'],
  dedicated_support: ['enterprise'],
  on_premise: ['enterprise'],
  unlimited_credits: ['enterprise'],
  api_access: ['pro', 'team', 'enterprise'],
};

const OUTREACH_LIMITS: Record<PlanTier, number> = {
  free: 10,
  pro: -1, // unlimited
  team: -1,
  enterprise: -1,
};

export interface FeatureCheck {
  allowed: boolean;
  reason?: string;
  requiredTier?: PlanTier;
  upgradeMessage?: string;
}

/**
 * Check if a feature is available for a given plan tier.
 */
export function checkFeatureAccess(tier: PlanTier, feature: Feature): FeatureCheck {
  const allowedTiers = FEATURE_TIERS[feature];
  if (!allowedTiers) {
    return { allowed: false, reason: 'Unknown feature' };
  }

  if (allowedTiers.includes(tier)) {
    return { allowed: true };
  }

  const requiredTier = allowedTiers[0] as PlanTier;
  const plan = PLANS[requiredTier];

  return {
    allowed: false,
    reason: `${feature.replace(/_/g, ' ')} requires ${plan.name} plan or higher`,
    requiredTier,
    upgradeMessage: `Upgrade to ${plan.name} ($${plan.priceMonthly}/mo) to unlock ${feature.replace(/_/g, ' ')}`,
  };
}

/**
 * Check if a user can add more targets to their watchlist.
 */
export function checkTargetLimit(tier: PlanTier, currentTargets: number): FeatureCheck {
  const plan = PLANS[tier];
  if (plan.maxTargets === -1) {
    return { allowed: true };
  }

  if (currentTargets < plan.maxTargets) {
    return { allowed: true };
  }

  const nextTier = getUpgradeTier(tier);
  const nextPlan = nextTier ? PLANS[nextTier] : null;

  return {
    allowed: false,
    reason: `You've reached the maximum of ${plan.maxTargets} targets on the ${plan.name} plan`,
    requiredTier: nextTier ?? undefined,
    upgradeMessage: nextPlan
      ? `Upgrade to ${nextPlan.name} ($${nextPlan.priceMonthly}/mo) for up to ${nextPlan.maxTargets === -1 ? 'unlimited' : nextPlan.maxTargets} targets`
      : 'Contact sales for custom limits',
  };
}

/**
 * Check if a user can add more team members.
 */
export function checkTeamLimit(tier: PlanTier, currentMembers: number): FeatureCheck {
  const plan = PLANS[tier];
  if (plan.maxTeamMembers === -1) {
    return { allowed: true };
  }

  if (currentMembers < plan.maxTeamMembers) {
    return { allowed: true };
  }

  const nextTier = getUpgradeTier(tier);
  const nextPlan = nextTier ? PLANS[nextTier] : null;

  return {
    allowed: false,
    reason: `You've reached the maximum of ${plan.maxTeamMembers} team members on the ${plan.name} plan`,
    requiredTier: nextTier ?? undefined,
    upgradeMessage: nextPlan
      ? `Upgrade to ${nextPlan.name} ($${nextPlan.priceMonthly}/mo) for up to ${nextPlan.maxTeamMembers === -1 ? 'unlimited' : nextPlan.maxTeamMembers} team members`
      : 'Contact sales for custom limits',
  };
}

/**
 * Check outreach draft limits.
 */
export function checkOutreachLimit(tier: PlanTier, draftsThisMonth: number): FeatureCheck {
  const limit = OUTREACH_LIMITS[tier];
  if (limit === -1) {
    return { allowed: true };
  }

  if (draftsThisMonth < limit) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `You've used all ${limit} AI outreach drafts this month`,
    requiredTier: 'pro',
    upgradeMessage: `Upgrade to Pro ($${PLANS.pro.priceMonthly}/mo) for unlimited outreach drafts`,
  };
}

/**
 * Get all features available for a plan tier.
 */
export function getAvailableFeatures(tier: PlanTier): Feature[] {
  return (Object.entries(FEATURE_TIERS) as Array<[Feature, PlanTier[]]>)
    .filter(([, tiers]) => tiers.includes(tier))
    .map(([feature]) => feature);
}

/**
 * Get features that would be unlocked by upgrading.
 */
export function getUpgradeFeatures(currentTier: PlanTier, targetTier: PlanTier): Feature[] {
  const currentFeatures = new Set(getAvailableFeatures(currentTier));
  return getAvailableFeatures(targetTier).filter((f) => !currentFeatures.has(f));
}

function getUpgradeTier(current: PlanTier): PlanTier | null {
  const tierOrder: PlanTier[] = ['free', 'pro', 'team', 'enterprise'];
  const currentIndex = tierOrder.indexOf(current);
  if (currentIndex === -1 || currentIndex >= tierOrder.length - 1) return null;
  return tierOrder[currentIndex + 1] ?? null;
}

/**
 * Get usage summary for a user's plan.
 */
export function getUsageSummary(
  tier: PlanTier,
  usage: {
    creditsUsed: number;
    targetsCount: number;
    teamMembers: number;
    outreachDrafts: number;
  }
): {
  credits: { used: number; limit: number; percentage: number };
  targets: { used: number; limit: number; percentage: number };
  team: { used: number; limit: number; percentage: number };
  outreach: { used: number; limit: number; percentage: number };
} {
  const plan = PLANS[tier];

  const pct = (used: number, limit: number) =>
    limit === -1 ? 0 : limit === 0 ? 100 : Math.round((used / limit) * 100);

  return {
    credits: {
      used: usage.creditsUsed,
      limit: plan.creditsPerMonth,
      percentage: pct(usage.creditsUsed, plan.creditsPerMonth),
    },
    targets: {
      used: usage.targetsCount,
      limit: plan.maxTargets,
      percentage: pct(usage.targetsCount, plan.maxTargets),
    },
    team: {
      used: usage.teamMembers,
      limit: plan.maxTeamMembers,
      percentage: pct(usage.teamMembers, plan.maxTeamMembers),
    },
    outreach: {
      used: usage.outreachDrafts,
      limit: OUTREACH_LIMITS[tier],
      percentage: pct(usage.outreachDrafts, OUTREACH_LIMITS[tier]),
    },
  };
}
