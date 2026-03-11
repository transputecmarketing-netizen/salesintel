import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { detectTechStack, categorizeTechStack } from '@/lib/enrichment/builtwith';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { domain } = body as { domain?: string };

    if (!domain || typeof domain !== 'string' || domain.trim().length === 0) {
      return NextResponse.json(
        { error: 'domain is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate domain format (basic check)
    const domainTrimmed = domain.trim().toLowerCase();
    if (!/^[a-z0-9]+([\-.][a-z0-9]+)*\.[a-z]{2,}$/.test(domainTrimmed)) {
      return NextResponse.json(
        { error: 'domain must be a valid domain name (e.g., example.com)' },
        { status: 400 }
      );
    }

    const result = await detectTechStack(domainTrimmed);

    if (!result) {
      return NextResponse.json(
        { error: 'No tech stack data found for the provided domain' },
        { status: 404 }
      );
    }

    const categorized = categorizeTechStack(result.technologies);

    // Identify premium/enterprise technologies
    const premiumTech = result.technologies.filter((t) => t.isPremium);

    // Identify recently added technologies (detected within last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const recentAdditions = result.technologies.filter(
      (t) => t.firstDetected && t.firstDetected > ninetyDaysAgo
    );

    return NextResponse.json({
      domain: result.domain,
      totalTechnologies: result.totalTechnologies,
      spendEstimate: result.spendEstimate,
      technologies: result.technologies,
      categorized,
      premiumTech,
      recentAdditions,
      creditsConsumed: 1,
      enrichedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Enrichment/TechStack] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
