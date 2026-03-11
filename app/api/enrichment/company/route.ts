import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { enrichCompany as apolloEnrich } from '@/lib/enrichment/apollo';
import { enrichCompany as clearbitEnrich } from '@/lib/enrichment/clearbit';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { domain, name } = body as { domain?: string; name?: string };

    if (!domain && !name) {
      return NextResponse.json(
        { error: 'Either domain or name is required' },
        { status: 400 }
      );
    }

    if (domain && typeof domain !== 'string') {
      return NextResponse.json({ error: 'domain must be a string' }, { status: 400 });
    }

    if (name && typeof name !== 'string') {
      return NextResponse.json({ error: 'name must be a string' }, { status: 400 });
    }

    const lookupDomain = domain?.trim() ?? `${name!.trim().toLowerCase().replace(/\s+/g, '')}.com`;

    // Run enrichment providers in parallel
    const [apolloResult, clearbitResult] = await Promise.allSettled([
      apolloEnrich(lookupDomain),
      clearbitEnrich(lookupDomain),
    ]);

    const apollo = apolloResult.status === 'fulfilled' ? apolloResult.value : null;
    const clearbit = clearbitResult.status === 'fulfilled' ? clearbitResult.value : null;

    if (!apollo && !clearbit) {
      return NextResponse.json(
        { error: 'No enrichment data found for the provided domain/name' },
        { status: 404 }
      );
    }

    // Merge results, preferring Apollo for contact-related data and Clearbit for company metrics
    const enriched = {
      name: apollo?.name || clearbit?.name || name || '',
      domain: apollo?.domain || clearbit?.domain || lookupDomain,
      description: apollo?.description || clearbit?.description || null,
      logoUrl: apollo?.logoUrl || clearbit?.logo || null,
      industry: apollo?.industry || clearbit?.category?.industry || null,
      subIndustry: clearbit?.category?.subIndustry || null,
      employeeCount: apollo?.employeeCount || clearbit?.metrics?.employeesRange || null,
      employeeExact: apollo?.employeeExact || clearbit?.metrics?.employees || null,
      foundedYear: apollo?.foundedYear || clearbit?.foundedYear || null,
      hqCity: apollo?.hqCity || clearbit?.geo?.city || null,
      hqState: apollo?.hqState || clearbit?.geo?.state || null,
      hqCountry: apollo?.hqCountry || clearbit?.geo?.country || null,
      revenueRange: apollo?.annualRevenue || clearbit?.metrics?.estimatedAnnualRevenue || null,
      totalFunding: clearbit?.metrics?.raised || null,
      techStack: apollo?.techStack || clearbit?.tech || [],
      socialLinks: {
        linkedin: apollo?.socialLinks?.linkedin || clearbit?.socialLinks?.linkedin || null,
        twitter: apollo?.socialLinks?.twitter || clearbit?.socialLinks?.twitter || null,
        crunchbase: clearbit?.socialLinks?.crunchbase || null,
      },
      sources: {
        apollo: !!apollo,
        clearbit: !!clearbit,
      },
    };

    return NextResponse.json({
      enriched,
      creditsConsumed: 1,
      enrichedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Enrichment/Company] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
