// lib/rss/proxy.ts - RSS proxy with circuit breaker integration, conditional GET,
// concurrency control, and overall deadline enforcement.

import { CircuitBreaker, feedCircuitBreaker } from './circuit-breaker';
import { parseFeed, filterItems, deduplicateItems, sortByDate } from './parser';
import type { FeedItem, ParsedFeed } from './parser';
import type { FeedSource } from './feeds';

const PER_FEED_TIMEOUT_MS = 8_000;
const MAX_CONCURRENT = 20;
const OVERALL_DEADLINE_MS = 25_000;

/**
 * Conditional GET metadata for a feed, enabling ETag / If-Modified-Since.
 */
interface ConditionalGetMeta {
  etag?: string;
  lastModified?: string;
}

// In-memory conditional GET cache
const conditionalGetCache = new Map<string, ConditionalGetMeta>();

/**
 * Result of fetching a single feed.
 */
export interface FeedFetchResult {
  feedUrl: string;
  feedName: string;
  success: boolean;
  items: FeedItem[];
  notModified: boolean;
  error?: string;
  durationMs: number;
}

/**
 * Result of a batch fetch operation.
 */
export interface BatchFetchResult {
  results: FeedFetchResult[];
  totalItems: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  durationMs: number;
  deadlineExceeded: boolean;
}

/**
 * Fetch a single RSS feed with timeout, circuit breaker, and conditional GET.
 */
