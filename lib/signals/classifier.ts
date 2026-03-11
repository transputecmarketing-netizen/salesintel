/**
 * Hybrid Three-Stage Signal Classification Pipeline
 *
 * Stage 1: Keyword classifier (instant) - regex pattern matching
 * Stage 2: Browser-side ML placeholder (returns callable function)
 * Stage 3: LLM classifier placeholder (batched async via Groq)
 * Stage 4: Confidence merging with source tier weighting
 */

import type {
  SignalType,
  SignalSeverity,
  SignalClassification,
  SignalEntities,
  RecommendedAction,
} from '@/types/signal';
import { SIGNAL_KEYWORDS, type KeywordPattern } from './keywords';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClassificationResult {
  signalType: SignalType;
  signalSubtype: string;
  severity: SignalSeverity;
  intentScore: number;
  confidence: number;
  whyItMatters: string;
  classifiedBy: 'keyword' | 'ml' | 'llm';
}

export interface MergedClassification extends SignalClassification {
  classifiedBy: 'keyword' | 'ml' | 'llm';
  keywordResult: ClassificationResult | null;
  mlResult: ClassificationResult | null;
  llmResult: ClassificationResult | null;
}

interface BatchItem {
  headline: string;
  content: string;
  sourceTier: number;
}

// ---------------------------------------------------------------------------
// Severity ordering for comparison
// ---------------------------------------------------------------------------

const SEVERITY_RANK: Record<SignalSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

const BASE_CONFIDENCE: Record<string, number> = {
  critical: 0.85,
  high: 0.7,
  medium: 0.55,
};

const MATCH_BOOST = 0.05;
const MAX_CONFIDENCE = 0.99;

// ---------------------------------------------------------------------------
// Stage 1: Keyword Classifier
// ---------------------------------------------------------------------------

interface KeywordMatch {
  pattern: KeywordPattern;
  signalType: SignalType;
}

