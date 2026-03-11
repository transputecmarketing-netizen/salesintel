// lib/cache/stampede.ts - Cache stampede prevention with in-flight promise coalescing
// Prevents multiple concurrent requests from rebuilding the same cache entry.

import { cache } from './redis';

/**
 * Map of in-flight promises keyed by cache key.
 * When a cache miss occurs, only the first caller executes the fetch function.
 * Subsequent callers for the same key await the same promise.
 */
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Cache-aside with stampede prevention via promise coalescing.
 *
 * 1. Check cache for existing value.
 * 2. If cache hit, return deserialized value.
 * 3. If cache miss, check if another caller is already computing this key.
 * 4. If yes, piggyback on that in-flight promise.
 * 5. If no, execute `fn()`, cache the result, and return it.
 *
 * @param key - Cache key
 * @param fn - Function to compute the value on cache miss
 * @param ttl - Time-to-live in seconds (default: 300 = 5 minutes)
 * @returns The cached or freshly computed value
 */
export async function coalesce<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // 1. Check cache
  try {
    const cached = await cache.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // Cache read failed, proceed to compute
  }

  // 2. Check for in-flight request
  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  // 3. No in-flight request; we're the leader. Compute the value.
  const promise = computeAndCache<T>(key, fn, ttl);
  inFlight.set(key, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    // Clean up in-flight entry regardless of success/failure
    inFlight.delete(key);
  }
}

/**
 * Execute the fetch function, cache the result, and return it.
 */
async function computeAndCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number
): Promise<T> {
  const result = await fn();

  // Cache the result (fire-and-forget, don't block on cache write)
  try {
    const serialized = JSON.stringify(result);
    await cache.set(key, serialized, ttl);
  } catch (err) {
    // Cache write failure is non-fatal
    console.warn(`[cache/stampede] Failed to cache key "${key}":`, err);
  }

  return result;
}

/**
 * Force recompute a key, ignoring any cached value.
 * Still uses coalescing to prevent concurrent recomputes.
 */
export async function recompute<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Delete existing cache entry
  try {
    await cache.del(key);
  } catch {
    // Ignore deletion errors
  }

  // Check for in-flight recompute
  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = computeAndCache<T>(key, fn, ttl);
  inFlight.set(key, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    inFlight.delete(key);
  }
}

/**
 * Get the number of currently in-flight requests.
 * Useful for monitoring and debugging.
 */
export function getInFlightCount(): number {
  return inFlight.size;
}

/**
 * Get all currently in-flight cache keys.
 */
export function getInFlightKeys(): string[] {
  return Array.from(inFlight.keys());
}
