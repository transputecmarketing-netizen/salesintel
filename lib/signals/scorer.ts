/**
 * Account Health Score Calculator
 *
 * Composite score formula:
 *   health_score = fit_score * 0.30
 *                + velocity_score * 0.25
 *                + intent_score * 0.30
 *                + readiness_score * 0.15
 *
 * With boost modifiers for convergence, buying window, and competitor vulnerability.
 * Floor of 30 for tier-1 accounts.
 */

import type { Signal, SignalType } from '@/types/signal';
import type { Company, TechStackItem } from '@/types/company';
import type { Contact } from '@/types/contact';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ICPProfile {
  targetIndustries: string[];
  minEmployees: number;
  maxEmployees: number;
  targetTechStack: string[];
  targetGeos: string[];
  targetFundingStages?: string[];
  targetRevenueRanges?: string[];
}

export interface HealthScoreParams {
  company: Company;
  signals: Signal[];
  contacts: Contact[];
  icp: ICPProfile;
  accountTier?: number; // 1 = strategic, 2 = growth, 3 = standard
  convergenceScore?: number; // 0-100 from convergence detection
  buyingWindowActive?: boolean;
  competitorVulnerability?: number; // 0-100
}

export interface HealthScoreResult {
  healthScore: number;
  fitComponent: number;
  velocityComponent: number;
  intentComponent: number;
  readinessComponent: number;
  boostApplied: number;
  breakdown: {
    fit: FitBreakdown;
    velocity: VelocityBreakdown;
    intent: IntentBreakdown;
    readiness: ReadinessBreakdown;
  };
}

export interface FitBreakdown {
  industryMatch: number;
  sizeMatch: number;
  techStackMatch: number;
  geoMatch: number;
  fundingStageMatch: number;
  rawScore: number;
}

export interface VelocityBreakdown {
  signalsLast30d: number;
  signals90dBaseline: number;
  velocityRatio: number;
  rawScore: number;
}

export interface IntentBreakdown {
  weightedIntentSum: number;
  signalCount: number;
  averageIntent: number;
  highIntentSignals: number;
  rawScore: number;
}

