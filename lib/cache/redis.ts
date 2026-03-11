// lib/cache/redis.ts - Cache client with in-memory fallback
// Uses Upstash Redis when configured, falls back to in-memory Map.

export interface CacheEntry {
  value: string;
  expiresAt: number; // Unix timestamp in ms, 0 = no expiry
}

/**
 * Unified cache client that works with or without Redis.
 *
 * When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set,
 * uses Upstash Redis HTTP API. Otherwise, falls back to an in-memory Map.
 */
export class CacheClient {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private redisUrl: string | undefined;
  private redisToken: string | undefined;
  private useRedis: boolean;

  // Periodic cleanup interval for memory cache
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly CLEANUP_INTERVAL_MS = 60_000; // 1 minute

  constructor() {
    this.redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    this.redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    this.useRedis = Boolean(this.redisUrl && this.redisToken);

    if (!this.useRedis) {
      // Start periodic cleanup for expired in-memory entries
      this.cleanupInterval = setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL_MS);
      // Allow process to exit even if interval is running
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Get a value by key. Returns null if not found or expired.
   */
  async get(key: string): Promise<string | null> {
    if (this.useRedis) {
      return this.redisGet(key);
    }
    return this.memoryGet(key);
  }

  /**
   * Set a value with optional TTL in seconds.
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.useRedis) {
      return this.redisSet(key, value, ttlSeconds);
    }
    return this.memorySet(key, value, ttlSeconds);
  }

  /**
   * Delete a key.
   */
  async del(key: string): Promise<void> {
    if (this.useRedis) {
      return this.redisDel(key);
    }
    this.memoryCache.delete(key);
  }

  /**
   * Check if a key exists (and is not expired).
   */
  async exists(key: string): Promise<boolean> {
    if (this.useRedis) {
      return this.redisExists(key);
    }
    const entry = this.memoryCache.get(key);
    if (!entry) return false;
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get multiple keys at once.
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    if (this.useRedis) {
      return this.redisMget(keys);
    }
    return keys.map((key) => this.memoryGet(key) as string | null);
  }

  /**
   * Get the remaining TTL in seconds for a key. Returns -1 if no expiry, -2 if key doesn't exist.
   */
  async ttl(key: string): Promise<number> {
    if (this.useRedis) {
      return this.redisTtl(key);
    }
    const entry = this.memoryCache.get(key);
    if (!entry) return -2;
    if (entry.expiresAt === 0) return -1;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  /**
   * Get approximate size of the cache.
   */
  async size(): Promise<number> {
    if (this.useRedis) {
      // Upstash doesn't have a simple DBSIZE over REST, return -1
      return -1;
    }
    return this.memoryCache.size;
  }

  /**
   * Flush all keys (use with caution).
   */
  async flushAll(): Promise<void> {
    if (this.useRedis) {
      await this.redisCommand('FLUSHALL', []);
      return;
    }
    this.memoryCache.clear();
  }

  /**
   * Stop the cleanup interval (for graceful shutdown).
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Check if Redis is being used (vs. memory fallback).
   */
  isRedisConnected(): boolean {
    return this.useRedis;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // In-Memory Implementation
  // ═══════════════════════════════════════════════════════════════════════════

  private memoryGet(key: string): string | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return entry.value;
  }

  private memorySet(key: string, value: string, ttlSeconds?: number): void {
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
    this.memoryCache.set(key, { value, expiresAt });
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache) {
      if (entry.expiresAt > 0 && now > entry.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Upstash Redis REST API Implementation
  // ═══════════════════════════════════════════════════════════════════════════

  private async redisCommand(command: string, args: (string | number)[]): Promise<unknown> {
    const url = `${this.redisUrl}`;
    const body = [command, ...args];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error');
      throw new Error(`Redis command failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as { result: unknown };
    return data.result;
  }

  private async redisGet(key: string): Promise<string | null> {
    const result = await this.redisCommand('GET', [key]);
    return typeof result === 'string' ? result : null;
  }

  private async redisSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.redisCommand('SET', [key, value, 'EX', ttlSeconds]);
    } else {
      await this.redisCommand('SET', [key, value]);
    }
  }

  private async redisDel(key: string): Promise<void> {
    await this.redisCommand('DEL', [key]);
  }

  private async redisExists(key: string): Promise<boolean> {
    const result = await this.redisCommand('EXISTS', [key]);
    return result === 1;
  }

  private async redisMget(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];
    const result = await this.redisCommand('MGET', keys);
    if (Array.isArray(result)) {
      return result.map((v) => (typeof v === 'string' ? v : null));
    }
    return keys.map(() => null);
  }

  private async redisTtl(key: string): Promise<number> {
    const result = await this.redisCommand('TTL', [key]);
    return typeof result === 'number' ? result : -2;
  }
}

// Singleton instance
export const cache = new CacheClient();
