/**
 * Buying Window Predictor
 *
 * Analyzes hard and soft signals to predict the optimal buying window
 * for outreach timing.
 *
 * Hard signals: RFP deadline, fiscal year end, contract renewal
 * Soft signals: Funding close date, new exec start date, job posting age,
 *               expansion announcement
 *
 * Output: window_start, window_end, confidence, primary_driver,
 *         optimal_outreach_date, urgency
 */

import type { Signal } from '@/types/signal';
import type { Company } from '@/types/company';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WindowUrgency = 'immediate' | 'this_week' | 'this_month' | 'this_quarter' | 'next_quarter' | 'unknown';

export interface BuyingWindowResult {
  windowStart: string;
  windowEnd: string;
  confidence: number;
  primaryDriver: string;
  optimalOutreachDate: string;
  urgency: WindowUrgency;
  hardSignals: WindowSignal[];
  softSignals: WindowSignal[];
}

export interface WindowSignal {
  type: string;
  description: string;
  estimatedDate: string;
  weight: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

// How many days before an event is the optimal pre-event outreach window
const PRE_EVENT_LEAD_DAYS: Record<string, number> = {
  rfp_deadline: 14,
  fiscal_year_end: 45,
  contract_renewal: 60,
  funding_close: 21,
  new_exec_start: 30,
  expansion_announcement: 14,
  job_posting: 7,
};

// Weights for signal types in window calculation
const HARD_SIGNAL_WEIGHT = 1.0;
const SOFT_SIGNAL_WEIGHT = 0.6;

// ---------------------------------------------------------------------------
// Hard Signal Extraction
// ---------------------------------------------------------------------------

function extractHardSignals(signals: Signal[], company: Company): WindowSignal[] {
  const hardSignals: WindowSignal[] = [];
  const now = Date.now();

  for (const signal of signals) {
    const subtype = signal.signalSubtype ?? '';
    const detectedAt = new Date(signal.detectedAt).getTime();

    // RFP / Tender deadline
    if (signal.signalType === 'tender' || /rfp|rfq|tender|bid/i.test(subtype)) {
      // Estimate deadline as 30-60 days from detection if not explicit
      const estimatedDeadline = new Date(detectedAt + 45 * DAY_MS);
      if (estimatedDeadline.getTime() > now) {
        hardSignals.push({
          type: 'rfp_deadline',
          description: `Active tender/RFP: ${signal.title}`,
          estimatedDate: estimatedDeadline.toISOString(),
          weight: HARD_SIGNAL_WEIGHT,
        });
      }
    }

    // Contract expiration / renewal
    if (/contract_end|contract.*expir|renewal/i.test(subtype) || /contract\s+(expir|end|renew)/i.test(signal.title)) {
      // Estimate renewal window as 90 days from detection
      const estimatedRenewal = new Date(detectedAt + 90 * DAY_MS);
      if (estimatedRenewal.getTime() > now) {
        hardSignals.push({
          type: 'contract_renewal',
          description: `Contract renewal window: ${signal.title}`,
          estimatedDate: estimatedRenewal.toISOString(),
          weight: HARD_SIGNAL_WEIGHT,
        });
      }
    }
  }

  // Fiscal year end estimation based on company info
  // Most companies end fiscal year Dec 31 or Jun 30
  const fiscalYearEnd = estimateFiscalYearEnd(company);
  if (fiscalYearEnd) {
    const daysUntilFYE = (fiscalYearEnd.getTime() - now) / DAY_MS;
    if (daysUntilFYE > 0 && daysUntilFYE <= 120) {
      hardSignals.push({
        type: 'fiscal_year_end',
        description: `Estimated fiscal year end: ${fiscalYearEnd.toISOString().slice(0, 10)}`,
        estimatedDate: fiscalYearEnd.toISOString(),
        weight: HARD_SIGNAL_WEIGHT * 0.8, // Slightly lower since estimated
      });
    }
  }

  return hardSignals;
}

function estimateFiscalYearEnd(_company: Company): Date | null {
  // Default: assume calendar year (Dec 31)
  // In production, this would use company-specific fiscal calendar data
  const now = new Date();
  const currentYear = now.getFullYear();
  const dec31 = new Date(currentYear, 11, 31);

  if (dec31.getTime() < now.getTime()) {
    return new Date(currentYear + 1, 11, 31);
  }
  return dec31;
}

// ---------------------------------------------------------------------------
// Soft Signal Extraction
// ---------------------------------------------------------------------------

function extractSoftSignals(signals: Signal[], _company: Company): WindowSignal[] {
  const softSignals: WindowSignal[] = [];
  const now = Date.now();

  for (const signal of signals) {
    const subtype = signal.signalSubtype ?? '';
    const detectedAt = new Date(signal.detectedAt).getTime();

    // Recent funding close — 30-90 day window for deployment
    if (signal.signalType === 'funding') {
      const daysSinceDetection = (now - detectedAt) / DAY_MS;
      if (daysSinceDetection <= 90) {
        const windowEnd = new Date(detectedAt + 120 * DAY_MS);
        softSignals.push({
          type: 'funding_close',
          description: `Recent funding activity: ${signal.title}`,
          estimatedDate: windowEnd.toISOString(),
          weight: SOFT_SIGNAL_WEIGHT * (signal.severity === 'critical' ? 1.2 : 1.0),
        });
      }
    }

    // New executive start — 90-day evaluation window
    if (signal.signalType === 'leadership' && /c_suite|vp|head/i.test(subtype)) {
      const daysSinceDetection = (now - detectedAt) / DAY_MS;
      if (daysSinceDetection <= 120) {
        const windowEnd = new Date(detectedAt + 90 * DAY_MS);
        if (windowEnd.getTime() > now) {
          softSignals.push({
            type: 'new_exec_start',
            description: `New executive: ${signal.title}`,
            estimatedDate: windowEnd.toISOString(),
            weight: SOFT_SIGNAL_WEIGHT * 1.1,
          });
        }
      }
    }

    // Job posting age — hiring urgency window
    if (signal.signalType === 'hiring') {
      const daysSinceDetection = (now - detectedAt) / DAY_MS;
      if (daysSinceDetection <= 60) {
        const windowEnd = new Date(detectedAt + 45 * DAY_MS);
        if (windowEnd.getTime() > now) {
          softSignals.push({
            type: 'job_posting',
            description: `Active hiring: ${signal.title}`,
            estimatedDate: windowEnd.toISOString(),
            weight: SOFT_SIGNAL_WEIGHT * 0.8,
          });
        }
      }
    }

    // Expansion announcement — 60-day window
    if (signal.signalType === 'expansion') {
      const daysSinceDetection = (now - detectedAt) / DAY_MS;
      if (daysSinceDetection <= 90) {
        const windowEnd = new Date(detectedAt + 90 * DAY_MS);
        if (windowEnd.getTime() > now) {
          softSignals.push({
            type: 'expansion_announcement',
            description: `Expansion activity: ${signal.title}`,
            estimatedDate: windowEnd.toISOString(),
            weight: SOFT_SIGNAL_WEIGHT,
          });
        }
      }
    }

    // Technology evaluation — immediate window
    if (signal.signalType === 'technology' && /rfp|vendor_eval|replacement|migration/i.test(subtype)) {
      const daysSinceDetection = (now - detectedAt) / DAY_MS;
      if (daysSinceDetection <= 60) {
        const windowEnd = new Date(detectedAt + 60 * DAY_MS);
        if (windowEnd.getTime() > now) {
          softSignals.push({
            type: 'tech_evaluation',
            description: `Technology evaluation: ${signal.title}`,
            estimatedDate: windowEnd.toISOString(),
            weight: SOFT_SIGNAL_WEIGHT * 1.3,
          });
        }
      }
    }
  }

  return softSignals;
}

// ---------------------------------------------------------------------------
// Window Calculation
// ---------------------------------------------------------------------------

function computeWindow(
  hardSignals: WindowSignal[],
  softSignals: WindowSignal[],
): Omit<BuyingWindowResult, 'hardSignals' | 'softSignals'> | null {
  const allSignals = [...hardSignals, ...softSignals];

  if (allSignals.length === 0) return null;

  const now = Date.now();

  // Calculate weighted center of all signal dates
  let totalWeight = 0;
  let weightedDateSum = 0;
  let earliestDate = Infinity;
  let latestDate = -Infinity;
  let strongestSignal: WindowSignal | null = null;
  let strongestWeight = 0;

  for (const sig of allSignals) {
    const sigDate = new Date(sig.estimatedDate).getTime();
    totalWeight += sig.weight;
    weightedDateSum += sigDate * sig.weight;

    if (sigDate < earliestDate) earliestDate = sigDate;
    if (sigDate > latestDate) latestDate = sigDate;

    if (sig.weight > strongestWeight) {
      strongestWeight = sig.weight;
      strongestSignal = sig;
    }
  }

  // Weighted center date
  const centerDate = weightedDateSum / totalWeight;

  // Window start: 2 weeks before center or now, whichever is later
  const windowStartMs = Math.max(now, centerDate - 14 * DAY_MS);
  // Window end: latest signal date + 2 weeks buffer
  const windowEndMs = latestDate + 14 * DAY_MS;

  // Optimal outreach: lead time before the primary driver's date
  let optimalOutreachMs: number;
  if (strongestSignal) {
    const driverDate = new Date(strongestSignal.estimatedDate).getTime();
    const leadDays = PRE_EVENT_LEAD_DAYS[strongestSignal.type] ?? 14;
    optimalOutreachMs = Math.max(now, driverDate - leadDays * DAY_MS);
  } else {
    optimalOutreachMs = windowStartMs;
  }

  // Confidence: based on signal count, types, and weight
  let confidence = 0.3; // Base
  if (hardSignals.length >= 2) confidence += 0.25;
  else if (hardSignals.length >= 1) confidence += 0.15;
  if (softSignals.length >= 3) confidence += 0.2;
  else if (softSignals.length >= 1) confidence += 0.1;
  // Tighter window = higher confidence
  const windowDays = (windowEndMs - windowStartMs) / DAY_MS;
  if (windowDays <= 30) confidence += 0.15;
  else if (windowDays <= 60) confidence += 0.08;
  confidence = Math.min(0.95, confidence);

  // Urgency based on optimal outreach timing
  const daysUntilOutreach = (optimalOutreachMs - now) / DAY_MS;
  let urgency: WindowUrgency;
  if (daysUntilOutreach <= 0) urgency = 'immediate';
  else if (daysUntilOutreach <= 7) urgency = 'this_week';
  else if (daysUntilOutreach <= 30) urgency = 'this_month';
  else if (daysUntilOutreach <= 90) urgency = 'this_quarter';
  else urgency = 'next_quarter';

  return {
    windowStart: new Date(windowStartMs).toISOString(),
    windowEnd: new Date(windowEndMs).toISOString(),
    confidence: Math.round(confidence * 100) / 100,
    primaryDriver: strongestSignal?.description ?? 'Multiple converging signals',
    optimalOutreachDate: new Date(optimalOutreachMs).toISOString(),
    urgency,
  };
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function predictBuyingWindow(
  signals: Signal[],
  company: Company,
): BuyingWindowResult | null {
  const hardSignals = extractHardSignals(signals, company);
  const softSignals = extractSoftSignals(signals, company);

  const windowCalc = computeWindow(hardSignals, softSignals);

  if (!windowCalc) {
    // No signals to derive a window from
    return null;
  }

  return {
    ...windowCalc,
    hardSignals,
    softSignals,
  };
}
