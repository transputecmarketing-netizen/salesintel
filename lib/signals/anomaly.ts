/**
 * Temporal Anomaly Detection using Welford's Algorithm
 *
 * Streaming mean and variance computation per dimension + day_of_week + month.
 * Z-score thresholds:
 *   Z >= 3.0 → critical
 *   Z >= 2.0 → medium
 *   Z >= 1.5 → low
 *
 * Minimum 10 samples before reporting anomalies to avoid false positives
 * during cold start.
 */

import type { SignalSeverity } from '@/types/signal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BaselineState {
  count: number;
  mean: number;
  m2: number; // Sum of squared differences from the mean (Welford's M2)
}

export interface BaselineKey {
  dimension: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  month: number;     // 0=January, 11=December
}

export interface AnomalyResult {
  isAnomaly: boolean;
  severity: SignalSeverity | null;
  zScore: number;
  observedValue: number;
  expectedMean: number;
  standardDeviation: number;
  sampleCount: number;
  dimension: string;
  dayOfWeek: number;
  month: number;
}

export interface BaselineStore {
  get(key: string): BaselineState | undefined;
  set(key: string, state: BaselineState): void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_SAMPLES = 10;

const Z_THRESHOLDS: Array<{ minZ: number; severity: SignalSeverity }> = [
  { minZ: 3.0, severity: 'critical' },
  { minZ: 2.0, severity: 'medium' },
  { minZ: 1.5, severity: 'low' },
];

// ---------------------------------------------------------------------------
// Baseline Key Encoding
// ---------------------------------------------------------------------------

function encodeKey(dimension: string, dayOfWeek: number, month: number): string {
  return `${dimension}:dow${dayOfWeek}:m${month}`;
}

// ---------------------------------------------------------------------------
// In-memory Baseline Store
// ---------------------------------------------------------------------------

/**
 * Default in-memory baseline store.
 * In production, this can be backed by Redis, PostgreSQL, or any KV store.
 */
export function createBaselineStore(): BaselineStore {
  const store = new Map<string, BaselineState>();
  return {
    get: (key: string) => store.get(key),
    set: (key: string, state: BaselineState) => store.set(key, state),
  };
}

// Global default store for convenience
let defaultStore: BaselineStore | null = null;

function getDefaultStore(): BaselineStore {
  if (!defaultStore) {
    defaultStore = createBaselineStore();
  }
  return defaultStore;
}

/**
 * Reset the default store (useful for testing).
 */
export function resetDefaultStore(): void {
  defaultStore = null;
}

// ---------------------------------------------------------------------------
// Welford's Online Algorithm
// ---------------------------------------------------------------------------

/**
 * Update baseline statistics using Welford's online algorithm.
 * This provides numerically stable streaming computation of mean and variance.
 *
 * Algorithm:
 *   count += 1
 *   delta = value - mean
 *   mean += delta / count
 *   delta2 = value - mean
 *   M2 += delta * delta2
 *
 * Variance = M2 / count (population) or M2 / (count - 1) (sample)
 */
export function updateBaseline(
  dimension: string,
  dayOfWeek: number,
  month: number,
  value: number,
  store?: BaselineStore,
): BaselineState {
  const s = store ?? getDefaultStore();
  const key = encodeKey(dimension, dayOfWeek, month);

  let state = s.get(key);

  if (!state) {
    state = { count: 0, mean: 0, m2: 0 };
  }

  // Welford's update
  state.count += 1;
  const delta = value - state.mean;
  state.mean += delta / state.count;
  const delta2 = value - state.mean;
  state.m2 += delta * delta2;

  s.set(key, state);
  return { ...state };
}

/**
 * Compute standard deviation from Welford's M2.
 * Uses sample variance (n-1) for unbiased estimation.
 */
function computeStdDev(state: BaselineState): number {
  if (state.count < 2) return 0;
  const variance = state.m2 / (state.count - 1);
  return Math.sqrt(variance);
}

// ---------------------------------------------------------------------------
// Anomaly Detection
// ---------------------------------------------------------------------------

/**
 * Detect if an observed value is anomalous compared to the baseline.
 *
 * Z-score = (observed - mean) / stddev
 *
 * Thresholds:
 *   Z >= 3.0 → critical anomaly
 *   Z >= 2.0 → medium anomaly
 *   Z >= 1.5 → low anomaly
 *   Z <  1.5 → not anomalous
 *
 * Requires minimum 10 samples in the baseline before reporting.
 */
export function detectAnomaly(
  dimension: string,
  dayOfWeek: number,
  month: number,
  observedValue: number,
  baseline?: BaselineStore,
): AnomalyResult {
  const s = baseline ?? getDefaultStore();
  const key = encodeKey(dimension, dayOfWeek, month);
  const state = s.get(key);

  const baseResult: Omit<AnomalyResult, 'isAnomaly' | 'severity' | 'zScore' | 'expectedMean' | 'standardDeviation' | 'sampleCount'> = {
    observedValue,
    dimension,
    dayOfWeek,
    month,
  };

  // Not enough data — cannot determine anomaly
  if (!state || state.count < MIN_SAMPLES) {
    return {
      ...baseResult,
      isAnomaly: false,
      severity: null,
      zScore: 0,
      expectedMean: state?.mean ?? 0,
      standardDeviation: state ? computeStdDev(state) : 0,
      sampleCount: state?.count ?? 0,
    };
  }

  const stdDev = computeStdDev(state);

  // If standard deviation is 0 (all values identical), any different value is anomalous
  let zScore: number;
  if (stdDev === 0) {
    zScore = observedValue === state.mean ? 0 : Infinity;
  } else {
    zScore = Math.abs(observedValue - state.mean) / stdDev;
  }

  // Determine severity
  let severity: SignalSeverity | null = null;
  let isAnomaly = false;

  for (const threshold of Z_THRESHOLDS) {
    if (zScore >= threshold.minZ) {
      severity = threshold.severity;
      isAnomaly = true;
      break;
    }
  }

  return {
    ...baseResult,
    isAnomaly,
    severity,
    zScore: Math.round(zScore * 100) / 100,
    expectedMean: Math.round(state.mean * 100) / 100,
    standardDeviation: Math.round(stdDev * 100) / 100,
    sampleCount: state.count,
  };
}

// ---------------------------------------------------------------------------
// Batch Operations
// ---------------------------------------------------------------------------

/**
 * Update baseline and detect anomaly in a single operation.
 * The value is added to the baseline BEFORE anomaly detection,
 * so the baseline includes the current observation.
 */
export function updateAndDetect(
  dimension: string,
  dayOfWeek: number,
  month: number,
  value: number,
  store?: BaselineStore,
): AnomalyResult {
  updateBaseline(dimension, dayOfWeek, month, value, store);
  return detectAnomaly(dimension, dayOfWeek, month, value, store);
}

/**
 * Detect anomalies across multiple dimensions for a single time point.
 */
export function detectAnomaliesBatch(
  observations: Array<{
    dimension: string;
    dayOfWeek: number;
    month: number;
    value: number;
  }>,
  store?: BaselineStore,
): AnomalyResult[] {
  return observations.map((obs) =>
    detectAnomaly(obs.dimension, obs.dayOfWeek, obs.month, obs.value, store),
  );
}
