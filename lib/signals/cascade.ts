/**
 * Commercial Cascade Prediction
 *
 * Traces second-order effects through the intelligence graph.
 * When a trigger signal fires, predict which related entities may be affected:
 *
 * - Competitor pressure: competitor wins → their customers may switch
 * - Portfolio siblings: one portfolio company adopts → siblings likely follow
 * - Tech stack adjacency: company adopts complementary tech → related tools needed
 */

import type { Signal, SignalType, SignalSeverity } from '@/types/signal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GraphEntity {
  id: string;
  type: 'company' | 'investor' | 'technology' | 'person' | 'industry';
  name: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  relationship:
    | 'competitor'
    | 'portfolio_sibling'
    | 'investor_of'
    | 'uses_technology'
    | 'partner'
    | 'customer_of'
    | 'supplier_of'
    | 'same_industry'
    | 'tech_adjacent';
  weight: number; // 0-1, strength of relationship
  metadata?: Record<string, unknown>;
}

export interface CascadeEffect {
  affectedEntityId: string;
  affectedEntityName: string;
  cascadeType: CascadeType;
  probability: number;
  severity: SignalSeverity;
  description: string;
  propagationPath: string[];
  estimatedTimeframeDays: number;
  recommendedAction: string;
}

export interface CascadeResult {
  triggerSignal: Signal;
  triggerEntityId: string;
  effects: CascadeEffect[];
  totalAffectedEntities: number;
  highestProbabilityEffect: CascadeEffect | null;
  computedAt: string;
}

export type CascadeType =
  | 'competitor_pressure'
  | 'portfolio_contagion'
  | 'tech_stack_adjacency'
  | 'supply_chain_ripple'
  | 'industry_trend'
  | 'partnership_expansion';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * How strongly different trigger signal types propagate through each edge type.
 */
const PROPAGATION_MATRIX: Record<string, Record<string, number>> = {
  // Signal type → edge relationship → propagation strength
  competitive: {
    competitor: 0.8,
    same_industry: 0.4,
    customer_of: 0.3,
    portfolio_sibling: 0.2,
  },
  funding: {
    portfolio_sibling: 0.7,
    investor_of: 0.5,
    competitor: 0.4,
    same_industry: 0.3,
  },
  technology: {
    tech_adjacent: 0.75,
    uses_technology: 0.6,
    competitor: 0.35,
    partner: 0.4,
  },
  leadership: {
    competitor: 0.3,
    portfolio_sibling: 0.4,
    partner: 0.25,
    same_industry: 0.2,
  },
  expansion: {
    competitor: 0.5,
    same_industry: 0.45,
    partner: 0.3,
    supplier_of: 0.35,
  },
  hiring: {
    competitor: 0.35,
    same_industry: 0.25,
    tech_adjacent: 0.2,
  },
  tender: {
    competitor: 0.6,
    supplier_of: 0.5,
    partner: 0.3,
  },
  partnership: {
    tech_adjacent: 0.5,
    competitor: 0.4,
    same_industry: 0.3,
    partner: 0.6,
  },
  product_launch: {
    competitor: 0.55,
    tech_adjacent: 0.4,
    same_industry: 0.3,
    partner: 0.35,
  },
  financial: {
    competitor: 0.3,
    portfolio_sibling: 0.35,
    same_industry: 0.25,
  },
  earnings: {
    competitor: 0.25,
    same_industry: 0.2,
    investor_of: 0.3,
  },
  social: {
    competitor: 0.15,
    same_industry: 0.1,
  },
};

const CASCADE_TYPE_MAP: Record<string, CascadeType> = {
  competitor: 'competitor_pressure',
  portfolio_sibling: 'portfolio_contagion',
  investor_of: 'portfolio_contagion',
  tech_adjacent: 'tech_stack_adjacency',
  uses_technology: 'tech_stack_adjacency',
  supplier_of: 'supply_chain_ripple',
  customer_of: 'supply_chain_ripple',
  same_industry: 'industry_trend',
  partner: 'partnership_expansion',
};

const ESTIMATED_TIMEFRAME: Record<CascadeType, number> = {
  competitor_pressure: 30,
  portfolio_contagion: 60,
  tech_stack_adjacency: 45,
  supply_chain_ripple: 90,
  industry_trend: 120,
  partnership_expansion: 60,
};

const MIN_PROPAGATION_THRESHOLD = 0.15;
const MAX_CASCADE_DEPTH = 3;

// ---------------------------------------------------------------------------
// Graph Traversal
// ---------------------------------------------------------------------------

function getAdjacentEntities(
  entityId: string,
  edges: GraphEdge[],
): Array<{ entity: string; edge: GraphEdge }> {
  const adjacent: Array<{ entity: string; edge: GraphEdge }> = [];

  for (const edge of edges) {
    if (edge.sourceId === entityId) {
      adjacent.push({ entity: edge.targetId, edge });
    } else if (edge.targetId === entityId) {
      adjacent.push({ entity: edge.sourceId, edge });
    }
  }

  return adjacent;
}

function resolveEntityName(entityId: string, entities: GraphEntity[]): string {
  const entity = entities.find((e) => e.id === entityId);
  return entity?.name ?? entityId;
}

