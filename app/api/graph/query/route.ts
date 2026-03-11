import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import type { EntityType, RelationshipType, GraphEntity, GraphEdge, IntelligenceGraph } from '@/types/graph';

interface GraphQueryParams {
  entityId: string;
  relationship?: RelationshipType;
  depth?: number;
}

// In production: query from graph_entities and graph_edges tables
// This would use recursive CTEs or a graph traversal algorithm
async function queryGraph(
  params: GraphQueryParams
): Promise<IntelligenceGraph> {
  const { entityId, relationship, depth = 2 } = params;

  // Placeholder: in production, this executes a graph traversal query
  // WITH RECURSIVE graph_walk AS (
  //   SELECT * FROM graph_edges WHERE source_id = $entityId
  //   UNION ALL
  //   SELECT e.* FROM graph_edges e JOIN graph_walk gw ON e.source_id = gw.target_id
  //   WHERE gw.depth < $depth
  // )
  void entityId;
  void relationship;
  void depth;

  const entities: GraphEntity[] = [];
  const edges: GraphEdge[] = [];

  return { entities, edges };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entityId, relationship, depth } = body as {
      entityId?: string;
      relationship?: RelationshipType;
      depth?: number;
    };

    if (!entityId || typeof entityId !== 'string') {
      return NextResponse.json(
        { error: 'entityId is required and must be a string' },
        { status: 400 }
      );
    }

    const validRelationships: RelationshipType[] = [
      'employs', 'invested_in', 'competes_with', 'uses_technology',
      'previously_at', 'partners_with', 'acquired', 'board_member_of',
    ];

    if (relationship && !validRelationships.includes(relationship)) {
      return NextResponse.json(
        { error: `relationship must be one of: ${validRelationships.join(', ')}` },
        { status: 400 }
      );
    }

    const queryDepth = typeof depth === 'number' && depth >= 1 && depth <= 5
      ? depth
      : 2;

    const graph = await queryGraph({
      entityId,
      relationship,
      depth: queryDepth,
    });

    return NextResponse.json({
      graph,
      entityCount: graph.entities.length,
      edgeCount: graph.edges.length,
      queryParams: {
        entityId,
        relationship: relationship ?? null,
        depth: queryDepth,
      },
    });
  } catch (err) {
    console.error('[Graph/Query] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