export async function fetchFeed(
  source: FeedSource,
  circuitBreaker: CircuitBreaker = feedCircuitBreaker,
  signal?: AbortSignal
): Promise<FeedFetchResult> {
  const startTime = Date.now();
  const result: FeedFetchResult = {
    feedUrl: source.url,
    feedName: source.name,
    success: false,
    items: [],
    notModified: false,
    durationMs: 0,
  };

  // Check circuit breaker
  if (!circuitBreaker.canRequest(source.url)) {
    result.error = 'Circuit breaker open';
    result.durationMs = Date.now() - startTime;
    return result;
  }

  try {
    // Build headers with conditional GET support
    const headers: Record<string, string> = {
      'User-Agent': 'SalesIntel/1.0 (RSS Aggregator; +https://salesintel.io)',
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    };

    const cachedMeta = conditionalGetCache.get(source.url);
    if (cachedMeta?.etag) {
      headers['If-None-Match'] = cachedMeta.etag;
    }
    if (cachedMeta?.lastModified) {
      headers['If-Modified-Since'] = cachedMeta.lastModified;
    }

    // Create per-feed abort controller for timeout
    const feedAbort = new AbortController();
    const timeoutId = setTimeout(() => feedAbort.abort(), PER_FEED_TIMEOUT_MS);

    // Combine with external signal if provided
    const combinedSignal = signal
      ? combineAbortSignals(signal, feedAbort.signal)
      : feedAbort.signal;

    const response = await fetch(source.url, {
      headers,
      signal: combinedSignal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    // Handle 304 Not Modified
    if (response.status === 304) {
      circuitBreaker.recordSuccess(source.url);
      result.success = true;
      result.notModified = true;
      result.durationMs = Date.now() - startTime;
      return result;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    // Store conditional GET metadata for next request
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');
    if (etag || lastModified) {
      conditionalGetCache.set(source.url, {
        etag: etag || undefined,
        lastModified: lastModified || undefined,
      });
    }

    const xml = await response.text();

    if (!xml || xml.trim().length === 0) {
      throw new Error('Empty response body');
    }

    // Parse the feed
    const parsed = parseFeed(xml, source.name, source.url);

    // Apply filter if defined
    let items = parsed.items;
    if (source.filter) {
      items = filterItems(items, source.filter);
    }

    circuitBreaker.recordSuccess(source.url);
    result.success = true;
    result.items = items;
    result.durationMs = Date.now() - startTime;

    return result;
  } catch (err) {
    circuitBreaker.recordFailure(source.url);
    result.error = err instanceof Error ? err.message : String(err);
    result.durationMs = Date.now() - startTime;
    return result;
  }
}

/**
 * Batch-fetch multiple feeds with concurrency control and overall deadline.
 */
export async function batchFetchFeeds(
  sources: FeedSource[],
  opts?: {
    maxConcurrent?: number;
    deadlineMs?: number;
    circuitBreaker?: CircuitBreaker;
  }
): Promise<BatchFetchResult> {
  const startTime = Date.now();
  const maxConcurrent = opts?.maxConcurrent ?? MAX_CONCURRENT;
  const deadlineMs = opts?.deadlineMs ?? OVERALL_DEADLINE_MS;
  const circuitBreaker = opts?.circuitBreaker ?? feedCircuitBreaker;

  // Create an abort controller for the overall deadline
  const deadlineAbort = new AbortController();
  const deadlineTimeout = setTimeout(() => deadlineAbort.abort(), deadlineMs);

  const results: FeedFetchResult[] = [];
  let deadlineExceeded = false;
  let skippedCount = 0;

  // Partition sources: those allowed by circuit breaker vs. those skipped
  const allowedSources: FeedSource[] = [];
  for (const source of sources) {
    if (!source.active) {
      skippedCount++;
      continue;
    }
    if (!circuitBreaker.canRequest(source.url)) {
      skippedCount++;
      results.push({
        feedUrl: source.url,
        feedName: source.name,
        success: false,
        items: [],
        notModified: false,
        error: 'Circuit breaker open',
        durationMs: 0,
      });
      continue;
    }
    allowedSources.push(source);
  }

  // Process feeds with concurrency pool
  const pending: Promise<void>[] = [];
  let sourceIndex = 0;

  async function processNext(): Promise<void> {
    while (sourceIndex < allowedSources.length) {
      // Check deadline
      if (deadlineAbort.signal.aborted) {
        deadlineExceeded = true;
        break;
      }

      const currentIndex = sourceIndex++;
      const source = allowedSources[currentIndex]!;

      try {
        const result = await fetchFeed(source, circuitBreaker, deadlineAbort.signal);
        results.push(result);
      } catch (err) {
        // If aborted due to deadline, mark remaining as skipped
        if (deadlineAbort.signal.aborted) {
          deadlineExceeded = true;
          break;
        }
        results.push({
          feedUrl: source.url,
          feedName: source.name,
          success: false,
          items: [],
          notModified: false,
          error: err instanceof Error ? err.message : String(err),
          durationMs: 0,
        });
      }
    }
  }

  // Launch concurrent workers
  const workerCount = Math.min(maxConcurrent, allowedSources.length);
  for (let i = 0; i < workerCount; i++) {
    pending.push(processNext());
  }

  await Promise.allSettled(pending);
  clearTimeout(deadlineTimeout);

  // Count skipped sources that were never processed due to deadline
  const processedUrls = new Set(results.map((r) => r.feedUrl));
  for (const source of allowedSources) {
    if (!processedUrls.has(source.url)) {
      skippedCount++;
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;
  const totalItems = results.reduce((sum, r) => sum + r.items.length, 0);

  return {
    results,
    totalItems,
    successCount,
    failureCount,
    skippedCount,
    durationMs: Date.now() - startTime,
    deadlineExceeded,
  };
}

/**
 * Fetch feeds and return a deduplicated, sorted array of items.
 */
export async function fetchAndMergeFeeds(
  sources: FeedSource[],
  opts?: {
    maxConcurrent?: number;
    deadlineMs?: number;
    circuitBreaker?: CircuitBreaker;
    maxItems?: number;
  }
): Promise<{ items: FeedItem[]; meta: BatchFetchResult }> {
  const batchResult = await batchFetchFeeds(sources, opts);

  // Collect all items across feeds
  let allItems: FeedItem[] = [];
  for (const result of batchResult.results) {
    allItems.push(...result.items);
  }

  // Deduplicate and sort
  allItems = sortByDate(deduplicateItems(allItems));

  // Limit if requested
  if (opts?.maxItems && allItems.length > opts.maxItems) {
    allItems = allItems.slice(0, opts.maxItems);
  }

  return {
    items: allItems,
    meta: batchResult,
  };
}

/**
 * Clear the conditional GET cache for all feeds or a specific feed.
 */
export function clearConditionalGetCache(feedUrl?: string): void {
  if (feedUrl) {
    conditionalGetCache.delete(feedUrl);
  } else {
    conditionalGetCache.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Internal Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Combine multiple AbortSignals into one. Aborts when any input signal aborts.
 */
function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), {
      once: true,
    });
  }

  return controller.signal;
}
