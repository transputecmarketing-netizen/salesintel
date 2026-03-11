import { NextRequest, NextResponse } from 'next/server';

// Cron endpoint for watchlist monitoring sweep
// Designed to be called by Vercel Cron or external scheduler
// Iterates all active target companies and checks for new signals

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // Allow in development
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

interface MonitorResult {
  companyId: string;
  companyName: string;
  newSignals: number;
  alertsSent: number;
  errors: string[];
}

async function monitorCompany(_companyId: string, _companyName: string): Promise<MonitorResult> {
  // In production:
  // 1. Fetch latest RSS/news for the company
  // 2. Run signal classification on new articles
  // 3. Compare against baselines for anomaly detection
  // 4. Create signal records for significant findings
  // 5. Send notifications if above threshold

  return {
    companyId: _companyId,
    companyName: _companyName,
    newSignals: 0,
    alertsSent: 0,
    errors: [],
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production: query all active targets across all users
    // const activeTargets = await db.select({
    //   companyId: targets.companyId,
    //   companyName: companies.name,
    // })
    // .from(targets)
    // .innerJoin(companies, eq(targets.companyId, companies.id))
    // .groupBy(targets.companyId, companies.name);

    const activeTargets: Array<{ companyId: string; companyName: string }> = [];

    const results: MonitorResult[] = [];
    const BATCH_SIZE = 5;

    // Process in batches to avoid overwhelming external APIs
    for (let i = 0; i < activeTargets.length; i += BATCH_SIZE) {
      const batch = activeTargets.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map((t) => monitorCompany(t.companyId, t.companyName))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
    }

    const totalNewSignals = results.reduce((sum, r) => sum + r.newSignals, 0);
    const totalAlerts = results.reduce((sum, r) => sum + r.alertsSent, 0);
    const failedCompanies = results.filter((r) => r.errors.length > 0);
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      companiesMonitored: results.length,
      totalNewSignals,
      totalAlerts,
      failedCompanies: failedCompanies.length,
      durationMs,
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron/Monitor] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Monitor sweep failed',
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
