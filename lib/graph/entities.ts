import type { EntityType, GraphEntity } from '@/types/graph';

export function createEntity(
  entityType: EntityType,
  name: string,
  entityRefId: string | null = null,
  attributes: Record<string, unknown> = {}
): GraphEntity {
  return {
    id: generateEntityId(entityType, name),
    entityType,
    entityRefId,
    name,
    attributes,
    createdAt: new Date().toISOString(),
  };
}

export function generateEntityId(entityType: EntityType, name: string): string {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return `${entityType}:${normalized}`;
}

export function createCompanyEntity(
  name: string,
  attributes: {
    domain?: string;
    industry?: string;
    employeeCount?: string;
    fundingStage?: string;
    hqLocation?: string;
  } = {}
): GraphEntity {
  return createEntity('company', name, null, attributes);
}

export function createPersonEntity(
  name: string,
  attributes: {
    title?: string;
    company?: string;
    seniority?: string;
    department?: string;
    linkedinUrl?: string;
    email?: string;
  } = {}
): GraphEntity {
  return createEntity('person', name, null, attributes);
}

export function createTechnologyEntity(
  name: string,
  attributes: {
    category?: string;
    vendor?: string;
  } = {}
): GraphEntity {
  return createEntity('technology', name, null, attributes);
}

export function createInvestorEntity(
  name: string,
  attributes: {
    type?: 'vc' | 'pe' | 'angel' | 'corporate';
    portfolioSize?: number;
    aum?: string;
  } = {}
): GraphEntity {
  return createEntity('investor', name, null, attributes);
}

export function createEventEntity(
  name: string,
  attributes: {
    eventType?: string;
    date?: string;
    amount?: number;
    description?: string;
    sourceUrl?: string;
  } = {}
): GraphEntity {
  return createEntity('event', name, null, attributes);
}

export function mergeEntities(existing: GraphEntity, incoming: GraphEntity): GraphEntity {
  return {
    ...existing,
    attributes: { ...existing.attributes, ...incoming.attributes },
    createdAt: existing.createdAt,
  };
}

export function findEntityByName(entities: GraphEntity[], name: string): GraphEntity | undefined {
  const normalized = name.toLowerCase().trim();
  return entities.find((e) => e.name.toLowerCase().trim() === normalized);
}

export function findEntitiesByType(entities: GraphEntity[], type: EntityType): GraphEntity[] {
  return entities.filter((e) => e.entityType === type);
}

export function deduplicateEntities(entities: GraphEntity[]): GraphEntity[] {
  const seen = new Map<string, GraphEntity>();

  for (const entity of entities) {
    const existing = seen.get(entity.id);
    if (existing) {
      seen.set(entity.id, mergeEntities(existing, entity));
    } else {
      seen.set(entity.id, entity);
    }
  }

  return Array.from(seen.values());
}
