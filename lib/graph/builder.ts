import type { IntelligenceGraph, GraphEntity, GraphEdge } from '@/types/graph';
import type { Signal } from '@/types/signal';
import type { Company } from '@/types/company';
import type { Contact } from '@/types/contact';
import {
  createCompanyEntity,
  createPersonEntity,
  createTechnologyEntity,
  createInvestorEntity,
  createEventEntity,
  deduplicateEntities,
  generateEntityId,
} from './entities';
import {
  createEmploysEdge,
  createInvestedInEdge,
  createCompetesWithEdge,
  createUsesTechnologyEdge,
  createPreviouslyAtEdge,
  createAcquiredEdge,
  deduplicateEdges,
} from './relationships';

export interface GraphBuildInput {
  company: Company;
  contacts: Contact[];
  signals: Signal[];
  competitors?: string[];
  fundingRounds?: Array<{
    roundType: string;
    amount: number | null;
    investors: Array<{ name: string }>;
    date: string;
  }>;
  acquisitions?: Array<{
    acquiredCompany: string;
    date: string;
    price: number | null;
  }>;
}

export function buildGraph(input: GraphBuildInput): IntelligenceGraph {
  const entities: GraphEntity[] = [];
  const edges: GraphEdge[] = [];

  // 1. Add the target company
  const companyEntity = createCompanyEntity(input.company.name, {
    domain: input.company.domain ?? undefined,
    industry: input.company.industry ?? undefined,
    employeeCount: input.company.employeeCount ?? undefined,
    fundingStage: input.company.fundingStage ?? undefined,
    hqLocation: [input.company.hqCity, input.company.hqState, input.company.hqCountry]
      .filter(Boolean)
      .join(', ') || undefined,
  });
  entities.push(companyEntity);

  // 2. Add contacts as person entities
  for (const contact of input.contacts) {
    const personEntity = createPersonEntity(contact.fullName, {
      title: contact.title ?? undefined,
      company: input.company.name,
      seniority: contact.seniority ?? undefined,
      department: contact.department ?? undefined,
      linkedinUrl: contact.linkedinUrl ?? undefined,
      email: contact.email ?? undefined,
    });
    entities.push(personEntity);

    // Employment edge
    edges.push(
      createEmploysEdge(companyEntity.id, personEntity.id, {
        title: contact.title ?? undefined,
      })
    );

    // Previous employment edges
    for (const career of contact.careerHistory) {
      if (career.endDate) {
        const prevCompanyEntity = createCompanyEntity(career.company);
        entities.push(prevCompanyEntity);

        edges.push(
          createPreviouslyAtEdge(personEntity.id, prevCompanyEntity.id, {
            title: career.title,
            startDate: career.startDate,
            endDate: career.endDate ?? undefined,
          })
        );
      }
    }
  }

  // 3. Add tech stack as technology entities
  for (const tech of input.company.techStack) {
    const techEntity = createTechnologyEntity(tech.name, {
      category: tech.category,
    });
    entities.push(techEntity);

    edges.push(
      createUsesTechnologyEdge(companyEntity.id, techEntity.id, {
        detectedAt: tech.detectedAt,
        category: tech.category,
      })
    );
  }

  // 4. Add competitors
  for (const competitor of input.competitors ?? []) {
    const competitorEntity = createCompanyEntity(competitor);
    entities.push(competitorEntity);

    edges.push(
      createCompetesWithEdge(companyEntity.id, competitorEntity.id, {
        basis: 'industry_overlap',
      })
    );
  }

  // 5. Add funding rounds and investors
  for (const round of input.fundingRounds ?? []) {
    const eventEntity = createEventEntity(
      `${input.company.name} ${round.roundType}`,
      {
        eventType: 'funding',
        date: round.date,
        amount: round.amount ?? undefined,
        description: `${round.roundType} funding round`,
      }
    );
    entities.push(eventEntity);

    for (const investor of round.investors) {
      const investorEntity = createInvestorEntity(investor.name);
      entities.push(investorEntity);

      edges.push(
        createInvestedInEdge(investorEntity.id, companyEntity.id, {
          round: round.roundType,
          amount: round.amount ?? undefined,
          date: round.date,
        })
      );
    }
  }

  // 6. Add acquisitions
  for (const acquisition of input.acquisitions ?? []) {
    const acquiredEntity = createCompanyEntity(acquisition.acquiredCompany);
    entities.push(acquiredEntity);

    edges.push(
      createAcquiredEdge(companyEntity.id, acquiredEntity.id, {
        date: acquisition.date,
        price: acquisition.price ?? undefined,
      })
    );
  }

  // 7. Extract entities from signals
  for (const signal of input.signals) {
    // People mentioned in signals
    for (const person of signal.entities.people ?? []) {
      const personEntity = createPersonEntity(person.name, {
        title: person.title,
      });
      entities.push(personEntity);
    }

    // Companies mentioned in signals
    for (const company of signal.entities.companies ?? []) {
      const companyEnt = createCompanyEntity(company.name);
      entities.push(companyEnt);
    }

    // Technologies mentioned in signals
    for (const tech of signal.entities.technologies ?? []) {
      const techEntity = createTechnologyEntity(tech.name);
      entities.push(techEntity);
    }
  }

  // Deduplicate
  return {
    entities: deduplicateEntities(entities),
    edges: deduplicateEdges(edges),
  };
}

export function mergeGraphs(a: IntelligenceGraph, b: IntelligenceGraph): IntelligenceGraph {
  return {
    entities: deduplicateEntities([...a.entities, ...b.entities]),
    edges: deduplicateEdges([...a.edges, ...b.edges]),
  };
}

export function getGraphStats(graph: IntelligenceGraph): {
  totalEntities: number;
  totalEdges: number;
  entityCounts: Record<string, number>;
  relationshipCounts: Record<string, number>;
} {
  const entityCounts: Record<string, number> = {};
  for (const entity of graph.entities) {
    entityCounts[entity.entityType] = (entityCounts[entity.entityType] || 0) + 1;
  }

  const relationshipCounts: Record<string, number> = {};
  for (const edge of graph.edges) {
    relationshipCounts[edge.relationship] = (relationshipCounts[edge.relationship] || 0) + 1;
  }

  return {
    totalEntities: graph.entities.length,
    totalEdges: graph.edges.length,
    entityCounts,
    relationshipCounts,
  };
}
