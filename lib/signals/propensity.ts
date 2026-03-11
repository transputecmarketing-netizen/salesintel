/**
 * Propensity-to-Buy Model
 *
 * Score 0-100 based on six dimensions:
 * - Signal diversity (more unique signal types = higher)
 * - Signal recency (recent signals weighted more)
 * - Funding stage fit (recently funded companies score higher)
 * - Leadership changes (new C-level = evaluation window)
 * - Technology signals (RFP, vendor eval = highest)
 * - Hiring patterns (technical hiring surge = budget available)
 */

import type { Signal, SignalType } from '@/types/signal';
import type { Company } from '@/types/company';
import type { Contact } from '@/types/contact';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PropensityInput {
  signals: Signal[];
  company: Company;
  contacts: Contact[];
}

export interface PropensityResult {
  score: number;
  factors: PropensityFactors;
  topDrivers: string[];
  confidence: number;
}

export interface PropensityFactors {
  signalDiversity: number;
  signalRecency: number;
  fundingStageFit: number;
  leadershipChange: number;
  technologySignals: number;
  hiringPatterns: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FACTOR_WEIGHTS = {
  signalDiversity: 0.18,
  signalRecency: 0.15,
  fundingStageFit: 0.17,
  leadershipChange: 0.18,
  technologySignals: 0.20,
  hiringPatterns: 0.12,
} as const;

const ALL_SIGNAL_TYPES: SignalType[] = [
  'funding', 'hiring', 'expansion', 'leadership',
  'technology', 'financial', 'competitive', 'tender',
  'product_launch', 'partnership', 'earnings', 'social',
];

const RECENCY_DECAY_HALFLIFE_DAYS = 15;

// ---------------------------------------------------------------------------
// Factor Computations
// ---------------------------------------------------------------------------

/**
 * Signal Diversity: more unique signal types = higher propensity.
 * 6+ types = 100, 4-5 = 75, 2-3 = 50, 1 = 25
 */
function computeSignalDiversity(signals: Signal[]): number {
  const uniqueTypes = new Set(signals.map((s) => s.signalType));
  const count = uniqueTypes.size;
  const maxTypes = ALL_SIGNAL_TYPES.length;

  if (count === 0) return 0;
  if (count >= 6) return 100;

  // Logarithmic scaling to reward diversity
  return Math.min(100, Math.round((Math.log2(count + 1) / Math.log2(maxTypes + 1)) * 100 + count * 8));
}

/**
 * Signal Recency: exponential decay weighting.
 * Sum of decay-weighted signals normalized to 0-100.
 */
function computeSignalRecency(signals: Signal[]): number {
  if (signals.length === 0) return 0;

  const now = Date.now();
  let decayWeightedSum = 0;

  for (const signal of signals) {
    const signalTime = new Date(signal.detectedAt).getTime();
    const daysSince = Math.max(0, (now - signalTime) / (24 * 60 * 60 * 1000));
    const decayFactor = Math.pow(0.5, daysSince / RECENCY_DECAY_HALFLIFE_DAYS);
    decayWeightedSum += decayFactor;
  }

  // Normalize: 5+ recent-equivalent signals = 100
  const normalized = Math.min(100, (decayWeightedSum / 5) * 100);
  return Math.round(normalized);
}

/**
 * Funding Stage Fit: recently funded companies have higher propensity.
 * Series A-C within last 6 months = highest.
 */
function computeFundingStageFit(company: Company): number {
  const stage = company.fundingStage?.toLowerCase() ?? '';
  const lastFundingDate = company.lastFundingDate;

  // Base score from funding stage
  let stageScore = 0;
  if (/series\s*[a-c]/i.test(stage)) stageScore = 80;
  else if (/series\s*[d-z]/i.test(stage) || /late/i.test(stage)) stageScore = 70;
  else if (/seed/i.test(stage)) stageScore = 40;
  else if (/ipo|public/i.test(stage)) stageScore = 60;
  else if (/pre[\s-]?seed/i.test(stage) || /angel/i.test(stage)) stageScore = 25;
  else if (stage) stageScore = 50; // Unknown stage but has one
  else stageScore = 30; // No funding info

  // Recency boost: more recent funding = higher
  if (lastFundingDate) {
    const daysSinceFunding = (Date.now() - new Date(lastFundingDate).getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceFunding <= 90) {
      stageScore = Math.min(100, stageScore + 25); // Very recent
    } else if (daysSinceFunding <= 180) {
      stageScore = Math.min(100, stageScore + 15);
    } else if (daysSinceFunding <= 365) {
      stageScore = Math.min(100, stageScore + 5);
    }
  }

  // Total funding amount boost
  if (company.totalFunding != null) {
    if (company.totalFunding >= 100_000_000) stageScore = Math.min(100, stageScore + 10);
    else if (company.totalFunding >= 10_000_000) stageScore = Math.min(100, stageScore + 5);
  }

  return Math.round(stageScore);
}

/**
 * Leadership Changes: new C-level = evaluation window.
 * Recent C-suite changes in last 90d = highest.
 */
function computeLeadershipChange(signals: Signal[], contacts: Contact[]): number {
  const now = Date.now();
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
  const SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;

  // Check leadership signals
  const leadershipSignals = signals.filter((s) => s.signalType === 'leadership');

  let score = 0;
  let recentCSuiteChange = false;
  let recentVPChange = false;

  for (const signal of leadershipSignals) {
    const signalAge = now - new Date(signal.detectedAt).getTime();

    if (signalAge <= NINETY_DAYS) {
      if (signal.signalSubtype?.includes('c_suite') || signal.severity === 'critical') {
        recentCSuiteChange = true;
        score = Math.max(score, 100);
      } else if (signal.signalSubtype?.includes('vp') || signal.severity === 'high') {
        recentVPChange = true;
        score = Math.max(score, 75);
      } else {
        score = Math.max(score, 50);
      }
    } else if (signalAge <= SIX_MONTHS) {
      if (signal.signalSubtype?.includes('c_suite') || signal.severity === 'critical') {
        score = Math.max(score, 70);
      } else {
        score = Math.max(score, 40);
      }
    }
  }

  // Check contacts for recently joined C-level
  for (const contact of contacts) {
    if (contact.seniority === 'c_suite' || contact.seniority === 'vp') {
      for (const career of contact.careerHistory) {
        if (career.endDate === null && career.startDate) {
          const startTime = new Date(career.startDate).getTime();
          const daysSinceStart = (now - startTime) / (24 * 60 * 60 * 1000);
          if (daysSinceStart <= 90) {
            score = Math.max(score, contact.seniority === 'c_suite' ? 95 : 70);
          } else if (daysSinceStart <= 180) {
            score = Math.max(score, contact.seniority === 'c_suite' ? 75 : 55);
          }
        }
      }
    }
  }

  // Bonus: multiple leadership changes compound the signal
  if (recentCSuiteChange && recentVPChange) {
    score = Math.min(100, score + 10);
  }

  return Math.round(score);
}

/**
 * Technology Signals: RFP, vendor eval = highest.
 * Active technology evaluation signals have strongest buying intent.
 */
function computeTechnologySignals(signals: Signal[]): number {
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

  const techSignals = signals.filter(
    (s) => s.signalType === 'technology' || s.signalType === 'tender',
  );

  if (techSignals.length === 0) return 0;

  let maxScore = 0;

  for (const signal of techSignals) {
    const signalAge = now - new Date(signal.detectedAt).getTime();
    const isRecent = signalAge <= THIRTY_DAYS;
    const isMidRange = signalAge <= NINETY_DAYS;

    const subtype = signal.signalSubtype ?? '';

    // Highest: RFP, RFQ, vendor evaluation
    if (/rfp|rfq|vendor_eval|tender/i.test(subtype)) {
      maxScore = Math.max(maxScore, isRecent ? 100 : isMidRange ? 75 : 50);
    }
    // High: vendor replacement, cloud migration, digital transformation
    else if (/replacement|migration|transformation|moderniz/i.test(subtype)) {
      maxScore = Math.max(maxScore, isRecent ? 90 : isMidRange ? 65 : 40);
    }
    // Medium: tech adoption, implementation, stack change
    else if (/adoption|implementation|stack_change|ai_initiative/i.test(subtype)) {
      maxScore = Math.max(maxScore, isRecent ? 70 : isMidRange ? 50 : 30);
    }
    // Lower: exploration, evaluation
    else {
      maxScore = Math.max(maxScore, isRecent ? 50 : isMidRange ? 35 : 20);
    }
  }

  // Bonus for multiple technology signals (compounding intent)
  const recentTechCount = techSignals.filter(
    (s) => now - new Date(s.detectedAt).getTime() <= THIRTY_DAYS,
  ).length;

  if (recentTechCount >= 3) {
    maxScore = Math.min(100, maxScore + 15);
  } else if (recentTechCount >= 2) {
    maxScore = Math.min(100, maxScore + 8);
  }

  return Math.round(maxScore);
}

/**
 * Hiring Patterns: technical hiring surge = budget available.
 * Volume and type of hiring signals indicate spending capacity.
 */
function computeHiringPatterns(signals: Signal[]): number {
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

  const hiringSignals = signals.filter((s) => s.signalType === 'hiring');

  if (hiringSignals.length === 0) return 0;

  let score = 0;

  for (const signal of hiringSignals) {
    const signalAge = now - new Date(signal.detectedAt).getTime();
    const isRecent = signalAge <= THIRTY_DAYS;
    const isMidRange = signalAge <= NINETY_DAYS;

    const subtype = signal.signalSubtype ?? '';

    // Hiring surge / mass hiring = highest
    if (/surge|mass|doubling|many_openings/i.test(subtype)) {
      score = Math.max(score, isRecent ? 100 : isMidRange ? 70 : 40);
    }
    // Team building, senior hires
    else if (/team_hiring|senior_tech|team_building|new_dev_center/i.test(subtype)) {
      score = Math.max(score, isRecent ? 75 : isMidRange ? 55 : 30);
    }
    // General team growth
    else if (/team_growth|talent_drive/i.test(subtype)) {
      score = Math.max(score, isRecent ? 60 : isMidRange ? 40 : 20);
    }
    // Standard postings
    else {
      score = Math.max(score, isRecent ? 40 : isMidRange ? 25 : 10);
    }
  }

  // Volume bonus: many hiring signals compound the budget signal
  const recentHiringCount = hiringSignals.filter(
    (s) => now - new Date(s.detectedAt).getTime() <= NINETY_DAYS,
  ).length;

  if (recentHiringCount >= 5) {
    score = Math.min(100, score + 15);
  } else if (recentHiringCount >= 3) {
    score = Math.min(100, score + 8);
  }

  return Math.round(score);
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function computePropensityScore(
  signals: Signal[],
  company: Company,
  contacts: Contact[],
): PropensityResult {
  const factors: PropensityFactors = {
    signalDiversity: computeSignalDiversity(signals),
    signalRecency: computeSignalRecency(signals),
    fundingStageFit: computeFundingStageFit(company),
    leadershipChange: computeLeadershipChange(signals, contacts),
    technologySignals: computeTechnologySignals(signals),
    hiringPatterns: computeHiringPatterns(signals),
  };

  // Weighted sum
  const score = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        factors.signalDiversity * FACTOR_WEIGHTS.signalDiversity +
          factors.signalRecency * FACTOR_WEIGHTS.signalRecency +
          factors.fundingStageFit * FACTOR_WEIGHTS.fundingStageFit +
          factors.leadershipChange * FACTOR_WEIGHTS.leadershipChange +
          factors.technologySignals * FACTOR_WEIGHTS.technologySignals +
          factors.hiringPatterns * FACTOR_WEIGHTS.hiringPatterns,
      ),
    ),
  );

  // Determine top drivers (sorted by contribution)
  const driverContributions = Object.entries(factors)
    .map(([key, value]) => ({
      name: key,
      contribution: value * FACTOR_WEIGHTS[key as keyof typeof FACTOR_WEIGHTS],
    }))
    .sort((a, b) => b.contribution - a.contribution);

  const topDrivers = driverContributions
    .filter((d) => d.contribution > 0)
    .slice(0, 3)
    .map((d) => formatDriverName(d.name));

  // Confidence based on signal volume and diversity
  const uniqueTypes = new Set(signals.map((s) => s.signalType)).size;
  let confidence = 0.3; // Base
  if (signals.length >= 10) confidence += 0.25;
  else if (signals.length >= 5) confidence += 0.15;
  else if (signals.length >= 2) confidence += 0.08;
  if (uniqueTypes >= 4) confidence += 0.25;
  else if (uniqueTypes >= 2) confidence += 0.12;
  confidence = Math.min(0.95, confidence);

  return {
    score,
    factors,
    topDrivers,
    confidence: Math.round(confidence * 100) / 100,
  };
}

function formatDriverName(key: string): string {
  const names: Record<string, string> = {
    signalDiversity: 'Signal diversity across multiple categories',
    signalRecency: 'Recent signal activity',
    fundingStageFit: 'Funding stage and recency',
    leadershipChange: 'Recent leadership changes',
    technologySignals: 'Active technology evaluation',
    hiringPatterns: 'Technical hiring surge',
  };
  return names[key] ?? key;
}
