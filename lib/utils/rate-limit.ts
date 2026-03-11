export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      // Remove entries older than 5 minutes past their window
      if (now - entry.windowStart > 300_000) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Allow Node.js to exit even if timer is running
  if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Check and consume a rate limit token for a given key.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  startCleanup();

  const now = Date.now();
  const entry = store.get(key);

  // No existing entry or window expired - start new window
  if (!entry || now - entry.windowStart >= config.windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
      retryAfterMs: 0,
    };
  }

  // Within current window
  if (entry.count < config.maxRequests) {
    entry.count++;
    const resetAt = entry.windowStart + config.windowMs;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt,
      retryAfterMs: 0,
    };
  }

  // Rate limit exceeded
  const resetAt = entry.windowStart + config.windowMs;
  return {
    allowed: false,
    remaining: 0,
    resetAt,
    retryAfterMs: resetAt - now,
  };
}

/**
 * Check rate limit without consuming a token.
 */
export function peekRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= config.windowMs) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
      retryAfterMs: 0,
    };
  }

  const resetAt = entry.windowStart + config.windowMs;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt,
    retryAfterMs: remaining > 0 ? 0 : resetAt - now,
  };
}

/**
 * Reset rate limit for a specific key.
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Clear all rate limit entries.
 */
export function clearAllRateLimits(): void {
  store.clear();
}

// --- Pre-configured rate limiters ---

/** API rate limit: 60 requests per minute per user */
export function checkApiRateLimit(userId: string): RateLimitResult {
  return checkRateLimit(`api:${userId}`, { maxRequests: 60, windowMs: 60_000 });
}

/** Research job rate limit: 5 per hour per user */
export function checkResearchRateLimit(userId: string): RateLimitResult {
  return checkRateLimit(`research:${userId}`, { maxRequests: 5, windowMs: 3_600_000 });
}

/** Outreach generation rate limit: 20 per hour per user */
export function checkOutreachRateLimit(userId: string): RateLimitResult {
  return checkRateLimit(`outreach:${userId}`, { maxRequests: 20, windowMs: 3_600_000 });
}

/** Enrichment API rate limit: 30 per minute per service */
export function checkEnrichmentRateLimit(service: string): RateLimitResult {
  return checkRateLimit(`enrichment:${service}`, { maxRequests: 30, windowMs: 60_000 });
}

/**
 * Create rate limit response headers for HTTP responses.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed ? {} : { 'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)) }),
  };
}
