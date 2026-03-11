import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import type { SignalType, SignalSeverity, Signal } from '@/types/signal';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q')?.trim() ?? '';
    const typesParam = searchParams.get('types');
    const severityParam = searchParams.get('severity');
    const companyId = searchParams.get('companyId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(Math.max(1, parseInt(searchParams.get('pageSize') ?? '25', 10)), 100);
    const sortBy = searchParams.get('sortBy') ?? 'detectedAt';
    const sortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';

    // Parse filter arrays
    const types: SignalType[] | undefined = typesParam
      ? (typesParam.split(',').filter(Boolean) as SignalType[])
      : undefined;

    const severities: SignalSeverity[] | undefined = severityParam
      ? (severityParam.split(',').filter(Boolean) as SignalSeverity[])
      : undefined;

    // Validate date range
    if (dateFrom && isNaN(Date.parse(dateFrom))) {
      return NextResponse.json({ error: 'Invalid dateFrom format' }, { status: 400 });
    }
    if (dateTo && isNaN(Date.parse(dateTo))) {
      return NextResponse.json({ error: 'Invalid dateTo format' }, { status: 400 });
    }

    // Build query parameters for database call
    // In production, this would query the signals table via Drizzle ORM
    const queryParams = {
      userId,
      textQuery: q || undefined,
      types,
      severities,
      companyId: companyId || undefined,
      dateRange: dateFrom || dateTo
        ? { start: dateFrom ?? undefined, end: dateTo ?? undefined }
        : undefined,
      pagination: { page, pageSize },
      sort: { field: sortBy, direction: sortDir as 'asc' | 'desc' },
    };

    // Placeholder: return empty results structure
    // In production, execute: db.select().from(signals).where(...).orderBy(...).limit(...)
    const results: Signal[] = [];
    const totalCount = 0;

    return NextResponse.json({
      signals: results,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: page * pageSize < totalCount,
      },
      filters: {
        query: q || null,
        types: types ?? null,
        severities: severities ?? null,
        companyId: companyId ?? null,
        dateRange: queryParams.dateRange ?? null,
      },
      sort: { field: sortBy, direction: sortDir },
    });
  } catch (err) {
    console.error('[Signals/Search] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