export interface ReadinessBreakdown {
  cLevelRecency: number | null;
  engagementRecency: number | null;
  cLevelScore: number;
  engagementScore: number;
  rawScore: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEIGHTS = {
  fit: 0.30,
  velocity: 0.25,
  intent: 0.30,
  readiness: 0.15,
} as const;

const INTENT_WEIGHTS: Record<SignalType, number> = {
  tender: 1.0,
  technology: 0.95,
  competitive: 0.90,
  funding: 0.85,
  leadership: 0.80,
  expansion: 0.75,
  hiring: 0.65,
  financial: 0.60,
  earnings: 0.55,
  product_launch: 0.50,
  partnership: 0.45,
  social: 0.30,
};

// ---------------------------------------------------------------------------
// Fit Scoring — ICP Match
// ---------------------------------------------------------------------------

function computeFitScore(company: Company, icp: ICPProfile): FitBreakdown {
  // Industry match (0-100)
  let industryMatch = 0;
  if (company.industry) {
    const industryLower = company.industry.toLowerCase();
    const subIndustryLower = (company.subIndustry ?? '').toLowerCase();
    if (icp.targetIndustries.some((i) => industryLower.includes(i.toLowerCase()))) {
      industryMatch = 100;
    } else if (icp.targetIndustries.some((i) => subIndustryLower.includes(i.toLowerCase()))) {
      industryMatch = 75;
    }
  }

  // Size match (0-100) — based on employee count
  let sizeMatch = 0;
  const empCount = company.employeeExact;
  if (empCount !== null) {
    if (empCount >= icp.minEmployees && empCount <= icp.maxEmployees) {
      sizeMatch = 100;
    } else if (empCount >= icp.minEmployees * 0.5 && empCount <= icp.maxEmployees * 2) {
      // Partial match: within 2x range
      const distFromIdeal = Math.min(
        Math.abs(empCount - icp.minEmployees),
        Math.abs(empCount - icp.maxEmployees),
      );
      const range = icp.maxEmployees - icp.minEmployees;
      sizeMatch = Math.max(0, 100 - (distFromIdeal / Math.max(range, 1)) * 100);
    }
  } else if (company.employeeCount) {
    // Rough match from range string (e.g. "51-200")
    const rangeMatch = company.employeeCount.match(/(\d+)/);
    if (rangeMatch) {
      const approx = parseInt(rangeMatch[1], 10);
      if (approx >= icp.minEmployees && approx <= icp.maxEmployees) {
        sizeMatch = 70; // Lower confidence from range string
      }
    }
  }

  // Tech stack match (0-100) — percentage of target tech present
  let techStackMatch = 0;
  if (icp.targetTechStack.length > 0 && company.techStack.length > 0) {
    const companyTech = new Set(
      company.techStack.map((t: TechStackItem) => t.name.toLowerCase()),
    );
    const matchCount = icp.targetTechStack.filter((t) =>
      companyTech.has(t.toLowerCase()),
    ).length;
    techStackMatch = (matchCount / icp.targetTechStack.length) * 100;
  }

  // Geo match (0-100)
  let geoMatch = 0;
  if (icp.targetGeos.length > 0) {
    const companyGeo = [
      company.hqCity,
      company.hqState,
      company.hqCountry,
    ]
      .filter(Boolean)
      .map((g) => g!.toLowerCase());

    if (icp.targetGeos.some((g) => companyGeo.some((cg) => cg.includes(g.toLowerCase())))) {
      geoMatch = 100;
    }
  } else {
    geoMatch = 50; // No geo restriction = neutral
  }

  // Funding stage match (0-100)
  let fundingStageMatch = 50; // Default neutral
  if (icp.targetFundingStages && icp.targetFundingStages.length > 0 && company.fundingStage) {
    const stageLower = company.fundingStage.toLowerCase();
    if (icp.targetFundingStages.some((s) => stageLower.includes(s.toLowerCase()))) {
      fundingStageMatch = 100;
    } else {
      fundingStageMatch = 20;
    }
  }

  const rawScore =
    industryMatch * 0.30 +
    sizeMatch * 0.25 +
    techStackMatch * 0.25 +
    geoMatch * 0.10 +
    fundingStageMatch * 0.10;

  return { industryMatch, sizeMatch, techStackMatch, geoMatch, fundingStageMatch, rawScore };
}

// ---------------------------------------------------------------------------
// Velocity Scoring — Signal Frequency
// ---------------------------------------------------------------------------

function computeVelocityScore(signals: Signal[]): VelocityBreakdown {
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

  const signalsLast30d = signals.filter((s) => {
    const signalTime = new Date(s.detectedAt).getTime();
    return now - signalTime <= THIRTY_DAYS;
  }).length;

  const signalsLast90d = signals.filter((s) => {
    const signalTime = new Date(s.detectedAt).getTime();
    return now - signalTime <= NINETY_DAYS;
  }).length;

  // Baseline: average monthly rate from 90d window
  const signals90dBaseline = signalsLast90d / 3; // monthly average

  // Velocity ratio: current 30d vs baseline
  const velocityRatio =
    signals90dBaseline > 0 ? signalsLast30d / signals90dBaseline : signalsLast30d > 0 ? 2.0 : 0;

  // Score: ratio of 1.0 = 50 (baseline), >1 scales up, <1 scales down
  let rawScore: number;
  if (velocityRatio >= 3.0) {
    rawScore = 100;
  } else if (velocityRatio >= 2.0) {
    rawScore = 75 + (velocityRatio - 2.0) * 25;
  } else if (velocityRatio >= 1.0) {
    rawScore = 50 + (velocityRatio - 1.0) * 25;
  } else {
    rawScore = velocityRatio * 50;
  }

  // Minimum score if there are recent signals
  if (signalsLast30d > 0 && rawScore < 20) {
    rawScore = 20;
  }

  return {
    signalsLast30d,
    signals90dBaseline: Math.round(signals90dBaseline * 10) / 10,
    velocityRatio: Math.round(velocityRatio * 100) / 100,
    rawScore: Math.round(rawScore),
  };
}

// ---------------------------------------------------------------------------
// Intent Scoring — Weighted Signal Intent
// ---------------------------------------------------------------------------

function computeIntentScore(signals: Signal[]): IntentBreakdown {
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  // Only consider recent signals for intent scoring
  const recentSignals = signals.filter((s) => {
    const signalTime = new Date(s.detectedAt).getTime();
    return now - signalTime <= THIRTY_DAYS;
  });

  if (recentSignals.length === 0) {
    return {
      weightedIntentSum: 0,
      signalCount: 0,
      averageIntent: 0,
      highIntentSignals: 0,
      rawScore: 0,
    };
  }

  let weightedIntentSum = 0;
  let highIntentSignals = 0;

  for (const signal of recentSignals) {
    const typeWeight = INTENT_WEIGHTS[signal.signalType] ?? 0.5;
    const weightedIntent = signal.intentScore * typeWeight;
    weightedIntentSum += weightedIntent;

    if (signal.intentScore >= 75) {
      highIntentSignals++;
    }
  }

  const averageIntent = weightedIntentSum / recentSignals.length;

  // Normalize to 0-100 scale
  // Average weighted intent of 100 = score of 100
  let rawScore = Math.min(averageIntent, 100);

  // Bonus for having multiple high-intent signals
  if (highIntentSignals >= 3) {
    rawScore = Math.min(rawScore + 15, 100);
  } else if (highIntentSignals >= 2) {
    rawScore = Math.min(rawScore + 8, 100);
  }

  return {
    weightedIntentSum: Math.round(weightedIntentSum * 10) / 10,
    signalCount: recentSignals.length,
    averageIntent: Math.round(averageIntent * 10) / 10,
    highIntentSignals,
    rawScore: Math.round(rawScore),
  };
}

// ---------------------------------------------------------------------------
// Readiness Scoring — C-Level Activity + Engagement
// ---------------------------------------------------------------------------

function computeReadinessScore(signals: Signal[], contacts: Contact[]): ReadinessBreakdown {
  const now = Date.now();

  // C-Level activity recency
  let cLevelRecency: number | null = null;
  const cLevelContacts = contacts.filter(
    (c) => c.seniority === 'c_suite' || c.seniority === 'vp',
  );

  for (const contact of cLevelContacts) {
    for (const activity of contact.recentActivity) {
      const activityTime = new Date(activity.date).getTime();
      const daysSince = (now - activityTime) / (24 * 60 * 60 * 1000);
      if (cLevelRecency === null || daysSince < cLevelRecency) {
        cLevelRecency = daysSince;
      }
    }
  }

  // Also check signals tied to leadership type
  const leadershipSignals = signals.filter((s) => s.signalType === 'leadership');
  for (const signal of leadershipSignals) {
    const signalTime = new Date(signal.detectedAt).getTime();
    const daysSince = (now - signalTime) / (24 * 60 * 60 * 1000);
    if (cLevelRecency === null || daysSince < cLevelRecency) {
      cLevelRecency = daysSince;
    }
  }

  // C-Level score: more recent = higher
  let cLevelScore = 0;
  if (cLevelRecency !== null) {
    if (cLevelRecency <= 7) cLevelScore = 100;
    else if (cLevelRecency <= 14) cLevelScore = 85;
    else if (cLevelRecency <= 30) cLevelScore = 70;
    else if (cLevelRecency <= 60) cLevelScore = 45;
    else if (cLevelRecency <= 90) cLevelScore = 25;
    else cLevelScore = 10;
  }

  // Engagement recency — most recent signal of any kind
  let engagementRecency: number | null = null;
  for (const signal of signals) {
    const signalTime = new Date(signal.detectedAt).getTime();
    const daysSince = (now - signalTime) / (24 * 60 * 60 * 1000);
    if (engagementRecency === null || daysSince < engagementRecency) {
      engagementRecency = daysSince;
    }
  }

  let engagementScore = 0;
  if (engagementRecency !== null) {
    if (engagementRecency <= 3) engagementScore = 100;
    else if (engagementRecency <= 7) engagementScore = 85;
    else if (engagementRecency <= 14) engagementScore = 70;
    else if (engagementRecency <= 30) engagementScore = 50;
    else if (engagementRecency <= 60) engagementScore = 30;
    else engagementScore = 10;
  }

  const rawScore = cLevelScore * 0.6 + engagementScore * 0.4;

  return {
    cLevelRecency: cLevelRecency !== null ? Math.round(cLevelRecency * 10) / 10 : null,
    engagementRecency: engagementRecency !== null ? Math.round(engagementRecency * 10) / 10 : null,
    cLevelScore,
    engagementScore,
    rawScore: Math.round(rawScore),
  };
}

// ---------------------------------------------------------------------------
// Boost Modifiers
// ---------------------------------------------------------------------------

function computeBoost(params: {
  convergenceScore?: number;
  buyingWindowActive?: boolean;
  competitorVulnerability?: number;
}): number {
  let boost = 0;

  // Convergence boost: up to +10 points
  if (params.convergenceScore != null && params.convergenceScore > 0) {
    boost += Math.min(params.convergenceScore / 10, 10);
  }

  // Active buying window boost: +8 points
  if (params.buyingWindowActive) {
    boost += 8;
  }

  // Competitor vulnerability boost: up to +7 points
  if (params.competitorVulnerability != null && params.competitorVulnerability > 0) {
    boost += Math.min(params.competitorVulnerability / 14, 7);
  }

  return Math.round(boost * 10) / 10;
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function computeHealthScore(params: HealthScoreParams): HealthScoreResult {
  const fit = computeFitScore(params.company, params.icp);
  const velocity = computeVelocityScore(params.signals);
  const intent = computeIntentScore(params.signals);
  const readiness = computeReadinessScore(params.signals, params.contacts);

  const boost = computeBoost({
    convergenceScore: params.convergenceScore,
    buyingWindowActive: params.buyingWindowActive,
    competitorVulnerability: params.competitorVulnerability,
  });

  let healthScore =
    fit.rawScore * WEIGHTS.fit +
    velocity.rawScore * WEIGHTS.velocity +
    intent.rawScore * WEIGHTS.intent +
    readiness.rawScore * WEIGHTS.readiness +
    boost;

  // Floor for tier-1 (strategic) accounts
  if (params.accountTier === 1 && healthScore < 30) {
    healthScore = 30;
  }

  // Clamp to 0-100
  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

  return {
    healthScore,
    fitComponent: Math.round(fit.rawScore * WEIGHTS.fit * 10) / 10,
    velocityComponent: Math.round(velocity.rawScore * WEIGHTS.velocity * 10) / 10,
    intentComponent: Math.round(intent.rawScore * WEIGHTS.intent * 10) / 10,
    readinessComponent: Math.round(readiness.rawScore * WEIGHTS.readiness * 10) / 10,
    boostApplied: boost,
    breakdown: {
      fit,
      velocity,
      intent,
      readiness,
    },
  };
}