function keywordClassify(headline: string, content: string): ClassificationResult | null {
  const text = `${headline} ${content}`;
  const matches: KeywordMatch[] = [];

  // Check every pattern in every signal type
  for (const [signalType, patterns] of Object.entries(SIGNAL_KEYWORDS)) {
    for (const pat of patterns) {
      if (pat.pattern.test(text)) {
        matches.push({ pattern: pat, signalType: signalType as SignalType });
      }
    }
  }

  if (matches.length === 0) return null;

  // Sort by severity rank descending, then by intentScore descending
  matches.sort((a, b) => {
    const sevDiff = SEVERITY_RANK[b.pattern.severity] - SEVERITY_RANK[a.pattern.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.pattern.intentScore - a.pattern.intentScore;
  });

  const best = matches[0];
  const baseSev = best.pattern.severity;
  const baseConf = BASE_CONFIDENCE[baseSev] ?? 0.4;

  // Boost confidence by 0.05 for each additional match beyond the first
  const additionalMatches = matches.length - 1;
  const confidence = Math.min(baseConf + additionalMatches * MATCH_BOOST, MAX_CONFIDENCE);

  return {
    signalType: best.signalType,
    signalSubtype: best.pattern.subtype,
    severity: best.pattern.severity,
    intentScore: best.pattern.intentScore,
    confidence,
    whyItMatters: best.pattern.whyItMatters,
    classifiedBy: 'keyword',
  };
}

// ---------------------------------------------------------------------------
// Stage 2: Browser-side ML Placeholder
// ---------------------------------------------------------------------------

/**
 * Returns a function that can be called with text to get ML-based classification.
 * This is a placeholder for a browser-side ONNX/TFLite model.
 * In production, load the model once and return the inference function.
 */
export function createMLClassifier(): (text: string) => Promise<ClassificationResult | null> {
  // Placeholder: in production, load ONNX model here
  // const session = await ort.InferenceSession.create('/models/signal-classifier.onnx');

  return async (_text: string): Promise<ClassificationResult | null> => {
    // Placeholder implementation — returns null until a real model is loaded.
    // When implemented, this should:
    // 1. Tokenize the input text
    // 2. Run inference through the loaded model
    // 3. Map output logits to SignalType and severity
    // 4. Return classification with confidence from softmax output
    return null;
  };
}

// ---------------------------------------------------------------------------
// Stage 3: LLM Classifier Placeholder (Batched via Groq)
// ---------------------------------------------------------------------------

interface LLMBatchRequest {
  items: Array<{ headline: string; content: string }>;
}

/**
 * Batched LLM classification via Groq API.
 * Placeholder — in production, sends batch to Groq's fast inference API.
 */
async function llmClassifyBatch(
  batch: LLMBatchRequest,
): Promise<Array<ClassificationResult | null>> {
  // Placeholder: In production, this would:
  // 1. Format items into a structured prompt
  // 2. Call Groq API with llama-3.1-70b or mixtral-8x7b
  // 3. Parse structured JSON response
  // 4. Map to ClassificationResult

  // Example prompt structure (for reference):
  // const systemPrompt = `You are a B2B signal classifier. For each item, return JSON with:
  //   signalType, signalSubtype, severity, intentScore, confidence, whyItMatters`;
  // const response = await groq.chat.completions.create({
  //   model: 'llama-3.1-70b-versatile',
  //   messages: [{ role: 'system', content: systemPrompt }, ...],
  //   response_format: { type: 'json_object' },
  // });

  return batch.items.map(() => null);
}

// ---------------------------------------------------------------------------
// Stage 4: Confidence Merging
// ---------------------------------------------------------------------------

/**
 * Source tier weighting: tier 1 (premium) boosts confidence,
 * lower tiers reduce it.
 */
function applySourceTierWeight(confidence: number, sourceTier: number): number {
  const tierMultiplier: Record<number, number> = {
    1: 1.15, // Premium sources (SEC filings, official press releases)
    2: 1.05, // Established outlets (major tech news)
    3: 1.0,  // Standard sources
    4: 0.9,  // Aggregators
    5: 0.75, // Social / unverified
  };
  const multiplier = tierMultiplier[sourceTier] ?? 1.0;
  return Math.min(confidence * multiplier, MAX_CONFIDENCE);
}

/**
 * Merge results from keyword, ML, and LLM classifiers.
 * Priority: LLM > ML > Keyword (but keyword always runs).
 * If multiple agree, confidence is boosted.
 */
function mergeClassifications(
  keywordResult: ClassificationResult | null,
  mlResult: ClassificationResult | null,
  llmResult: ClassificationResult | null,
  sourceTier: number,
): MergedClassification | null {
  // Gather all non-null results
  const results = [llmResult, mlResult, keywordResult].filter(
    (r): r is ClassificationResult => r !== null,
  );

  if (results.length === 0) return null;

  // Use highest-priority result as base (LLM > ML > Keyword)
  const base = results[0];

  // Check agreement — if multiple classifiers agree on signal type, boost confidence
  const agreementCount = results.filter((r) => r.signalType === base.signalType).length;
  let mergedConfidence = base.confidence;
  if (agreementCount >= 3) {
    mergedConfidence = Math.min(mergedConfidence + 0.15, MAX_CONFIDENCE);
  } else if (agreementCount >= 2) {
    mergedConfidence = Math.min(mergedConfidence + 0.08, MAX_CONFIDENCE);
  }

  // Apply source tier weighting
  mergedConfidence = applySourceTierWeight(mergedConfidence, sourceTier);

  // Determine recommended action based on severity
  const actionMap: Record<SignalSeverity, RecommendedAction> = {
    critical: 'urgent_outreach',
    high: 'engage',
    medium: 'research',
    low: 'monitor',
    info: 'ignore',
  };

  return {
    signalType: base.signalType,
    signalSubtype: base.signalSubtype,
    severity: base.severity,
    intentScore: base.intentScore,
    confidence: Math.round(mergedConfidence * 100) / 100,
    whyItMatters: base.whyItMatters,
    recommendedAction: actionMap[base.severity],
    entities: extractEntities(base),
    classifiedBy: base.classifiedBy,
    keywordResult,
    mlResult,
    llmResult,
  };
}

/**
 * Basic entity extraction placeholder.
 * In production, this would use NER from the ML model or LLM output.
 */
function extractEntities(_result: ClassificationResult): SignalEntities {
  return {
    people: [],
    companies: [],
    technologies: [],
    amounts: [],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify a single signal through the hybrid pipeline.
 *
 * 1. Keyword classifier runs synchronously (instant)
 * 2. ML classifier is attempted if available
 * 3. LLM classifier is called for ambiguous or high-value signals
 * 4. Results are merged with source tier weighting
 */
export async function classifySignal(
  headline: string,
  content: string,
  sourceTier: number,
): Promise<MergedClassification | null> {
  // Stage 1: Keyword (instant)
  const keywordResult = keywordClassify(headline, content);

  // Stage 2: ML (placeholder)
  const mlClassifier = createMLClassifier();
  const mlResult = await mlClassifier(`${headline} ${content}`);

  // Stage 3: LLM — only call if keyword confidence is below threshold
  // or if no keyword match found (cost optimization)
  let llmResult: ClassificationResult | null = null;
  const shouldCallLLM =
    keywordResult === null || keywordResult.confidence < 0.65;

  if (shouldCallLLM) {
    const batchResults = await llmClassifyBatch({
      items: [{ headline, content }],
    });
    llmResult = batchResults[0] ?? null;
  }

  // Stage 4: Merge
  return mergeClassifications(keywordResult, mlResult, llmResult, sourceTier);
}

/**
 * Batch classify multiple signals.
 * Optimized: runs all keyword classifications first, then batches
 * LLM calls for items that need them.
 */
export async function classifySignalBatch(
  items: Array<{ headline: string; content: string; sourceTier: number }>,
): Promise<Array<MergedClassification | null>> {
  // Stage 1: Keyword classify all items (synchronous, instant)
  const keywordResults = items.map((item) =>
    keywordClassify(item.headline, item.content),
  );

  // Stage 2: ML classify all items
  const mlClassifier = createMLClassifier();
  const mlResults = await Promise.all(
    items.map((item) => mlClassifier(`${item.headline} ${item.content}`)),
  );

  // Stage 3: Batch LLM for items that need it
  const needsLLM: number[] = [];
  for (let i = 0; i < items.length; i++) {
    if (keywordResults[i] === null || keywordResults[i]!.confidence < 0.65) {
      needsLLM.push(i);
    }
  }

  const llmResults: Array<ClassificationResult | null> = new Array(items.length).fill(null);

  if (needsLLM.length > 0) {
    const llmBatchItems = needsLLM.map((idx) => ({
      headline: items[idx].headline,
      content: items[idx].content,
    }));

    const batchResults = await llmClassifyBatch({ items: llmBatchItems });

    for (let j = 0; j < needsLLM.length; j++) {
      llmResults[needsLLM[j]] = batchResults[j] ?? null;
    }
  }

  // Stage 4: Merge all results
  return items.map((item, idx) =>
    mergeClassifications(
      keywordResults[idx],
      mlResults[idx],
      llmResults[idx],
      item.sourceTier,
    ),
  );
}
