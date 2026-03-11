export type EntityType = 'company' | 'person' | 'technology' | 'investor' | 'event';
export type RelationshipType =
  | 'employs' | 'invested_in' | 'competes_with' | 'uses_technology'
  | 'previously_at' | 'partners_with' | 'acquired' | 'board_member_of';

export interface GraphEntity {
  id: string;
  entityType: EntityType;
  entityRefId: string | null;
  name: string;
  attributes: Record<string, unknown>;
  createdAt: string;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: RelationshipType;
  weight: number;
  metadata: Record<string, unknown>;
  detectedFrom: string | null;
  createdAt: string;
}

export interface IntelligenceGraph {
  entities: GraphEntity[];
  edges: GraphEdge[];
}
