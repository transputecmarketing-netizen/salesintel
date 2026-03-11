import type { Signal, SignalType } from '@/types/signal';

export interface WatchlistEntry {
  id: string;
  userId: string;
  companyId: string;
  companyName: string;
  companyDomain: string | null;
  signalTypes: SignalType[];
  minSeverity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  isActive: boolean;
  lastCheckedAt: string | null;
  createdAt: string;
}

export interface WatchCheckResult {
  watchlistEntryId: string;
  companyName: string;
  newSignals: Signal[];
  checkedAt: string;
  errors: string[];
}

export interface WatcherConfig {
  maxConcurrentChecks: number;
  checkTimeoutMs: number;
  signalLookbackHours: number;
}

const DEFAULT_CONFIG: WatcherConfig = {
  maxConcurrentChecks: 5,
  checkTimeoutMs: 30_000,
  signalLookbackHours: 24,
};

/**
 * Check a single watchlist entry for new signals.
 */
async function checkWatchlistEntry(
  entry: WatchlistEntry,
  config: WatcherConfig
): Promise<WatchCheckResult> {
  const result: WatchCheckResult = {
    watchlistEntryId: entry.id,
    companyName: entry.companyName,
    newSignals: [],
    checkedAt: new Date().toISOString(),
    errors: [],
  };

  const checks: Array<Promise<Signal[]>> = [];

  // Check news for the company
  if (shouldCheckSignalType(entry.signalTypes, ['funding', 'expansion', 'leadership', 'partnership', 'competitive'])) {
    checks.push(checkNewsSignals(entry, config).catch((err) => {
      result.errors.push(`News check failed: ${err}`);
      return [] as Signal[];
    }));
  }

  // Check job postings for hiring signals
  if (shouldCheckSignalType(entry.signalTypes, ['hiring'])) {
    checks.push(checkJobSignals(entry, config).catch((err) => {
      result.errors.push(`Job check failed: ${err}`);
      return [] as Signal[];
    }));
  }

  // Check SEC filings for financial signals
  if (shouldCheckSignalType(entry.signalTypes, ['financial', 'earnings'])) {
    checks.push(checkFilingSignals(entry, config).catch((err) => {
      result.errors.push(`Filing check failed: ${err}`);
      return [] as Signal[];
    }));
  }

  // Check tech stack changes
  if (shouldCheckSignalType(entry.signalTypes, ['technology'])) {
    checks.push(checkTechSignals(entry, config).catch((err) => {
      result.errors.push(`Tech check failed: ${err}`);
      return [] as Signal[];
    }));
  }

  const allResults = await Promise.allSettled(checks);

  for (const settled of allResults) {
    if (settled.status === 'fulfilled') {
      result.newSignals.push(...settled.value);
    }
  }

  // Filter by minimum severity
  result.newSignals = filterBySeverity(result.newSignals, entry.minSeverity);

  return result;
}

