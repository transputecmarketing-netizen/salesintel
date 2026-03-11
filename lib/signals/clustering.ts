/**
 * Duplicate Signal Clustering
 *
 * Two-stage similarity detection:
 * 1. Jaccard similarity on tokenized titles (threshold 0.4)
 * 2. Cosine similarity placeholder for semantic embeddings (threshold 0.78)
 *
 * Groups duplicate signals and keeps the one from the highest-tier source.
 */

import type { Signal } from '@/types/signal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SignalCluster {
  clusterId: string;
  canonical: Signal;
  duplicates: Signal[];
  memberCount: number;
  similarityScores: Array<{
    signalId: string;
    jaccardScore: number;
    cosineScore: number | null;
  }>;
}

export interface ClusteringResult {
  clusters: SignalCluster[];
  totalInput: number;
  totalClusters: number;
  duplicatesRemoved: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const JACCARD_THRESHOLD = 0.4;
const COSINE_THRESHOLD = 0.78;

const STOP_WORDS = new Set([
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

// ---------------------------------------------------------------------------
// Tokenization
// ---------------------------------------------------------------------------

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  return new Set(words);
}

// ---------------------------------------------------------------------------
// Jaccard Similarity (exported)
// ---------------------------------------------------------------------------

/**
 * Compute Jaccard similarity coefficient between two string sets.
 * J(A,B) = |A ∩ B| / |A ∪ B|
 * Returns value in [0, 1].
 */
export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;

  let intersectionSize = 0;
  // Iterate over the smaller set for efficiency
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const token of smaller) {
    if (larger.has(token)) intersectionSize++;
  }

  const unionSize = a.size + b.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

// ---------------------------------------------------------------------------
// Cosine Similarity Placeholder
// ---------------------------------------------------------------------------

/**
 * Placeholder for semantic cosine similarity using embeddings.
 *
 * In production, this would:
 * 1. Generate embeddings via a model (e.g., all-MiniLM-L6-v2 or OpenAI ada-002)
 * 2. Compute cosine similarity between embedding vectors
 * 3. Return similarity score in [0, 1]
 *
 * For now, returns null to indicate embeddings are not available.
 */
function cosineSimilarityPlaceholder(_textA: string, _textB: string): number | null {
  // TODO: Implement with actual embedding model
  // const embeddingA = await embedModel.encode(textA);
  // const embeddingB = await embedModel.encode(textB);
  // return dotProduct(embeddingA, embeddingB) / (magnitude(embeddingA) * magnitude(embeddingB));
  return null;
}

/**
 * Compute cosine similarity between two numeric vectors.
 * Utility for when embeddings are available.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// ---------------------------------------------------------------------------
// Duplicate Detection
// ---------------------------------------------------------------------------

/**
 * Determine if two signals are duplicates based on title similarity.
 * Uses two-stage check: Jaccard first, then cosine if available.
 */
function areDuplicates(
  a: Signal,
  b: Signal,
): { isDuplicate: boolean; jaccardScore: number; cosineScore: number | null } {
  // Must be same signal type for duplicate consideration
  if (a.signalType !== b.signalType) {
    return { isDuplicate: false, jaccardScore: 0, cosineScore: null };
  }

  // Stage 1: Jaccard on tokenized titles
  const tokensA = tokenize(a.title);
  const tokensB = tokenize(b.title);
  const jaccardScore = jaccardSimilarity(tokensA, tokensB);

  if (jaccardScore >= JACCARD_THRESHOLD) {
    return { isDuplicate: true, jaccardScore, cosineScore: null };
  }

  // Stage 2: Cosine similarity on full text (semantic)
  const textA = `${a.title} ${a.summary ?? ''}`;
  const textB = `${b.title} ${b.summary ?? ''}`;
  const cosineScore = cosineSimilarityPlaceholder(textA, textB);

  if (cosineScore !== null && cosineScore >= COSINE_THRESHOLD) {
    return { isDuplicate: true, jaccardScore, cosineScore };
  }

  // Additional heuristic: same company + same subtype + very close time
  if (a.companyId === b.companyId && a.signalSubtype === b.signalSubtype) {
    const timeA = new Date(a.detectedAt).getTime();
    const timeB = new Date(b.detectedAt).getTime();
    const hoursDiff = Math.abs(timeA - timeB) / (60 * 60 * 1000);
    if (hoursDiff <= 24) {
      return { isDuplicate: true, jaccardScore, cosineScore };
    }
  }

  return { isDuplicate: false, jaccardScore, cosineScore };
}

// ---------------------------------------------------------------------------
// Union-Find for Clustering
// ---------------------------------------------------------------------------

class UnionFind {
  private parent: number[];
  private rank: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // Path compression
    }
    return this.parent[x];
  }

  union(x: number, y: number): void {
    const px = this.find(x);
    const py = this.find(y);
    if (px === py) return;

    // Union by rank
    if (this.rank[px] < this.rank[py]) {
      this.parent[px] = py;
    } else if (this.rank[px] > this.rank[py]) {
      this.parent[py] = px;
    } else {
      this.parent[py] = px;
      this.rank[px]++;
    }
  }

  connected(x: number, y: number): boolean {
    return this.find(x) === this.find(y);
  }
}

