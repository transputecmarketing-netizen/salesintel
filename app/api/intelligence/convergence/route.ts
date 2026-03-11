import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import type { SignalType, SignalSeverity } from '@/types/signal';
import type { ConvergenceResult } from '@/types/research';

interface ConvergenceSignalCluster {
  signalType: SignalType;
  count: number;
  avgSeverity: SignalSeverity;
  latestDetectedAt: string;
}

const CONVERGENCE_THRESHOLDS = {
  minTypesForConvergence: 3,
  minSignalsPerType: 1,
  severityWeights: {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    info: 1,
  } as Record<SignalSeverity, number>,
};

function detectConvergence(
  _companyId: string,
  _windowDays: number
): { clusters: ConvergenceSignalCluster[]; result: ConvergenceResult | null } {
  // In production: query signals within the window and cluster by type
  // For demonstration, simulate signal clusters
  const now = Date.now();
  const simulatedClusters: ConvergenceSignalCluster[] = [
    {
      signalType: 'funding',
      count: 2,
      avgSeverity: 'high',
      latestDetectedAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      signalType: 'hiring',
      count: 5,
      avgSeverity: 'medium',
      latestDetectedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      signalType: 'technology',
      count: 3,
      avgSeverity: 'high',
      latestDetectedAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      signalType: 'leadership',
      count: 1,
      avgSeverity: 'critical',
      latestDetectedAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const qualifyingClusters = simulatedClusters.filter(
    (c) => c.count >= CONVERGENCE_THRESHOLDS.minSignalsPerType
  );

  if (qualifyingClusters.length < CONVERGENCE_THRESHOLDS.minTypesForConvergence) {
    return { clusters: simulatedClusters, result: null };
  }

  const signalTypes = qualifyingClusters.map((c) => c.signalType);
  const totalSeverityWeight = qualifyingClusters.reduce(
    (sum, c) => sum + CONVERGENCE_THRESHOLDS.severityWeights[c.avgSeverity] * c.count,
    0
  );

  let severity: string;
  const avgWeight = totalSeverityWeight / qualifyingClusters.reduce((sum, c) => sum + c.count, 0);
  if (avgWeight >= 4) severity = 'critical';
  else if (avgWeight >= 3) severity = 'high';
  else if (avgWeight >= 2) severity = 'medium';
  else severity = 'low';

  const result: ConvergenceResult = {
    typesDetected: qualifyingClusters.length,
    signalTypes,
    severity,
    narrative: `Convergence detected: ${qualifyingClusters.length} distinct signal types (${signalTypes.join(', ')}) observed within the analysis window. ${
      severity === 'critical' || severity === 'high'
        ? 'This pattern strongly indicates imminent buying activity. Immediate engagement recommended.'
        : 'This pattern suggests growing opportunity. Close monitoring and proactive outreach recommended.'
    }`,
    recommendedAction:
      severity === 'critical' || severity === 'high'
        ? 'urgent_outreach'
        : severity === 'medium'
          ? 'engage'
          : 'research',
  };

  return { clusters: simulatedClusters, result };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, windowDays } = body as {
      companyId?: string;
      windowDays?: number;
    };

    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json(
        { error: 'companyId is required and must be a string' },
        { status: 400 }
      );
    }

    const days = typeof windowDays === 'number' && windowDays > 0 && windowDays <= 365
      ? windowDays
      : 30;

    const { clusters, result } = detectConvergence(companyId, days);

    return NextResponse.json({
      companyId,
      windowDays: days,
      convergenceDetected: result !== null,
      convergence: result,
      signalClusters: clusters,
      thresholds: CONVERGENCE_THRESHOLDS,
      computedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Intelligence/Convergence] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
