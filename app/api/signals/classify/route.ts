import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import type {
  SignalType,
  SignalSeverity,
  SignalClassification,
  RecommendedAction,
  SignalEntities,
} from '@/types/signal';

const SIGNAL_TYPE_KEYWORDS: Record<SignalType, string[]> = {
  funding: ['raised', 'funding', 'series', 'round', 'investment', 'capital', 'venture', 'seed', 'ipo', 'valuation'],
  hiring: ['hiring', 'job', 'recruit', 'talent', 'headcount', 'team growth', 'open role', 'engineer', 'developer'],
  expansion: ['expansion', 'new office', 'new market', 'international', 'global', 'launch', 'opened'],
  leadership: ['ceo', 'cto', 'cfo', 'coo', 'appointed', 'hired', 'promoted', 'executive', 'vp', 'chief'],
  technology: ['migrating', 'adopted', 'implemented', 'platform', 'stack', 'infrastructure', 'cloud'],
  financial: ['revenue', 'earnings', 'profit', 'loss', 'quarterly', 'annual report', 'fiscal', 'margin'],
  competitive: ['competitor', 'market share', 'displaced', 'switched from', 'alternative', 'vs'],
  tender: ['rfp', 'tender', 'procurement', 'bid', 'contract award', 'solicitation'],
  product_launch: ['launched', 'released', 'new product', 'beta', 'general availability', 'ga', 'announcement'],
  partnership: ['partnership', 'partner', 'alliance', 'collaboration', 'integration', 'joint venture'],
  earnings: ['q1', 'q2', 'q3', 'q4', 'earnings call', 'beat estimates', 'missed estimates', 'guidance'],
  social: ['linkedin', 'twitter', 'post', 'shared', 'commented', 'mentioned'],
};

const SEVERITY_BY_TIER: Record<number, SignalSeverity> = {
  1: 'critical',
  2: 'high',
  3: 'medium',
  4: 'low',
};

const ACTION_BY_SEVERITY: Record<SignalSeverity, RecommendedAction> = {
  critical: 'urgent_outreach',
  high: 'engage',
  medium: 'research',
  low: 'monitor',
  info: 'ignore',
};

function classifySignalType(headline: string, content: string): { type: SignalType; confidence: number } {
  const combined = `${headline} ${content}`.toLowerCase();
  let bestType: SignalType = 'technology';
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(SIGNAL_TYPE_KEYWORDS) as [SignalType, string[]][]) {
    const matchCount = keywords.filter((kw) => combined.includes(kw)).length;
    const score = matchCount / keywords.length;
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return { type: bestType, confidence: Math.min(bestScore * 3, 1) };
}

function computeIntentScore(type: SignalType, severity: SignalSeverity): number {
  const typeWeights: Record<SignalType, number> = {
    funding: 0.85, hiring: 0.7, expansion: 0.8, leadership: 0.65,
    technology: 0.75, financial: 0.6, competitive: 0.8, tender: 0.95,
    product_launch: 0.5, partnership: 0.55, earnings: 0.5, social: 0.3,
  };
  const severityMultiplier: Record<SignalSeverity, number> = {
    critical: 1.0, high: 0.85, medium: 0.65, low: 0.4, info: 0.2,
  };
  return Math.round(typeWeights[type] * severityMultiplier[severity] * 100) / 100;
}

function extractEntities(headline: string, content: string): SignalEntities {
  const combined = `${headline} ${content}`;
  const entities: SignalEntities = {};

  // Extract dollar amounts
  const amountRegex = /\$[\d,.]+\s*(?:million|billion|M|B|K)?/gi;
  const amounts = combined.match(amountRegex);
  if (amounts) {
    entities.amounts = amounts.map((a) => ({ value: a, currency: 'USD' }));
  }

  // Extract quoted names or capitalized multi-word sequences as potential entities
  const nameRegex = /(?:^|\s)([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/g;
  const names: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = nameRegex.exec(combined)) !== null) {
    if (match[1]) names.push(match[1].trim());
  }
  if (names.length > 0) {
    entities.people = names.slice(0, 5).map((n) => ({ name: n }));
  }

  return entities;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { headline, content, sourceTier } = body as {
      headline?: string;
      content?: string;
      sourceTier?: number;
    };

    if (!headline || typeof headline !== 'string' || headline.trim().length === 0) {
      return NextResponse.json(
        { error: 'headline is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required and must be a string' },
        { status: 400 }
      );
    }

    const tier = typeof sourceTier === 'number' && sourceTier >= 1 && sourceTier <= 4
      ? sourceTier
      : 3;

    const { type: signalType, confidence: typeConfidence } = classifySignalType(headline, content);
    const severity = SEVERITY_BY_TIER[tier] ?? 'medium';
    const intentScore = computeIntentScore(signalType, severity);
    const recommendedAction = ACTION_BY_SEVERITY[severity];
    const entities = extractEntities(headline, content);

    const classification: SignalClassification = {
      signalType,
      signalSubtype: `${signalType}_general`,
      severity,
      intentScore,
      confidence: Math.round(typeConfidence * 100) / 100,
      recommendedAction,
      whyItMatters: `This ${signalType} signal from a tier-${tier} source indicates potential changes. ${
        intentScore > 0.7
          ? 'High intent detected - consider immediate outreach.'
          : intentScore > 0.4
            ? 'Moderate intent - worth monitoring closely.'
            : 'Low intent - add to monitoring queue.'
      }`,
      entities,
    };

    return NextResponse.json({ classification }, { status: 200 });
  } catch (err) {
    console.error('[Signals/Classify] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
