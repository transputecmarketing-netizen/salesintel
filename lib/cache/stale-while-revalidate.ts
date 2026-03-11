// lib/cache/stale-while-revalidate.ts - SWR cache pattern
// Serve stale data immediately while revalidating in the background.

import { cache } from './redis';

/**
 * SWR cache entry metadata stored alongside the value.
 */
interface SwrMeta {
  /** Timestamp when the value was last fetched (ms) */
  fetchedAt: number;
  /** Whether a background revalidation is in progress */
  revalidating: boolean;
}

/**
 * Configuration options for SWR caching.
 */
export interface SwrOptions {
  /** Time in seconds before data is considered stale (default: 60) */
  staleAfterSeconds: number;
  /** Maximum time in seconds to serve stale data while revalidating (default: 300) */
  maxStaleSeconds: number;
  /** Time in seconds for the fresh cache TTL (default: staleAfterSeconds * 2 + maxStaleSeconds) */
  cacheTtlSeconds?: number;
  /** Called when a background revalidation fails */
  onRevalidateError?: (key: string, error: unknown) => void;
  /** Called when a background revalidation succeeds */
  onRevalidateSuccess?: (key: string) => void;
}

const DEFAULT_OPTIONS: SwrOptions = {
  staleAfterSeconds: 60,
  maxStaleSeconds: 300,
};

// Track in-progress background revalidations to avoid duplicates
const revalidating = new Set<string>();

/**
 * Stale-While-Revalidate cache pattern.
 *
 * Behavior:
 * 1. Cache MISS: Execute `fetchFn`, cache result, return it.
 * 2. Cache HIT (fresh): Return cached value immediately.
 * 3. Cache HIT (stale, within maxStale): Return cached value immediately,
 *    trigger background revalidation.
 * 4. Cache HIT (stale, beyond maxStale): Treat as cache miss, execute `fetchFn`.
 *
 * @param key - Cache key
 * @param fetchFn - Function to fetch fresh data
 * @param opts - SWR configuration
 * @returns The cached or freshly fetched value
 */
export async function swr<T>(
  key: string,
  fetchFn: () => Promise<T>,
  opts?: Partial<SwrOptions>
): Promise<T> {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const metaKey = `${key}:__swr_meta`;

  // Try to read from cache
  let cached: T | null = null;
  let meta: SwrMeta | null = null;

  try {
    const [cachedStr, metaStr] = await Promise.all([
      cache.get(key),
      cache.get(metaKey),
    ]);

    if (cachedStr !== null) {
      cached = JSON.parse(cachedStr) as T;
    }
    if (metaStr !== null) {
      meta = JSON.parse(metaStr) as SwrMeta;
    }
  } catch {
    // Cache read failure: treat as miss
  }

  // Cache miss: fetch fresh
  if (cached === null || meta === null) {
    return fetchAndCache(key, metaKey, fetchFn, options);
  }

  const ageSeconds = (Date.now() - meta.fetchedAt) / 1000;

  // Fresh: return immediately
  if (ageSeconds <= options.staleAfterSeconds) {
    return cached;
  }

  // Stale but within acceptable window: return stale, revalidate in background
  if (ageSeconds <= options.staleAfterSeconds + options.maxStaleSeconds) {
    triggerBackgroundRevalidation(key, metaKey, fetchFn, options);
    return cached;
  }

  // Beyond max stale: treat as miss
  return fetchAndCache(key, metaKey, fetchFn, options);
}

/**
 * Fetch fresh data and cache it with metadata.
 */
async function fetchAndCache<T>(
  key: string,
  metaKey: string,
  fetchFn: () => Promise<T>,
  options: SwrOptions
): Promise<T> {
  const result = await fetchFn();

  const ttl =
    options.cacheTtlSeconds ??
    options.staleAfterSeconds * 2 + options.maxStaleSeconds;

  const meta: SwrMeta = {
    fetchedAt: Date.now(),
    revalidating: false,
  };

  // Cache both the value and metadata (fire-and-forget)
  try {
    await Promise.all([
      cache.set(key, JSON.stringify(result), ttl),
      cache.set(metaKey, JSON.stringify(meta), ttl),
    ]);
  } catch (err) {
    console.warn(`[cache/swr] Failed to cache key "${key}":`, err);
  }

  return result;
}

/**
 * Trigger a background revalidation for a stale cache entry.
 * Only one revalidation per key at a time.
 */
function triggerBackgroundRevalidation<T>(
  key: string,
  metaKey: string,
  fetchFn: () => Promise<T>,
  options: SwrOptions
): void {
  // Skip if already revalidating this key
  if (revalidating.has(key)) return;

  revalidating.add(key);

  // Run in background (not awaited)
  fetchAndCache(key, metaKey, fetchFn, options)
    .then(() => {
      options.onRevalidateSuccess?.(key);
    })
    .catch((err) => {
      if (options.onRevalidateError) {
        options.onRevalidateError(key, err);
      } else {
        console.warn(`[cache/swr] Background revalidation failed for "${key}":`, err);
      }
    })
    .finally(() => {
      revalidating.delete(key);
    });
}

/**
 * Invalidate an SWR cache entry, forcing the next access to fetch fresh data.
 */
export async function invalidate(key: string): Promise<void> {
  const metaKey = `${key}:__swr_meta`;
  await Promise.all([cache.del(key), cache.del(metaKey)]).catch(() => {});
}

/**
 * Check if a key is currently being revalidated in the background.
 */
export function isRevalidating(key: string): boolean {
  return revalidating.has(key);
}

/**
 * Get the count of currently active background revalidations.
 */
export function getRevalidatingCount(): number {
  return revalidating.size;
}