function shouldCheckSignalType(watchedTypes: SignalType[], checkTypes: SignalType[]): boolean {
  if (watchedTypes.length === 0) return true; // Watch all types
  return watchedTypes.some((t) => checkTypes.includes(t));
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

function filterBySeverity(signals: Signal[], minSeverity: string): Signal[] {
  const minOrder = SEVERITY_ORDER[minSeverity] ?? 0;
  return signals.filter((s) => (SEVERITY_ORDER[s.severity] ?? 0) >= minOrder);
}

async function checkNewsSignals(entry: WatchlistEntry, _config: WatcherConfig): Promise<Signal[]> {
  // Integration point: Use RSS/GDELT infrastructure to check for new articles
  // about this company since last check
  try {
    // This would call into lib/rss or lib/signals when those are implemented
    return [];
  } catch (err) {
    console.error(`[Watcher] News check failed for ${entry.companyName}:`, err);
    return [];
  }
}

async function checkJobSignals(entry: WatchlistEntry, _config: WatcherConfig): Promise<Signal[]> {
  try {
    const { getJobPostings, analyzeJobPostings } = await import('@/lib/enrichment/jobs');
    const slug = entry.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const postings = await getJobPostings(slug);
    const analysis = analyzeJobPostings(postings);

    const signals: Signal[] = [];

    for (const buyingSignal of analysis.buyingSignals) {
      if (buyingSignal.strength === 'strong' || buyingSignal.strength === 'moderate') {
        signals.push({
          id: `job-${entry.companyId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          companyId: entry.companyId,
          contactId: null,
          signalType: 'hiring',
          signalSubtype: buyingSignal.category,
          severity: buyingSignal.strength === 'strong' ? 'high' : 'medium',
          intentScore: buyingSignal.strength === 'strong' ? 75 : 50,
          confidence: 0.7,
          title: `${entry.companyName}: ${buyingSignal.signal}`,
          summary: `Detected ${buyingSignal.evidence.length} related job postings indicating ${buyingSignal.signal.toLowerCase()}`,
          rawContent: buyingSignal.evidence.join(', '),
          sourceUrl: null,
          sourceName: 'Job Board Analysis',
          sourceTier: 2,
          whyItMatters: `${buyingSignal.signal} suggests active investment that may create buying opportunity`,
          recommendedAction: buyingSignal.strength === 'strong' ? 'engage' : 'research',
          actionTemplate: null,
          classifiedBy: 'keyword',
          entities: {
            companies: [{ name: entry.companyName }],
          },
          evidence: buyingSignal.evidence.map((e) => ({
            type: 'job_posting' as const,
            content: e,
            sourceUrl: null,
            date: new Date().toISOString(),
          })),
          detectedAt: new Date().toISOString(),
          publishedAt: null,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return signals;
  } catch (err) {
    console.error(`[Watcher] Job check failed for ${entry.companyName}:`, err);
    return [];
  }
}

async function checkFilingSignals(entry: WatchlistEntry, config: WatcherConfig): Promise<Signal[]> {
  try {
    const { getRecentMaterialEvents } = await import('@/lib/enrichment/sec-edgar');
    const lookbackDays = Math.ceil(config.signalLookbackHours / 24);
    const events = await getRecentMaterialEvents(entry.companyName, lookbackDays);

    return events.map((event) => ({
      id: `sec-${entry.companyId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      companyId: entry.companyId,
      contactId: null,
      signalType: 'financial' as const,
      signalSubtype: event.type,
      severity: event.type === 'acquisition' || event.type === 'executive_change' ? 'high' as const : 'medium' as const,
      intentScore: 60,
      confidence: 0.85,
      title: `${entry.companyName}: ${event.description}`,
      summary: event.description,
      rawContent: null,
      sourceUrl: event.sourceUrl,
      sourceName: 'SEC EDGAR',
      sourceTier: 1,
      whyItMatters: `SEC filing (${event.filingType}) indicates ${event.type.replace(/_/g, ' ')}`,
      recommendedAction: 'research' as const,
      actionTemplate: null,
      classifiedBy: 'keyword' as const,
      entities: { companies: [{ name: entry.companyName }] },
      evidence: [{
        type: 'filing' as const,
        content: event.description,
        sourceUrl: event.sourceUrl,
        date: event.filingDate,
      }],
      detectedAt: new Date().toISOString(),
      publishedAt: event.filingDate,
      createdAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.error(`[Watcher] Filing check failed for ${entry.companyName}:`, err);
    return [];
  }
}

async function checkTechSignals(entry: WatchlistEntry, _config: WatcherConfig): Promise<Signal[]> {
  // Tech stack changes are typically detected via periodic BuiltWith scans
  // and compared against the stored tech stack
  return [];
}

/**
 * Run monitoring sweep for a batch of watchlist entries.
 */
export async function runMonitoringSweep(
  entries: WatchlistEntry[],
  config: WatcherConfig = DEFAULT_CONFIG
): Promise<WatchCheckResult[]> {
  const results: WatchCheckResult[] = [];
  const activeEntries = entries.filter((e) => e.isActive);

  // Process in batches to respect concurrency limits
  for (let i = 0; i < activeEntries.length; i += config.maxConcurrentChecks) {
    const batch = activeEntries.slice(i, i + config.maxConcurrentChecks);

    const batchResults = await Promise.allSettled(
      batch.map((entry) =>
        Promise.race([
          checkWatchlistEntry(entry, config),
          new Promise<WatchCheckResult>((_, reject) =>
            setTimeout(() => reject(new Error('Check timeout')), config.checkTimeoutMs)
          ),
        ])
      )
    );

    for (let j = 0; j < batchResults.length; j++) {
      const settled = batchResults[j]!;
      if (settled.status === 'fulfilled') {
        results.push(settled.value);
      } else {
        results.push({
          watchlistEntryId: batch[j]!.id,
          companyName: batch[j]!.companyName,
          newSignals: [],
          checkedAt: new Date().toISOString(),
          errors: [settled.reason?.message ?? 'Unknown error'],
        });
      }
    }
  }

  const totalSignals = results.reduce((sum, r) => sum + r.newSignals.length, 0);
  console.log(`[Watcher] Sweep complete: ${results.length} companies checked, ${totalSignals} new signals found`);

  return results;
}
