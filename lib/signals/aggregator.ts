/**
 * Multi-Source Signal Fusion
 *
 * Merges signals from different sources about the same event.
 * Uses title similarity and time proximity to cluster related signals,
 * then fuses each cluster into a single canonical signal.
 */

import type { Signal, SignalSeverity } from '@/types/signal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AggregatedSignal extends Signal {
  sourceSignalIds: string[];
  sourceCount: number;
  fusedConfidence: number;
  evidenceSources: Array<{ sourceName: string; sourceTier: number; sourceUrl: string | null }>;
}

interface SignalCluster {
  signals: Signal[];
  representativeIndex: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TITLE_SIMILARITY_THRESHOLD = 0.35;
const TIME_PROXIMITY_HOURS = 72;
const TIME_PROXIMITY_MS = TIME_PROXIMITY_HOURS * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Text Similarity
// ---------------------------------------------------------------------------

/**
 * Tokenize text into lowercase word tokens, removing common stop words.
 */
function tokenize(text: string): Set<string> {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
    'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each',
    'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very',
    'just', 'because', 'if', 'when', 'while', 'that', 'this', 'it',
    'its', 'they', 'them', 'their', 'we', 'our', 'he', 'she', 'his', 'her',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  return new Set(words);
}

/**
 * Jaccard similarity between two token sets.
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ---------------------------------------------------------------------------
// Clustering
// ---------------------------------------------------------------------------

/**
 * Determine if two signals likely describe the same event.
 */
function areSameEvent(a: Signal, b: Signal): boolean {
  // Must be same signal type
  if (a.signalType !== b.signalType) return false;

  // Check time proximity
  const timeA = new Date(a.detectedAt).getTime();
  const timeB = new Date(b.detectedAt).getTime();
  if (Math.abs(timeA - timeB) > TIME_PROXIMITY_MS) return false;

  // Check title similarity
  const tokensA = tokenize(a.title);
  const tokensB = tokenize(b.title);
  const similarity = jaccardSimilarity(tokensA, tokensB);

  if (similarity >= TITLE_SIMILARITY_THRESHOLD) return true;

  // Additional check: same company + same subtype within time window
  if (a.companyId === b.companyId && a.signalSubtype === b.signalSubtype) {
    return true;
  }

  return false;
}

/**
 * Cluster signals into groups describing the same event.
 * Uses single-linkage clustering (union-find approach).
 */
function clusterByEvent(signals: Signal[]): SignalCluster[] {
  const n = signals.length;
  if (n === 0) return [];

  // Union-Find
  const parent = new Array(n).fill(0).map((_, i) => i);

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x] as number] as number; // Path compression
      x = parent[x] as number;
    }
    return x;
  }

  function union(x: number, y: number): void {
    const px = find(x);
    const py = find(y);
    if (px !== py) parent[px] = py;
  }

  // Compare all pairs
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (areSameEvent(signals[i]!, signals[j]!)) {
        union(i, j);
      }
    }
  }

  // Group by root
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const group = groups.get(root) ?? [];
    group.push(i);
    groups.set(root, group);
  }

  // Build clusters
  const clusters: SignalCluster[] = [];
  for (const indices of groups.values()) {
    const clusterSignals = indices.map((i) => signals[i]!);

    // Representative: highest tier source, then highest confidence
    let bestIdx = 0;
    for (let k = 1; k < clusterSignals.length; k++) {
      const current = clusterSignals[k]!;
      const best = clusterSignals[bestIdx]!;

      // Lower tier number = better source
      if (current.sourceTier < best.sourceTier) {
        bestIdx = k;
      } else if (current.sourceTier === best.sourceTier && current.confidence > best.confidence) {
        bestIdx = k;
      }
    }

    clusters.push({
      signals: clusterSignals,
      representativeIndex: bestIdx,
    });
  }

  return clusters;
}

// ---------------------------------------------------------------------------
// Fusion
// ---------------------------------------------------------------------------

const SEVERITY_RANK: Record<SignalSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

/**
 * Fuse a cluster of related signals into a single aggregated signal.
 */
function fuseCluster(cluster: SignalCluster): AggregatedSignal {
  const { signals, representativeIndex } = cluster;
  const representative = signals[representativeIndex]!;

  // Collect all source IDs
  const sourceSignalIds = signals.map((s) => s.id);

  // Evidence sources
  const evidenceSources = signals.map((s) => ({
    sourceName: s.sourceName ?? 'Unknown',
    sourceTier: s.sourceTier,
    sourceUrl: s.sourceUrl,
  }));

  // Fused confidence: boosted by corroboration from multiple sources
  let fusedConfidence = representative.confidence;
  const corroborationBoost = Math.min(0.15, (signals.length - 1) * 0.05);
  fusedConfidence = Math.min(0.99, fusedConfidence + corroborationBoost);

  // Use highest severity from any signal in the cluster
  let highestSeverity = representative.severity;
  for (const signal of signals) {
    if (SEVERITY_RANK[signal.severity] > SEVERITY_RANK[highestSeverity]) {
      highestSeverity = signal.severity;
    }
  }

  // Use highest intent score
  const maxIntentScore = Math.max(...signals.map((s) => s.intentScore));

  // Merge evidence items from all signals
  const mergedEvidence = signals.flatMap((s) => s.evidence);

  // Merge entities
  const mergedEntities = { ...representative.entities };
  for (const signal of signals) {
    if (signal.entities.people) {
      const existing = new Set((mergedEntities.people ?? []).map((p) => p.name));
      for (const person of signal.entities.people) {
        if (!existing.has(person.name)) {
          mergedEntities.people = [...(mergedEntities.people ?? []), person];
        }
      }
    }
    if (signal.entities.companies) {
      const existing = new Set((mergedEntities.companies ?? []).map((c) => c.name));
      for (const company of signal.entities.companies) {
        if (!existing.has(company.name)) {
          mergedEntities.companies = [...(mergedEntities.companies ?? []), company];
        }
      }
    }
    if (signal.entities.technologies) {
      const existing = new Set((mergedEntities.technologies ?? []).map((t) => t.name));
      for (const tech of signal.entities.technologies) {
        if (!existing.has(tech.name)) {
          mergedEntities.technologies = [...(mergedEntities.technologies ?? []), tech];
        }
      }
    }
    if (signal.entities.amounts) {
      const existing = new Set((mergedEntities.amounts ?? []).map((a) => a.value));
      for (const amount of signal.entities.amounts) {
        if (!existing.has(amount.value)) {
          mergedEntities.amounts = [...(mergedEntities.amounts ?? []), amount];
        }
      }
    }
  }

  return {
    ...representative,
    severity: highestSeverity,
    intentScore: maxIntentScore,
    confidence: Math.round(fusedConfidence * 100) / 100,
    entities: mergedEntities,
    evidence: mergedEvidence,
    sourceSignalIds,
    sourceCount: signals.length,
    fusedConfidence: Math.round(fusedConfidence * 100) / 100,
    evidenceSources,
  };
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

/**
 * Aggregate signals from multiple sources.
 * Clusters related signals about the same event and fuses each cluster
 * into a single canonical signal with boosted confidence.
 */
export function aggregateSignals(signals: Signal[]): AggregatedSignal[] {
  if (signals.length === 0) return [];

  const clusters = clusterByEvent(signals);
  return clusters.map(fuseCluster);
}