// ---------------------------------------------------------------------------
// Canonical Signal Selection
// ---------------------------------------------------------------------------

/**
 * Select the canonical (best) signal from a group of duplicates.
 * Priority: lowest source tier (highest quality), then highest confidence,
 * then most recent detection.
 */
function selectCanonical(signals: Signal[]): number {
  let bestIdx = 0;

  for (let i = 1; i < signals.length; i++) {
    const current = signals[i];
    const best = signals[bestIdx];

    // Lower tier number = better source quality
    if (current.sourceTier < best.sourceTier) {
      bestIdx = i;
    } else if (current.sourceTier === best.sourceTier) {
      // Same tier: prefer higher confidence
      if (current.confidence > best.confidence) {
        bestIdx = i;
      } else if (current.confidence === best.confidence) {
        // Same confidence: prefer more recent
        if (new Date(current.detectedAt).getTime() > new Date(best.detectedAt).getTime()) {
          bestIdx = i;
        }
      }
    }
  }

  return bestIdx;
}

// ---------------------------------------------------------------------------
// Main Exports
// ---------------------------------------------------------------------------

/**
 * Cluster signals to identify and group duplicates.
 * Returns clusters with canonical signals and their duplicates.
 */
export function clusterSignals(signals: Signal[]): ClusteringResult {
  const n = signals.length;

  if (n === 0) {
    return { clusters: [], totalInput: 0, totalClusters: 0, duplicatesRemoved: 0 };
  }

  if (n === 1) {
    return {
      clusters: [{
        clusterId: `cluster-0`,
        canonical: signals[0],
        duplicates: [],
        memberCount: 1,
        similarityScores: [],
      }],
      totalInput: 1,
      totalClusters: 1,
      duplicatesRemoved: 0,
    };
  }

  // Precompute token sets for all signals
  const tokenSets = signals.map((s) => tokenize(s.title));

  // Build similarity matrix and find duplicates
  const uf = new UnionFind(n);
  const pairScores = new Map<string, { jaccardScore: number; cosineScore: number | null }>();

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const result = areDuplicates(signals[i], signals[j]);

      if (result.isDuplicate) {
        uf.union(i, j);
      }

      // Store scores for pairs that have some similarity
      if (result.jaccardScore > 0 || result.cosineScore !== null) {
        pairScores.set(`${i}:${j}`, {
          jaccardScore: result.jaccardScore,
          cosineScore: result.cosineScore,
        });
      }
    }
  }

  // Group by cluster root
  const groupMap = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = uf.find(i);
    const group = groupMap.get(root) ?? [];
    group.push(i);
    groupMap.set(root, group);
  }

  // Build cluster results
  const clusters: SignalCluster[] = [];
  let clusterIdx = 0;

  for (const indices of groupMap.values()) {
    const clusterSignals = indices.map((i) => signals[i]);
    const canonicalIdx = selectCanonical(clusterSignals);
    const canonical = clusterSignals[canonicalIdx];
    const duplicates = clusterSignals.filter((_, i) => i !== canonicalIdx);

    // Build similarity scores for cluster members
    const similarityScores = clusterSignals
      .filter((_, i) => i !== canonicalIdx)
      .map((sig, i) => {
        const origIdx = indices[i >= canonicalIdx ? i + 1 : i];
        const canonOrigIdx = indices[canonicalIdx];
        const key = origIdx < canonOrigIdx
          ? `${origIdx}:${canonOrigIdx}`
          : `${canonOrigIdx}:${origIdx}`;
        const scores = pairScores.get(key);

        return {
          signalId: sig.id,
          jaccardScore: Math.round((scores?.jaccardScore ?? 0) * 1000) / 1000,
          cosineScore: scores?.cosineScore !== undefined
            ? scores.cosineScore !== null
              ? Math.round(scores.cosineScore * 1000) / 1000
              : null
            : null,
        };
      });

    clusters.push({
      clusterId: `cluster-${clusterIdx++}`,
      canonical,
      duplicates,
      memberCount: clusterSignals.length,
      similarityScores,
    });
  }

  // Sort clusters: largest first, then by canonical signal severity
  clusters.sort((a, b) => b.memberCount - a.memberCount);

  const totalClusters = clusters.length;
  const duplicatesRemoved = n - totalClusters;

  return {
    clusters,
    totalInput: n,
    totalClusters,
    duplicatesRemoved,
  };
}
