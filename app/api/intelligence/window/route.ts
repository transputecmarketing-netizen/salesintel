import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import type { BuyingWindowPrediction } from '@/types/research';

interface WindowSignal {
  type: string;
  description: string;
  weight: number;
  detectedAt: string;
}

function analyzeWindowSignals(_companyId: string): WindowSignal[] {
  // In production: query recent signals and determine buying window indicators
  // Key indicators: budget cycle, fiscal year end, recent funding, leadership changes,
  // competitive displacement, contract renewals, expansion signals
  const now = Date.now();

  return [
    {
      type: 'fiscal_year_planning',
      description: 'Company approaching fiscal year planning period',
      weight: 0.3,
      detectedAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: 'recent_funding',
      description: 'Series B funding closed within last 90 days',
      weight: 0.25,
      detectedAt: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: 'hiring_surge',
      description: 'Engineering team growing >20% in last quarter',
      weight: 0.2,
      detectedAt: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: 'tech_evaluation',
      description: 'Job postings mention evaluating new platforms',
      weight: 0.15,
      detectedAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function predictWindow(signals: WindowSignal[]): BuyingWindowPrediction {
  const now = new Date();
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const confidence = Math.min(Math.round(totalWeight * 100) / 100, 0.95);

  // Determine window based on signal recency and weight
  const avgRecencyDays = signals.reduce((sum, s) => {
    return sum + (now.getTime() - new Date(s.detectedAt).getTime()) / (24 * 60 * 60 * 1000);
  }, 0) / signals.length;

  let windowStartOffset: number; // days from now
  let windowLength: number; // days
  let urgency: BuyingWindowPrediction['urgency'];

  if (avgRecencyDays < 7 && totalWeight > 0.7) {
    windowStartOffset = 0;
    windowLength = 30;
    urgency = 'immediate';
  } else if (avgRecencyDays < 14 && totalWeight > 0.5) {
    windowStartOffset = 7;
    windowLength = 45;
    urgency = 'this_week';
  } else if (avgRecencyDays < 30 && totalWeight > 0.3) {
    windowStartOffset = 14;
    windowLength = 60;
    urgency = 'this_month';
  } else if (totalWeight > 0.2) {
    windowStartOffset = 30;
    windowLength = 90;
    urgency = 'this_quarter';
  } else {
    windowStartOffset = 90;
    windowLength = 180;
    urgency = 'monitor';
  }

  const windowStart = new Date(now.getTime() + windowStartOffset * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(windowStart.getTime() + windowLength * 24 * 60 * 60 * 1000);
  const optimalOutreachDate = new Date(
    windowStart.getTime() + Math.round(windowLength * 0.2) * 24 * 60 * 60 * 1000
  );

  // Primary driver is highest-weight signal
  const primaryDriver = signals.length > 0
    ? signals.sort((a, b) => b.weight - a.weight)[0]!.description
    : 'Insufficient signal data';

  return {
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    confidence,
    primaryDriver,
    optimalOutreachDate: optimalOutreachDate.toISOString(),
    urgency,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId } = body as { companyId?: string };

    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json(
        { error: 'companyId is required and must be a string' },
        { status: 400 }
      );
    }

    const signals = analyzeWindowSignals(companyId);
    const prediction = predictWindow(signals);

    return NextResponse.json({
      companyId,
      prediction,
      signals,
      computedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Intelligence/Window] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