function buildDescription(
  cascadeType: CascadeType,
  triggerSignal: Signal,
  affectedName: string,
  path: string[],
): string {
  const descriptions: Record<CascadeType, string> = {
    competitor_pressure: `Competitor activity "${triggerSignal.title}" may create pressure on ${affectedName} to evaluate alternatives`,
    portfolio_contagion: `Portfolio-level signal "${triggerSignal.title}" suggests ${affectedName} may follow similar patterns`,
    tech_stack_adjacency: `Technology signal "${triggerSignal.title}" indicates ${affectedName} may need adjacent tooling`,
    supply_chain_ripple: `Supply chain signal "${triggerSignal.title}" may impact ${affectedName}'s operations`,
    industry_trend: `Industry signal "${triggerSignal.title}" suggests ${affectedName} faces similar dynamics`,
    partnership_expansion: `Partnership signal "${triggerSignal.title}" may extend to ${affectedName}`,
  };

  return descriptions[cascadeType] ?? `Signal cascade from "${triggerSignal.title}" may affect ${affectedName} via ${path.join(' → ')}`;
}

function buildRecommendedAction(cascadeType: CascadeType, probability: number): string {
  if (probability >= 0.6) {
    switch (cascadeType) {
      case 'competitor_pressure':
        return 'Initiate proactive outreach highlighting competitive differentiation';
      case 'portfolio_contagion':
        return 'Reach out with portfolio-specific case study and reference';
      case 'tech_stack_adjacency':
        return 'Position complementary solution with integration narrative';
      case 'supply_chain_ripple':
        return 'Engage with supply chain resilience messaging';
      case 'industry_trend':
        return 'Share industry trend analysis and benchmark data';
      case 'partnership_expansion':
        return 'Explore partnership extension opportunity';
    }
  }

  if (probability >= 0.35) {
    return 'Add to watchlist and prepare targeted outreach for when signal strengthens';
  }

  return 'Monitor for additional signals before outreach';
}

// ---------------------------------------------------------------------------
// Cascade Computation
// ---------------------------------------------------------------------------

function propagateCascade(
  triggerSignal: Signal,
  triggerEntityId: string,
  entities: GraphEntity[],
  edges: GraphEdge[],
): CascadeEffect[] {
  const effects: CascadeEffect[] = [];
  const visited = new Set<string>();
  visited.add(triggerEntityId);

  const signalType = triggerSignal.signalType;
  const propagationRules = PROPAGATION_MATRIX[signalType] ?? {};

  // BFS through the graph with depth limit
  interface QueueItem {
    entityId: string;
    depth: number;
    probability: number;
    path: string[];
  }

  const queue: QueueItem[] = [{
    entityId: triggerEntityId,
    depth: 0,
    probability: 1.0,
    path: [resolveEntityName(triggerEntityId, entities)],
  }];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.depth >= MAX_CASCADE_DEPTH) continue;

    const adjacent = getAdjacentEntities(current.entityId, edges);

    for (const { entity: neighborId, edge } of adjacent) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);

      // Calculate propagation probability
      const basePropagation = propagationRules[edge.relationship] ?? 0;
      if (basePropagation === 0) continue;

      const probability = current.probability * basePropagation * edge.weight;

      if (probability < MIN_PROPAGATION_THRESHOLD) continue;

      const cascadeType = CASCADE_TYPE_MAP[edge.relationship] ?? 'industry_trend';
      const affectedName = resolveEntityName(neighborId, entities);
      const path = [...current.path, affectedName];

      // Determine severity based on probability
      let severity: SignalSeverity;
      if (probability >= 0.6) severity = 'critical';
      else if (probability >= 0.4) severity = 'high';
      else if (probability >= 0.25) severity = 'medium';
      else severity = 'low';

      effects.push({
        affectedEntityId: neighborId,
        affectedEntityName: affectedName,
        cascadeType,
        probability: Math.round(probability * 100) / 100,
        severity,
        description: buildDescription(cascadeType, triggerSignal, affectedName, path),
        propagationPath: path,
        estimatedTimeframeDays: ESTIMATED_TIMEFRAME[cascadeType],
        recommendedAction: buildRecommendedAction(cascadeType, probability),
      });

      // Continue propagation (with reduced probability)
      queue.push({
        entityId: neighborId,
        depth: current.depth + 1,
        probability,
        path,
      });
    }
  }

  // Sort by probability descending
  effects.sort((a, b) => b.probability - a.probability);

  return effects;
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function predictCascade(
  triggerSignal: Signal,
  graphEntities: GraphEntity[],
  graphEdges: GraphEdge[],
): CascadeResult {
  const triggerEntityId = triggerSignal.companyId;

  const effects = propagateCascade(
    triggerSignal,
    triggerEntityId,
    graphEntities,
    graphEdges,
  );

  return {
    triggerSignal,
    triggerEntityId,
    effects,
    totalAffectedEntities: effects.length,
    highestProbabilityEffect: effects.length > 0 ? effects[0] : null,
    computedAt: new Date().toISOString(),
  };
}
