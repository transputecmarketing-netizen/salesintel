import { NextRequest, NextResponse } from 'next/server';

import type { SignalType } from '@/types/signal';

// Cron endpoint for temporal baseline recalculation
// Computes rolling signal baselines per company for anomaly detection

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

interface BaselineResult {
  companyId: string;
  signalType: SignalType;
  baselineValue: number;
  stdDev: number;
  sampleSize: number;
  periodStart: string;
  periodEnd: string;
}

const SIGNAL_TYPES: SignalType[] = [
  'funding', 'hiring', 'expansion', 'leadership',
  'technology', 'financial', 'competitive', 'tender',
  'product_launch', 'partnership', 'earnings', 'social',
];

const BASELINE_WINDOW_DAYS = 90;

async function computeBaseline(
  _companyId: string,
  _signalType: SignalType,
  periodStart: string,
  periodEnd: string
): Promise<BaselineResult | null> {
  // In production:
  // 1. Query signals for this company + type within the period
  // 2. Compute frequency (count per week)
  // 3. Calculate mean and standard deviation
  // 4. Upsert into signal_baselines table

  // SELECT
  //   COUNT(*) as total,
  //   AVG(intent_score) as avg_intent,
  //   STDDEV(intent_score) as stddev_intent
  // FROM signals
  // WHERE company_id = $companyId
  //   AND signal_type = $signalType
  //   AND detected_at BETWEEN $periodStart AND $periodEnd

  return {
    companyId: _companyId,
    signalType: _signalType,
    baselineValue: 0,
    stdDev: 0,
    sampleSize: 0,
    periodStart,
    periodEnd,
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const periodEnd = now.toISOString();
    const periodStart = new Date(
      now.getTime() - BASELINE_WINDOW_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    // In production: get all companies that have signals
    // const companiesWithSignals = await db.selectDistinct({ companyId: signals.companyId })
    //   .from(signals)
    //   .where(gte(signals.detectedAt, periodStart));

    const companiesWithSignals: Array<{ companyId: string }> = [];

    let totalBaselines = 0;
    let totalErrors = 0;

    for (const { companyId } of companiesWithSignals) {
      for (const signalType of SIGNAL_TYPES) {
        try {
          const baseline = await computeBaseline(
            companyId,
            signalType,
            periodStart,
            periodEnd
          );

          if (baseline && baseline.sampleSize > 0) {
            // In production: upsert into signal_baselines table
            totalBaselines++;
          }
        } catch (err) {
          console.error(
            `[Cron/Baseline] Error computing baseline for ${companyId}/${signalType}:`,
            err
          );
          totalErrors++;
        }
      }
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      companiesProcessed: companiesWithSignals.length,
      baselinesComputed: totalBaselines,
      errors: totalErrors,
      period: {
        start: periodStart,
        end: periodEnd,
        windowDays: BASELINE_WINDOW_DAYS,
      },
      durationMs,
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron/Baseline] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Baseline recalculation failed',
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
