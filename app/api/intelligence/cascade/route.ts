import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import type { SignalType } from '@/types/signal';

interface CascadeNode {
  signalType: SignalType;
  probability: number;
  timeframeWeeks: number;
  description: string;
  historicalOccurrence: number; // percentage of times this cascade was observed
}

interface CascadePrediction {
  triggerSignalId: string;
  triggerSignalType: SignalType;
  predictedCascade: CascadeNode[];
  overallConfidence: number;
  totalTimeframeWeeks: number;
}

// Cascade probability matrix: given signal A, what's the probability of signal B following
const CASCADE_MATRIX: Record<SignalType, CascadeNode[]> = {
  funding: [
    { signalType: 'hiring', probability: 0.85, timeframeWeeks: 4, description: 'Post-funding hiring surge', historicalOccurrence: 85 },
    { signalType: 'expansion', probability: 0.6, timeframeWeeks: 12, description: 'Market or office expansion', historicalOccurrence: 60 },
    { signalType: 'technology', probability: 0.5, timeframeWeeks: 8, description: 'Infrastructure/platform investment', historicalOccurrence: 50 },
    { signalType: 'product_launch', probability: 0.4, timeframeWeeks: 16, description: 'New product or feature launch', historicalOccurrence: 40 },
  ],
  hiring: [
    { signalType: 'product_launch', probability: 0.5, timeframeWeeks: 12, description: 'Product development acceleration', historicalOccurrence: 50 },
    { signalType: 'technology', probability: 0.45, timeframeWeeks: 8, description: 'Tech stack evolution', historicalOccurrence: 45 },
    { signalType: 'expansion', probability: 0.35, timeframeWeeks: 16, description: 'Capacity-driven expansion', historicalOccurrence: 35 },
  ],
  leadership: [
    { signalType: 'hiring', probability: 0.7, timeframeWeeks: 6, description: 'New leadership rebuilds team', historicalOccurrence: 70 },
    { signalType: 'technology', probability: 0.55, timeframeWeeks: 12, description: 'New CTO/CIO drives tech changes', historicalOccurrence: 55 },
    { signalType: 'competitive', probability: 0.4, timeframeWeeks: 16, description: 'Strategic direction shift', historicalOccurrence: 40 },
    { signalType: 'partnership', probability: 0.35, timeframeWeeks: 20, description: 'New leadership brings partnerships', historicalOccurrence: 35 },
  ],
  expansion: [
    { signalType: 'hiring', probability: 0.8, timeframeWeeks: 4, description: 'Expansion drives local hiring', historicalOccurrence: 80 },
    { signalType: 'partnership', probability: 0.45, timeframeWeeks: 12, description: 'Local market partnerships', historicalOccurrence: 45 },
  ],
  technology: [
    { signalType: 'hiring', probability: 0.6, timeframeWeeks: 6, description: 'Need specialists for new tech', historicalOccurrence: 60 },
    { signalType: 'product_launch', probability: 0.45, timeframeWeeks: 16, description: 'Tech investment leads to product', historicalOccurrence: 45 },
  ],
  financial: [
    { signalType: 'hiring', probability: 0.4, timeframeWeeks: 8, description: 'Strong financials enable growth', historicalOccurrence: 40 },
    { signalType: 'expansion', probability: 0.35, timeframeWeeks: 12, description: 'Revenue growth funds expansion', historicalOccurrence: 35 },
  ],
  competitive: [
    { signalType: 'technology', probability: 0.6, timeframeWeeks: 8, description: 'Competitive pressure drives tech adoption', historicalOccurrence: 60 },
    { signalType: 'hiring', probability: 0.5, timeframeWeeks: 6, description: 'Competitive response hiring', historicalOccurrence: 50 },
  ],
  tender: [
    { signalType: 'partnership', probability: 0.5, timeframeWeeks: 12, description: 'Tender leads to vendor partnership', historicalOccurrence: 50 },
    { signalType: 'technology', probability: 0.45, timeframeWeeks: 8, description: 'Procurement drives tech adoption', historicalOccurrence: 45 },
  ],
  product_launch: [
    { signalType: 'hiring', probability: 0.55, timeframeWeeks: 8, description: 'Post-launch team scaling', historicalOccurrence: 55 },
    { signalType: 'partnership', probability: 0.4, timeframeWeeks: 12, description: 'Launch ecosystem partnerships', historicalOccurrence: 40 },
  ],
  partnership: [
    { signalType: 'technology', probability: 0.5, timeframeWeeks: 8, description: 'Partnership drives integration', historicalOccurrence: 50 },
    { signalType: 'expansion', probability: 0.35, timeframeWeeks: 16, description: 'Partnership opens new markets', historicalOccurrence: 35 },
  ],
  earnings: [
    { signalType: 'hiring', probability: 0.45, timeframeWeeks: 8, description: 'Post-earnings investment in headcount', historicalOccurrence: 45 },
    { signalType: 'expansion', probability: 0.3, timeframeWeeks: 12, description: 'Earnings-driven growth initiatives', historicalOccurrence: 30 },
  ],
  social: [
    { signalType: 'hiring', probability: 0.2, timeframeWeeks: 12, description: 'Social activity may precede announcements', historicalOccurrence: 20 },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { signalId } = body as { signalId?: string };

    if (!signalId || typeof signalId !== 'string') {
      return NextResponse.json(
        { error: 'signalId is required and must be a string' },
        { status: 400 }
      );
    }

    // In production: look up signal from database to get its type
    // For now, we accept a signalType override for development
    const triggerType: SignalType = (body.signalType as SignalType) ?? 'funding';

    const cascadeNodes = CASCADE_MATRIX[triggerType] ?? [];

    const filteredCascade = cascadeNodes
      .filter((node) => node.probability >= 0.2)
      .sort((a, b) => b.probability - a.probability);

    const overallConfidence = filteredCascade.length > 0
      ? Math.round(
          (filteredCascade.reduce((sum, n) => sum + n.probability, 0) / filteredCascade.length) * 100
        ) / 100
      : 0;

    const totalTimeframeWeeks = filteredCascade.length > 0
      ? Math.max(...filteredCascade.map((n) => n.timeframeWeeks))
      : 0;

    const prediction: CascadePrediction = {
      triggerSignalId: signalId,
      triggerSignalType: triggerType,
      predictedCascade: filteredCascade,
      overallConfidence,
      totalTimeframeWeeks,
    };

    return NextResponse.json({
      prediction,
      computedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Intelligence/Cascade] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
