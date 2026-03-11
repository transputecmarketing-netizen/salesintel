import type { IntelligenceGraph, GraphEntity, GraphEdge, EntityType, RelationshipType } from '@/types/graph';
import { findEntitiesByType } from './entities';
import { findEdgesFromNode, findEdgesToNode, findEdgesOfType } from './relationships';

export interface TraversalResult {
  entities: GraphEntity[];
  paths: GraphEdge[][];
}

/**
 * Find all competitors of a company in the graph.
 */
export function findCompetitors(graph: IntelligenceGraph, companyEntityId: string): GraphEntity[] {
  const competesEdges = findEdgesFromNode(graph.edges, companyEntityId)
    .filter((e) => e.relationship === 'competes_with');

  const reverseEdges = findEdgesToNode(graph.edges, companyEntityId)
    .filter((e) => e.relationship === 'competes_with');

  const competitorIds = new Set<string>();
  for (const edge of competesEdges) competitorIds.add(edge.targetId);
  for (const edge of reverseEdges) competitorIds.add(edge.sourceId);

  return graph.entities.filter((e) => competitorIds.has(e.id));
}

/**
 * Find all portfolio companies of an investor (companies they've invested in).
 */
export function findPortfolioCompanies(graph: IntelligenceGraph, investorEntityId: string): GraphEntity[] {
  const investedEdges = findEdgesFromNode(graph.edges, investorEntityId)
    .filter((e) => e.relationship === 'invested_in');

  const companyIds = new Set(investedEdges.map((e) => e.targetId));
  return graph.entities.filter((e) => companyIds.has(e.id));
}

/**
 * Find all investors of a company.
 */
export function findInvestors(graph: IntelligenceGraph, companyEntityId: string): GraphEntity[] {
  const investedEdges = findEdgesToNode(graph.edges, companyEntityId)
    .filter((e) => e.relationship === 'invested_in');

  const investorIds = new Set(investedEdges.map((e) => e.sourceId));
  return graph.entities.filter((e) => investorIds.has(e.id));
}

/**
 * Find people who moved between two companies.
 */
export function findPeopleWhoBridgeCompanies(
  graph: IntelligenceGraph,
  companyId1: string,
  companyId2: string
): GraphEntity[] {
  // Find people employed by company 1
  const employsEdges1 = findEdgesFromNode(graph.edges, companyId1)
    .filter((e) => e.relationship === 'employs');
  const currentAtCompany1 = new Set(employsEdges1.map((e) => e.targetId));

  // Find people previously at company 2
  const previouslyAtEdges2 = findEdgesToNode(graph.edges, companyId2)
    .filter((e) => e.relationship === 'previously_at');
  const previouslyAtCompany2 = new Set(previouslyAtEdges2.map((e) => e.sourceId));

  // Find people employed by company 2
  const employsEdges2 = findEdgesFromNode(graph.edges, companyId2)
    .filter((e) => e.relationship === 'employs');
  const currentAtCompany2 = new Set(employsEdges2.map((e) => e.targetId));

  // Find people previously at company 1
  const previouslyAtEdges1 = findEdgesToNode(graph.edges, companyId1)
    .filter((e) => e.relationship === 'previously_at');
  const previouslyAtCompany1 = new Set(previouslyAtEdges1.map((e) => e.sourceId));

  const bridgePeople = new Set<string>();

  // People currently at company1 who were previously at company2
  for (const id of currentAtCompany1) {
    if (previouslyAtCompany2.has(id)) bridgePeople.add(id);
  }

  // People currently at company2 who were previously at company1
  for (const id of currentAtCompany2) {
    if (previouslyAtCompany1.has(id)) bridgePeople.add(id);
  }

  return graph.entities.filter((e) => bridgePeople.has(e.id));
}

/**
 * Find all people at a company with their roles.
 */
