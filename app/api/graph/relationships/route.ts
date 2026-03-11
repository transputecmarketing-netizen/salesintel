import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import type { EntityType, RelationshipType } from '@/types/graph';

interface CreateRelationshipRequest {
  sourceEntityId?: string;
  targetEntityId?: string;
  // Or create entities inline
  source?: { entityType: EntityType; name: string; entityRefId?: string; attributes?: Record<string, unknown> };
  target?: { entityType: EntityType; name: string; entityRefId?: string; attributes?: Record<string, unknown> };
  relationship: RelationshipType;
  weight?: number;
  metadata?: Record<string, unknown>;
  detectedFrom?: string;
}

const VALID_ENTITY_TYPES: EntityType[] = ['company', 'person', 'technology', 'investor', 'event'];
const VALID_RELATIONSHIPS: RelationshipType[] = [
  'employs', 'invested_in', 'competes_with', 'uses_technology',
  'previously_at', 'partners_with', 'acquired', 'board_member_of',
];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sourceEntityId,
      targetEntityId,
      source,
      target,
      relationship,
      weight,
      metadata,
      detectedFrom,
    } = body as CreateRelationshipRequest;

    // Validate relationship type
    if (!relationship || !VALID_RELATIONSHIPS.includes(relationship)) {
      return NextResponse.json(
        { error: `relationship must be one of: ${VALID_RELATIONSHIPS.join(', ')}` },
        { status: 400 }
      );
    }

    // Must provide either entity IDs or inline entity definitions
    if (!sourceEntityId && !source) {
      return NextResponse.json(
        { error: 'Either sourceEntityId or source entity definition is required' },
        { status: 400 }
      );
    }

    if (!targetEntityId && !target) {
      return NextResponse.json(
        { error: 'Either targetEntityId or target entity definition is required' },
        { status: 400 }
      );
    }

    // Validate inline entity definitions
    if (source) {
      if (!source.entityType || !VALID_ENTITY_TYPES.includes(source.entityType)) {
        return NextResponse.json(
          { error: `source.entityType must be one of: ${VALID_ENTITY_TYPES.join(', ')}` },
          { status: 400 }
        );
      }
      if (!source.name || typeof source.name !== 'string') {
        return NextResponse.json(
          { error: 'source.name is required and must be a string' },
          { status: 400 }
        );
      }
    }

    if (target) {
      if (!target.entityType || !VALID_ENTITY_TYPES.includes(target.entityType)) {
        return NextResponse.json(
          { error: `target.entityType must be one of: ${VALID_ENTITY_TYPES.join(', ')}` },
          { status: 400 }
        );
      }
      if (!target.name || typeof target.name !== 'string') {
        return NextResponse.json(
          { error: 'target.name is required and must be a string' },
          { status: 400 }
        );
      }
    }

    const edgeWeight = typeof weight === 'number' && weight >= 0 && weight <= 1 ? weight : 1.0;

    // In production: create entities if needed, then create edge
    // const sourceId = sourceEntityId ?? (await createEntity(source!));
    // const targetId = targetEntityId ?? (await createEntity(target!));
    // const edge = await createEdge({ sourceId, targetId, relationship, weight, metadata });

    const now = new Date().toISOString();
    const responseEdge = {
      id: crypto.randomUUID(),
      sourceId: sourceEntityId ?? crypto.randomUUID(),
      targetId: targetEntityId ?? crypto.randomUUID(),
      relationship,
      weight: edgeWeight,
      metadata: metadata ?? {},
      detectedFrom: detectedFrom ?? null,
      createdAt: now,
    };

    const responseEntities = [];
    if (source) {
      responseEntities.push({
        id: responseEdge.sourceId,
        entityType: source.entityType,
        entityRefId: source.entityRefId ?? null,
        name: source.name,
        attributes: source.attributes ?? {},
        createdAt: now,
      });
    }
    if (target) {
      responseEntities.push({
        id: responseEdge.targetId,
        entityType: target.entityType,
        entityRefId: target.entityRefId ?? null,
        name: target.name,
        attributes: target.attributes ?? {},
        createdAt: now,
      });
    }

    return NextResponse.json(
      {
        edge: responseEdge,
        createdEntities: responseEntities,
        message: 'Relationship created successfully',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Graph/Relationships] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
