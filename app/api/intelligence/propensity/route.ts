import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface PropensityFactors {
  signalDensity: number;
  fundingRecency: number;
  hiringVelocity: number;
  techStackFit: number;
  competitorDisplacement: number;
  leadershipChange: number;
  budgetCycleTiming: number;
  engagementHistory: number;
}

const FACTOR_WEIGHTS: Record<keyof PropensityFactors, number> = {
  signalDensity: 0.20,
  fundingRecency: 0.15,
  hiringVelocity: 0.15,
  techStackFit: 0.12,
  competitorDisplacement: 0.12,
  leadershipChange: 0.10,
  budgetCycleTiming: 0.08,
  engagementHistory: 0.08,
};

function computePropensityFactors(_companyId: string): PropensityFactors {
  // In production: each factor would be computed from real data
  // signalDensity: count of signals in last 30 days / baseline
  // fundingRecency: days since last funding (inverse) or 0 if > 6 months
  // hiringVelocity: job posting growth rate
  // techStackFit: overlap with user's product category
  // competitorDisplacement: competitor churn signals
  // leadershipChange: new exec hires in last 90 days
  // budgetCycleTiming: proximity to fiscal year planning period
  // engagementHistory: prior engagement/meeting history
  return {
    signalDensity: Math.round(Math.random() * 80 + 10),
    fundingRecency: Math.round(Math.random() * 90 + 5),
    hiringVelocity: Math.round(Math.random() * 70 + 15),
    techStackFit: Math.round(Math.random() * 85 + 10),
    competitorDisplacement: Math.round(Math.random() * 60 + 5),
    leadershipChange: Math.round(Math.random() * 50 + 10),
    budgetCycleTiming: Math.round(Math.random() * 70 + 20),
    engagementHistory: Math.round(Math.random() * 40 + 10),
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

    const factors = computePropensityFactors(companyId);

    // Weighted sum of all factors
    let propensityScore = 0;
    for (const [key, weight] of Object.entries(FACTOR_WEIGHTS)) {
      propensityScore += factors[key as keyof PropensityFactors] * weight;
    }
    propensityScore = Math.round(propensityScore);

    // Determine tier
    let tier: string;
    if (propensityScore >= 75) tier = 'hot';
    else if (propensityScore >= 50) tier = 'warm';
    else if (propensityScore >= 25) tier = 'cool';
    else tier = 'cold';

    // Top contributing factors
    const sortedFactors = (Object.entries(factors) as [keyof PropensityFactors, number][])
      .map(([key, value]) => ({
        factor: key,
        score: value,
        weight: FACTOR_WEIGHTS[key],
        contribution: Math.round(value * FACTOR_WEIGHTS[key]),
      }))
      .sort((a, b) => b.contribution - a.contribution);

    return NextResponse.json({
      companyId,
      propensityScore,
      tier,
      factors,
      weights: FACTOR_WEIGHTS,
      topContributors: sortedFactors.slice(0, 3),
      allContributors: sortedFactors,
      computedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Intelligence/Propensity] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
