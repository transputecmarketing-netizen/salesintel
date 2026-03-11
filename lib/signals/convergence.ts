/**
 * Opportunity Convergence Detection
 *
 * When 3+ distinct signal types converge on one company within a window:
 *   4+ types = critical convergence
 *   3 types  = high convergence
 *   2 types  = medium convergence
 *
 * Convergence is the strongest composite buying indicator in the platform.
 */

import type { Signal, SignalType, SignalSeverity } from '@/types/signal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConvergenceResult {
  companyId: string;
  severity: SignalSeverity;
  uniqueTypes: SignalType[];
  typeCount: number;
  windowDays: number;
  signals: Signal[];
  convergenceScore: number;
  description: string;
  detectedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_WINDOW_DAYS = 30;

/**
 * Signal type weights for convergence scoring.
 * Higher-intent signal types amplify convergence score.
 */
const CONVERGENCE_TYPE_WEIGHTS: Record<SignalType, number> = {
  tender: 1.5,
  technology: 1.4,
  competitive: 1.3,
  funding: 1.2,
  leadership: 1.2,
  expansion: 1.1,
  hiring: 1.0,
  financial: 0.9,
  earnings: 0.8,
  product_launch: 0.7,
  partnership: 0.6,
  social: 0.4,
};

/**
 * Bonus multipliers for specific type combinations.
 * Certain combinations are stronger buying indicators together.
 */
const SYNERGY_COMBOS: Array<{ types: SignalType[]; multiplier: number; label: string }> = [
  {
    types: ['funding', 'hiring', 'expansion'],
    multiplier: 1.3,
    label: 'Growth trifecta: funding + hiring + expansion',
  },
  {
    types: ['leadership', 'technology', 'competitive'],
    multiplier: 1.4,
    label: 'New leadership evaluating technology after competitive pressure',
  },
  {
    types: ['tender', 'technology'],
    multiplier: 1.25,
    label: 'Active procurement with technology evaluation',
  },
  {
    types: ['funding', 'leadership'],
    multiplier: 1.2,
    label: 'New funding with leadership change — evaluation window',
  },
  {
    types: ['competitive', 'technology', 'tender'],
    multiplier: 1.5,
    label: 'Competitor displacement with active RFP',
  },
  {
    types: ['hiring', 'technology'],
    multiplier: 1.15,
    label: 'Technical hiring surge with technology signals',
  },
  {
    types: ['expansion', 'hiring', 'leadership'],
    multiplier: 1.2,
    label: 'Expansion-driven org build-out',
  },
];

// ---------------------------------------------------------------------------
// Core Detection
// ---------------------------------------------------------------------------

function findConvergingSignals(
  signals: Signal[],
  windowDays: number,
): Map<SignalType, Signal[]> {
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;

  // Filter to signals within the window
  const recentSignals = signals.filter((s) => {
    const signalTime = new Date(s.detectedAt).getTime();
    return now - signalTime <= windowMs;
  });

  // Group by signal type (keep all signals, but track unique types)
  const byType = new Map<SignalType, Signal[]>();
  for (const signal of recentSignals) {
    const existing = byType.get(signal.signalType) ?? [];
    existing.push(signal);
    byType.set(signal.signalType, existing);
  }

  return byType;
}

function computeConvergenceScore(
  typeMap: Map<SignalType, Signal[]>,
  severity: SignalSeverity,
): number {
  const types = Array.from(typeMap.keys());

  // Base score from type count
  let baseScore: number;
  switch (severity) {
    case 'critical':
      baseScore = 85;
      break;
    case 'high':
      baseScore = 65;
      break;
    case 'medium':
      baseScore = 45;
      break;
    default:
      baseScore = 20;
  }

  // Weighted type contribution
  let typeWeightSum = 0;
  for (const type of types) {
    typeWeightSum += CONVERGENCE_TYPE_WEIGHTS[type] ?? 1.0;
  }
  const avgTypeWeight = typeWeightSum / types.length;

  // Apply average type weight as multiplier
  let score = baseScore * avgTypeWeight;

  // Check for synergy combinations
  let bestSynergyMultiplier = 1.0;
  for (const combo of SYNERGY_COMBOS) {
    const hasAll = combo.types.every((t) => types.includes(t));
    if (hasAll && combo.multiplier > bestSynergyMultiplier) {
      bestSynergyMultiplier = combo.multiplier;
    }
  }
  score *= bestSynergyMultiplier;

  // Volume bonus: more total signals within window increases confidence
  let totalSignals = 0;
  for (const signals of typeMap.values()) {
    totalSignals += signals.length;
  }
  if (totalSignals >= 10) score += 10;
  else if (totalSignals >= 5) score += 5;

  return Math.min(100, Math.round(score));
}

function buildDescription(
  types: SignalType[],
  severity: SignalSeverity,
  windowDays: number,
  typeMap: Map<SignalType, Signal[]>,
): string {
  const typeLabels = types.map((t) => t.replace(/_/g, ' ')).join(', ');

  // Check for matching synergy
  for (const combo of SYNERGY_COMBOS) {
    if (combo.types.every((t) => types.includes(t))) {
      return `${severity.toUpperCase()} convergence (${types.length} signal types in ${windowDays}d): ${combo.label}. Types: ${typeLabels}.`;
    }
  }

  return `${severity.toUpperCase()} convergence detected: ${types.length} distinct signal types (${typeLabels}) within ${windowDays}-day window.`;
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function detectConvergence(
  companyId: string,
  signals: Signal[],
  windowDays: number = DEFAULT_WINDOW_DAYS,
): ConvergenceResult | null {
  // Only consider signals for this company
  const companySignals = signals.filter((s) => s.companyId === companyId);

  if (companySignals.length < 2) return null;

  const typeMap = findConvergingSignals(companySignals, windowDays);
  const uniqueTypes = Array.from(typeMap.keys());
  const typeCount = uniqueTypes.length;

  // Minimum 2 types for any convergence
  if (typeCount < 2) return null;

  // Determine severity
  let severity: SignalSeverity;
  if (typeCount >= 5) severity = 'critical';
  else if (typeCount >= 4) severity = 'critical';
  else if (typeCount >= 3) severity = 'high';
  else severity = 'medium'; // 2 types

  // Collect all signals in the convergence
  const allConvergingSignals: Signal[] = [];
  for (const typeSignals of typeMap.values()) {
    allConvergingSignals.push(...typeSignals);
  }

  // Sort by detection date descending
  allConvergingSignals.sort(
    (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
  );

  const convergenceScore = computeConvergenceScore(typeMap, severity);
  const description = buildDescription(uniqueTypes, severity, windowDays, typeMap);

  return {
    companyId,
    severity,
    uniqueTypes,
    typeCount,
    windowDays,
    signals: allConvergingSignals,
    convergenceScore,
    description,
    detectedAt: new Date().toISOString(),
  };
}
