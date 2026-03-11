import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface FinancialData {
  ticker: string | null;
  companyName: string;
  marketCap: number | null;
  revenue: number | null;
  revenueGrowth: number | null;
  netIncome: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  pe_ratio: number | null;
  employees: number | null;
  sector: string | null;
  latestFilingDate: string | null;
  recentEarnings: EarningsReport | null;
}

interface EarningsReport {
  quarter: string;
  reportDate: string;
  revenue: number | null;
  eps: number | null;
  epsSurprise: number | null;
  revenueEstimate: number | null;
  epsEstimate: number | null;
  beatRevenue: boolean;
  beatEps: boolean;
}

async function fetchFinancialData(ticker?: string, companyName?: string): Promise<FinancialData | null> {
  // Try Alpha Vantage or Financial Modeling Prep API
  const apiKey = process.env.FINANCIAL_API_KEY;
  const lookupTicker = ticker?.trim().toUpperCase();

  if (apiKey && lookupTicker) {
    try {
      // Financial Modeling Prep API
      const profileRes = await fetch(
        `https://financialmodelingprep.com/api/v3/profile/${encodeURIComponent(lookupTicker)}?apikey=${apiKey}`
      );

      if (profileRes.ok) {
        const profiles = await profileRes.json();
        const profile = Array.isArray(profiles) ? profiles[0] : null;

        if (profile) {
          // Fetch recent earnings
          const earningsRes = await fetch(
            `https://financialmodelingprep.com/api/v3/earnings-surprises/${encodeURIComponent(lookupTicker)}?apikey=${apiKey}`
          );
          const earnings = earningsRes.ok ? await earningsRes.json() : [];
          const latestEarnings = Array.isArray(earnings) && earnings.length > 0 ? earnings[0] : null;

          return {
            ticker: lookupTicker,
            companyName: profile.companyName ?? companyName ?? '',
            marketCap: profile.mktCap ?? null,
            revenue: profile.revenue ?? null,
            revenueGrowth: profile.revenueGrowth ?? null,
            netIncome: profile.netIncome ?? null,
            grossMargin: profile.grossMargin ?? null,
            operatingMargin: profile.operatingMargin ?? null,
            pe_ratio: profile.peRatio ?? null,
            employees: profile.fullTimeEmployees ?? null,
            sector: profile.sector ?? null,
            latestFilingDate: profile.ipoDate ?? null,
            recentEarnings: latestEarnings
              ? {
                  quarter: latestEarnings.date ?? '',
                  reportDate: latestEarnings.date ?? '',
                  revenue: latestEarnings.actualRevenue ?? null,
                  eps: latestEarnings.actualEarnings ?? null,
                  epsSurprise: latestEarnings.epsSurprise ?? null,
                  revenueEstimate: latestEarnings.estimatedRevenue ?? null,
                  epsEstimate: latestEarnings.estimatedEarnings ?? null,
                  beatRevenue:
                    latestEarnings.actualRevenue != null &&
                    latestEarnings.estimatedRevenue != null &&
                    latestEarnings.actualRevenue > latestEarnings.estimatedRevenue,
                  beatEps:
                    latestEarnings.actualEarnings != null &&
                    latestEarnings.estimatedEarnings != null &&
                    latestEarnings.actualEarnings > latestEarnings.estimatedEarnings,
                }
              : null,
          };
        }
      }
    } catch (err) {
      console.error('[Financial] API fetch failed:', err);
    }
  }

  // No data available
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ticker, companyName } = body as {
      ticker?: string;
      companyName?: string;
    };

    if (!ticker && !companyName) {
      return NextResponse.json(
        { error: 'Either ticker or companyName is required' },
        { status: 400 }
      );
    }

    if (ticker && typeof ticker !== 'string') {
      return NextResponse.json({ error: 'ticker must be a string' }, { status: 400 });
    }

    if (companyName && typeof companyName !== 'string') {
      return NextResponse.json({ error: 'companyName must be a string' }, { status: 400 });
    }

    const financialData = await fetchFinancialData(ticker, companyName);

    if (!financialData) {
      return NextResponse.json(
        {
          error: 'No financial data found. Ensure you provide a valid public company ticker symbol.',
          ticker: ticker ?? null,
          companyName: companyName ?? null,
        },
        { status: 404 }
      );
    }

    // Derive sales intelligence signals from financial data
    const signals: string[] = [];
    if (financialData.revenueGrowth && financialData.revenueGrowth > 0.2) {
      signals.push('Strong revenue growth (>20%) indicates expansion budget potential');
    }
    if (financialData.recentEarnings?.beatRevenue && financialData.recentEarnings?.beatEps) {
      signals.push('Beat both revenue and EPS estimates - positive market sentiment');
    }
    if (financialData.employees && financialData.employees > 1000) {
      signals.push('Enterprise-scale organization with complex buying processes');
    }
    if (financialData.grossMargin && financialData.grossMargin > 0.6) {
      signals.push('High gross margins suggest healthy software business model');
    }

    return NextResponse.json({
      financial: financialData,
      salesSignals: signals,
      creditsConsumed: 1,
      enrichedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Enrichment/Financial] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