export function findTeamMembers(
  graph: IntelligenceGraph,
  companyEntityId: string
): Array<{ entity: GraphEntity; title?: string }> {
  const employsEdges = findEdgesFromNode(graph.edges, companyEntityId)
    .filter((e) => e.relationship === 'employs');

  return employsEdges
    .map((edge) => {
      const entity = graph.entities.find((e) => e.id === edge.targetId);
      if (!entity) return null;
      return { entity, title: edge.metadata?.title as string | undefined };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

/**
 * Find the technology stack of a company.
 */
export function findTechStack(graph: IntelligenceGraph, companyEntityId: string): GraphEntity[] {
  const techEdges = findEdgesFromNode(graph.edges, companyEntityId)
    .filter((e) => e.relationship === 'uses_technology');

  const techIds = new Set(techEdges.map((e) => e.targetId));
  return graph.entities.filter((e) => techIds.has(e.id));
}

/**
 * Find companies that share a common investor.
 */
export function findCoInvestedCompanies(
  graph: IntelligenceGraph,
  companyEntityId: string
): Array<{ company: GraphEntity; sharedInvestors: GraphEntity[] }> {
  const investors = findInvestors(graph, companyEntityId);

  const coInvested = new Map<string, Set<string>>();

  for (const investor of investors) {
    const portfolio = findPortfolioCompanies(graph, investor.id);
    for (const company of portfolio) {
      if (company.id === companyEntityId) continue;
      if (!coInvested.has(company.id)) {
        coInvested.set(company.id, new Set());
      }
      coInvested.get(company.id)!.add(investor.id);
    }
  }

  return Array.from(coInvested.entries()).map(([companyId, investorIds]) => ({
    company: graph.entities.find((e) => e.id === companyId)!,
    sharedInvestors: graph.entities.filter((e) => investorIds.has(e.id)),
  })).filter((r) => r.company != null);
}

/**
 * Find companies that use a specific technology.
 */
export function findCompaniesUsingTechnology(
  graph: IntelligenceGraph,
  technologyEntityId: string
): GraphEntity[] {
  const techEdges = findEdgesToNode(graph.edges, technologyEntityId)
    .filter((e) => e.relationship === 'uses_technology');

  const companyIds = new Set(techEdges.map((e) => e.sourceId));
  return graph.entities.filter((e) => companyIds.has(e.id));
}

/**
 * Find the shortest path between two entities using BFS.
 */
export function findShortestPath(
  graph: IntelligenceGraph,
  startId: string,
  endId: string
): GraphEdge[] | null {
  if (startId === endId) return [];

  const visited = new Set<string>();
  const queue: Array<{ nodeId: string; path: GraphEdge[] }> = [{ nodeId: startId, path: [] }];

  visited.add(startId);

  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!;

    // Get all edges from and to this node
    const outgoing = findEdgesFromNode(graph.edges, nodeId);
    const incoming = findEdgesToNode(graph.edges, nodeId);

    const neighbors: Array<{ nextId: string; edge: GraphEdge }> = [];
    for (const edge of outgoing) {
      neighbors.push({ nextId: edge.targetId, edge });
    }
    for (const edge of incoming) {
      neighbors.push({ nextId: edge.sourceId, edge });
    }

    for (const { nextId, edge } of neighbors) {
      if (visited.has(nextId)) continue;

      const newPath = [...path, edge];

      if (nextId === endId) return newPath;

      visited.add(nextId);
      queue.push({ nodeId: nextId, path: newPath });
    }
  }

  return null;
}

/**
 * Get connected components in the graph.
 */
export function getConnectedComponents(graph: IntelligenceGraph): GraphEntity[][] {
  const visited = new Set<string>();
  const components: GraphEntity[][] = [];

  for (const entity of graph.entities) {
    if (visited.has(entity.id)) continue;

    const component: GraphEntity[] = [];
    const stack = [entity.id];

    while (stack.length > 0) {
      const nodeId = stack.pop()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = graph.entities.find((e) => e.id === nodeId);
      if (node) component.push(node);

      const outgoing = findEdgesFromNode(graph.edges, nodeId);
      const incoming = findEdgesToNode(graph.edges, nodeId);

      for (const edge of outgoing) {
        if (!visited.has(edge.targetId)) stack.push(edge.targetId);
      }
      for (const edge of incoming) {
        if (!visited.has(edge.sourceId)) stack.push(edge.sourceId);
      }
    }

    if (component.length > 0) {
      components.push(component);
    }
  }

  return components.sort((a, b) => b.length - a.length);
}

/**
 * Calculate centrality score for each entity (degree centrality).
 */
export function calculateCentrality(graph: IntelligenceGraph): Map<string, number> {
  const centrality = new Map<string, number>();
  const maxDegree = graph.entities.length - 1;

  for (const entity of graph.entities) {
    const outgoing = findEdgesFromNode(graph.edges, entity.id).length;
    const incoming = findEdgesToNode(graph.edges, entity.id).length;
    const degree = outgoing + incoming;
    centrality.set(entity.id, maxDegree > 0 ? degree / maxDegree : 0);
  }

  return centrality;
}
