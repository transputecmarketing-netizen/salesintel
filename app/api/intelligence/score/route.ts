import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import type { CompanyScores } from '@/types/company';

// Scoring weights for Account Health Score components
const HEALTH_WEIGHTS = {
  fit: 0.30,       // ICP fit
  velocity: 0.25,  // Signal velocity / momentum
  intent: 0.25,    // Intent signals
  readiness: 0.20, // Buying readiness indicators
};

function computeFitScore(_companyId: string, _userId: string): number {
  // In production: compare company attributes against user's ICP config
  // Consider: industry match, company size, tech stack overlap, geo alignment
  return Math.round(Math.random() * 40 + 50); // Placeholder: 50-90
}

function computeVelocityScore(_companyId: string): number {
  // In production: measure signal frequency trend over last 30/60/90 days
  // Accelerating signals = higher score
  return Math.round(Math.random() * 50 + 30);
}

function computeIntentScore(_companyId: string): number {
  // In production: aggregate intent scores from recent signals
  // Weight by recency, source tier, and signal type
  return Math.round(Math.random() * 60 + 20);
}

function computeReadinessScore(_companyId: string): number {
  // In production: look for buying readiness indicators
  // Budget cycle timing, leadership changes, tech evaluations, job postings
  return Math.round(Math.random() * 50 + 25);
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId } = body as { companyId?: string; userId?: string };

    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json(
        { error: 'companyId is required and must be a string' },
        { status: 400 }
      );
    }

    const fitScore = computeFitScore(companyId, userId);
    const velocityScore = computeVelocityScore(companyId);
    const intentScore = computeIntentScore(companyId);
    const readinessScore = computeReadinessScore(companyId);

    const healthScore = Math.round(
      fitScore * HEALTH_WEIGHTS.fit +
      velocityScore * HEALTH_WEIGHTS.velocity +
      intentScore * HEALTH_WEIGHTS.intent +
      readinessScore * HEALTH_WEIGHTS.readiness
    );

    // Determine deal velocity
    let dealVelocity: CompanyScores['dealVelocity'] = 'steady';
    if (velocityScore > 70) dealVelocity = 'accelerating';
    else if (velocityScore < 35) dealVelocity = 'decelerating';

    const scores: CompanyScores = {
      id: crypto.randomUUID(),
      companyId,
      userId,
      healthScore,
      healthFitComponent: fitScore,
      healthVelocityComponent: velocityScore,
      healthIntentComponent: intentScore,
      healthReadinessComponent: readinessScore,
      propensityScore: 0, // Computed via separate endpoint
      propensityFactors: {},
      buyingWindowStart: null,
      buyingWindowEnd: null,
      buyingWindowConfidence: 0,
      buyingWindowDriver: null,
      dealVelocity,
      velocitySignals: [],
      computedAt: new Date().toISOString(),
    };

    // In production: upsert into company_scores table

    return NextResponse.json({
      scores,
      breakdown: {
        fit: { score: fitScore, weight: HEALTH_WEIGHTS.fit },
        velocity: { score: velocityScore, weight: HEALTH_WEIGHTS.velocity },
        intent: { score: intentScore, weight: HEALTH_WEIGHTS.intent },
        readiness: { score: readinessScore, weight: HEALTH_WEIGHTS.readiness },
      },
      healthScore,
      dealVelocity,
    });
  } catch (err) {
    console.error('[Intelligence/Score] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
