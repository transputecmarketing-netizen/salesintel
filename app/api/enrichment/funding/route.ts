import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getCompany, getFundingHistory, getAcquisitions } from '@/lib/enrichment/crunchbase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyName } = body as { companyName?: string };

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return NextResponse.json(
        { error: 'companyName is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const trimmedName = companyName.trim();

    // Fetch company data, funding history, and acquisitions in parallel
    const [companyResult, fundingResult, acquisitionsResult] = await Promise.allSettled([
      getCompany(trimmedName),
      getFundingHistory(trimmedName),
      getAcquisitions(trimmedName),
    ]);

    const company = companyResult.status === 'fulfilled' ? companyResult.value : null;
    const funding = fundingResult.status === 'fulfilled' ? fundingResult.value : [];
    const acquisitions = acquisitionsResult.status === 'fulfilled' ? acquisitionsResult.value : [];

    if (!company) {
      return NextResponse.json(
        { error: `No Crunchbase data found for "${trimmedName}"` },
        { status: 404 }
      );
    }

    // Compute funding velocity (rounds per year)
    let fundingVelocity: number | null = null;
    if (company.foundedDate && funding.length > 0) {
      const yearsActive = (Date.now() - new Date(company.foundedDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      fundingVelocity = yearsActive > 0 ? Math.round((funding.length / yearsActive) * 100) / 100 : null;
    }

    // Recent funding (last 6 months)
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
    const recentFunding = funding.filter((r) => r.announcedDate > sixMonthsAgo);

    return NextResponse.json({
      company: {
        name: company.name,
        description: company.shortDescription,
        ipoStatus: company.ipoStatus,
        totalFundingUsd: company.totalFundingUsd,
        lastFundingType: company.lastFundingType,
        lastFundingDate: company.lastFundingDate,
        numFundingRounds: company.numFundingRounds,
        numEmployeesEnum: company.numEmployeesEnum,
        categories: company.categories,
        headquartersLocation: company.headquartersLocation,
        websiteUrl: company.websiteUrl,
      },
      fundingRounds: funding,
      recentFunding,
      acquisitions,
      metrics: {
        fundingVelocity,
        totalRounds: funding.length,
        totalAcquisitions: acquisitions.length,
        hasRecentFunding: recentFunding.length > 0,
      },
      creditsConsumed: 1,
      enrichedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Enrichment/Funding] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
