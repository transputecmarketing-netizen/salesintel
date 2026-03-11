import type { RelationshipType, GraphEdge } from '@/types/graph';

export function createEdge(
  sourceId: string,
  targetId: string,
  relationship: RelationshipType,
  options: {
    weight?: number;
    metadata?: Record<string, unknown>;
    detectedFrom?: string;
  } = {}
): GraphEdge {
  return {
    id: generateEdgeId(sourceId, targetId, relationship),
    sourceId,
    targetId,
    relationship,
    weight: options.weight ?? 1.0,
    metadata: options.metadata ?? {},
    detectedFrom: options.detectedFrom ?? null,
    createdAt: new Date().toISOString(),
  };
}

export function generateEdgeId(sourceId: string, targetId: string, relationship: RelationshipType): string {
  return `${sourceId}--${relationship}-->${targetId}`;
}

export function createEmploysEdge(companyId: string, personId: string, metadata?: { title?: string; startDate?: string }): GraphEdge {
  return createEdge(companyId, personId, 'employs', { metadata: metadata ?? {}, weight: 1.0 });
}

export function createInvestedInEdge(
  investorId: string,
  companyId: string,
  metadata?: { round?: string; amount?: number; date?: string }
): GraphEdge {
  return createEdge(investorId, companyId, 'invested_in', { metadata: metadata ?? {}, weight: 0.8 });
}

export function createCompetesWithEdge(
  companyId1: string,
  companyId2: string,
  metadata?: { basis?: string; overlap?: number }
): GraphEdge {
  return createEdge(companyId1, companyId2, 'competes_with', { metadata: metadata ?? {}, weight: 0.6 });
}

export function createUsesTechnologyEdge(
  companyId: string,
  technologyId: string,
  metadata?: { detectedAt?: string; category?: string }
): GraphEdge {
  return createEdge(companyId, technologyId, 'uses_technology', { metadata: metadata ?? {}, weight: 0.5 });
}

export function createPreviouslyAtEdge(
  personId: string,
  companyId: string,
  metadata?: { title?: string; startDate?: string; endDate?: string }
): GraphEdge {
  return createEdge(personId, companyId, 'previously_at', { metadata: metadata ?? {}, weight: 0.4 });
}

export function createPartnersWithEdge(
  companyId1: string,
  companyId2: string,
  metadata?: { type?: string; announcedDate?: string }
): GraphEdge {
  return createEdge(companyId1, companyId2, 'partners_with', { metadata: metadata ?? {}, weight: 0.7 });
}

export function createAcquiredEdge(
  acquirerId: string,
  acquiredId: string,
  metadata?: { date?: string; price?: number }
): GraphEdge {
  return createEdge(acquirerId, acquiredId, 'acquired', { metadata: metadata ?? {}, weight: 1.0 });
}

export function createBoardMemberEdge(
  personId: string,
  companyId: string,
  metadata?: { role?: string; since?: string }
): GraphEdge {
  return createEdge(personId, companyId, 'board_member_of', { metadata: metadata ?? {}, weight: 0.9 });
}

export function findEdgesBetween(edges: GraphEdge[], sourceId: string, targetId: string): GraphEdge[] {
  return edges.filter((e) => e.sourceId === sourceId && e.targetId === targetId);
}

export function findEdgesFromNode(edges: GraphEdge[], nodeId: string): GraphEdge[] {
  return edges.filter((e) => e.sourceId === nodeId);
}

export function findEdgesToNode(edges: GraphEdge[], nodeId: string): GraphEdge[] {
  return edges.filter((e) => e.targetId === nodeId);
}

export function findEdgesOfType(edges: GraphEdge[], relationship: RelationshipType): GraphEdge[] {
  return edges.filter((e) => e.relationship === relationship);
}

export function deduplicateEdges(edges: GraphEdge[]): GraphEdge[] {
  const seen = new Map<string, GraphEdge>();

  for (const edge of edges) {
    const existing = seen.get(edge.id);
    if (existing) {
      // Keep higher weight
      if (edge.weight > existing.weight) {
        seen.set(edge.id, { ...edge, metadata: { ...existing.metadata, ...edge.metadata } });
      }
    } else {
      seen.set(edge.id, edge);
    }
  }

  return Array.from(seen.values());
}
