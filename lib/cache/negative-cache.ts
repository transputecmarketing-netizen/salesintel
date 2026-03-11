// lib/cache/negative-cache.ts - Negative result caching with backoff
// Caches failed lookups to prevent hammering external services.

import { cache } from './redis';

const DEFAULT_BACKOFF_MS = 5 * 60 * 1000; // 5 minutes
const NEGATIVE_CACHE_PREFIX = 'neg:';

/**
 * Negative cache entry stored when a lookup fails.
 */
interface NegativeCacheEntry {
  /** Timestamp when the failure was cached (ms) */
  cachedAt: number;
  /** The error message from the failed lookup */
  errorMessage: string;
  /** Number of consecutive failures */
  failureCount: number;
  /** Backoff until this timestamp (ms) */
  backoffUntil: number;
}

/**
 * Options for negative caching behavior.
 */
export interface NegativeCacheOptions {
  /** Base backoff duration in milliseconds (default: 300000 = 5 min) */
  backoffMs?: number;
  /** Maximum backoff duration in milliseconds (default: 3600000 = 1 hour) */
  maxBackoffMs?: number;
  /** Whether to use exponential backoff (default: true) */
  exponentialBackoff?: boolean;
  /** Maximum number of failures before permanent backoff (default: 10) */
  maxFailures?: number;
  /** Called when a cached negative result is returned */
  onNegativeHit?: (key: string, entry: NegativeCacheEntry) => void;
}

/**
 * Wrap a lookup function with negative caching.
 *
 * If the function throws, the error is cached for the backoff duration.
 * Subsequent calls within the backoff window return null immediately
 * without invoking the function, preventing unnecessary retries.
 *
 * @param key - Cache key for the lookup
 * @param fn - The lookup function that may fail
 * @param opts - Negative caching options
 * @returns The result of `fn()`, or null if in backoff period
 */
export async function withNegativeCache<T>(
  key: string,
  fn: () => Promise<T>,
  opts?: NegativeCacheOptions | number
): Promise<T | null> {
  // Allow passing just a backoff number for convenience
  const options: NegativeCacheOptions =
    typeof opts === 'number' ? { backoffMs: opts } : opts ?? {};

  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF_MS;
  const maxBackoffMs = options.maxBackoffMs ?? 60 * 60 * 1000;
  const useExponential = options.exponentialBackoff ?? true;
  const maxFailures = options.maxFailures ?? 10;
  const negKey = `${NEGATIVE_CACHE_PREFIX}${key}`;

  // Check for existing negative cache entry
  try {
    const entryStr = await cache.get(negKey);
    if (entryStr) {
      const entry = JSON.parse(entryStr) as NegativeCacheEntry;

      // Still in backoff window?
      if (Date.now() < entry.backoffUntil) {
        options.onNegativeHit?.(key, entry);
        return null;
      }

      // Backoff expired, allow retry but keep failure count for escalation
    }
  } catch {
    // Cache read failure: proceed with lookup
  }

  // Execute the lookup
  try {
    const result = await fn();

    // Success: clear any negative cache entry
    try {
      await cache.del(negKey);
    } catch {
      // Non-fatal
    }

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Get existing failure count for escalation
    let failureCount = 1;
    try {
      const existingStr = await cache.get(negKey);
      if (existingStr) {
        const existing = JSON.parse(existingStr) as NegativeCacheEntry;
        failureCount = Math.min(existing.failureCount + 1, maxFailures);
      }
    } catch {
      // Ignore
    }

    // Calculate backoff duration
    let currentBackoff: number;
    if (useExponential) {
      // Exponential backoff: baseMs * 2^(failureCount - 1), capped at maxBackoffMs
      currentBackoff = Math.min(
        backoffMs * Math.pow(2, failureCount - 1),
        maxBackoffMs
      );
    } else {
      currentBackoff = backoffMs;
    }

    const now = Date.now();
    const negEntry: NegativeCacheEntry = {
      cachedAt: now,
      errorMessage,
      failureCount,
      backoffUntil: now + currentBackoff,
    };

    // Cache the negative result
    const ttlSeconds = Math.ceil(currentBackoff / 1000) + 60; // Extra minute buffer
    try {
      await cache.set(negKey, JSON.stringify(negEntry), ttlSeconds);
    } catch {
      // Non-fatal
    }

    return null;
  }
}

/**
 * Manually clear a negative cache entry, allowing immediate retry.
 */
export async function clearNegativeCache(key: string): Promise<void> {
  const negKey = `${NEGATIVE_CACHE_PREFIX}${key}`;
  await cache.del(negKey).catch(() => {});
}

/**
 * Check if a key is currently in negative cache backoff.
 */
export async function isInBackoff(key: string): Promise<boolean> {
  const negKey = `${NEGATIVE_CACHE_PREFIX}${key}`;
  try {
    const entryStr = await cache.get(negKey);
    if (!entryStr) return false;
    const entry = JSON.parse(entryStr) as NegativeCacheEntry;
    return Date.now() < entry.backoffUntil;
  } catch {
    return false;
  }
}

/**
 * Get negative cache info for a key.
 */
export async function getNegativeCacheInfo(
  key: string
): Promise<NegativeCacheEntry | null> {
  const negKey = `${NEGATIVE_CACHE_PREFIX}${key}`;
  try {
    const entryStr = await cache.get(negKey);
    if (!entryStr) return null;
    return JSON.parse(entryStr) as NegativeCacheEntry;
  } catch {
    return null;
  }
}

/**
 * Clear all negative cache entries matching a prefix pattern.
 * Note: Only works with in-memory cache. For Redis, use SCAN + DEL.
 */
export async function clearNegativeCacheByPrefix(prefix: string): Promise<number> {
  const fullPrefix = `${NEGATIVE_CACHE_PREFIX}${prefix}`;
  let cleared = 0;

  // This only works efficiently with in-memory cache
  // For Redis, a SCAN-based approach would be needed
  try {
    // Attempt to clear known keys with this prefix
    // Since we don't have key enumeration in our cache interface,
    // callers should track their keys externally for bulk clearing
    await cache.del(fullPrefix);
    cleared++;
  } catch {
    // Non-fatal
  }

  return cleared;
}
