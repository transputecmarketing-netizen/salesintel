export type PlanTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface Plan {
  tier: PlanTier;
  name: string;
  creditsPerMonth: number;
  maxTargets: number;
  maxTeamMembers: number;
  features: string[];
  priceMonthly: number;
  priceYearly: number;
}

export interface CreditUsage {
  used: number;
  limit: number;
  percentage: number;
  resetDate: string;
}

export const PLANS: Record<PlanTier, Plan> = {
  free: {
    tier: 'free',
    name: 'Free',
    creditsPerMonth: 100,
    maxTargets: 10,
    maxTeamMembers: 1,
    features: ['Basic signal alerts', 'Company research', '10 AI outreach drafts/mo'],
    priceMonthly: 0,
    priceYearly: 0,
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    creditsPerMonth: 1000,
    maxTargets: 100,
    maxTeamMembers: 1,
    features: ['Everything in Free', 'Deep research', 'Buying window predictions', 'Unlimited outreach', 'Priority signal alerts'],
    priceMonthly: 79,
    priceYearly: 790,
  },
  team: {
    tier: 'team',
    name: 'Team',
    creditsPerMonth: 5000,
    maxTargets: 500,
    maxTeamMembers: 10,
    features: ['Everything in Pro', 'Team collaboration', 'Shared watchlists', 'CRM integrations', 'Analytics dashboard'],
    priceMonthly: 199,
    priceYearly: 1990,
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    creditsPerMonth: -1,
    maxTargets: -1,
    maxTeamMembers: -1,
    features: ['Everything in Team', 'Unlimited credits', 'SSO/SAML', 'Custom integrations', 'Dedicated support', 'On-premise option'],
    priceMonthly: -1,
    priceYearly: -1,
  },
};
