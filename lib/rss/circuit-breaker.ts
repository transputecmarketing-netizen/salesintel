// lib/rss/circuit-breaker.ts - Per-feed circuit breaker with cooldown

export type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitEntry {
  state: CircuitState;
  failureCount: number;
  lastFailureAt: number;
  openedAt: number;
  successCount: number;
  totalRequests: number;
}

const DEFAULT_FAILURE_THRESHOLD = 3;
const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const HALF_OPEN_MAX_ATTEMPTS = 1;

export class CircuitBreaker {
  private circuits: Map<string, CircuitEntry> = new Map();
  private failureThreshold: number;
  private cooldownMs: number;

  constructor(opts?: { failureThreshold?: number; cooldownMs?: number }) {
    this.failureThreshold = opts?.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
    this.cooldownMs = opts?.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  }

  /**
   * Check whether a request to the given feed URL is currently allowed.
   * Returns true if the circuit is closed or has transitioned to half-open.
   */
  canRequest(feedUrl: string): boolean {
    const entry = this.circuits.get(feedUrl);
    if (!entry) return true;

    switch (entry.state) {
      case 'closed':
        return true;

      case 'open': {
        const elapsed = Date.now() - entry.openedAt;
        if (elapsed >= this.cooldownMs) {
          // Transition to half-open: allow a single probe request
          entry.state = 'half-open';
          return true;
        }
        return false;
      }

      case 'half-open':
        // Allow one probe request in half-open state
        return true;

      default:
        return true;
    }
  }

  /**
   * Record a successful request. Resets the circuit to closed state.
   */
  recordSuccess(feedUrl: string): void {
    const entry = this.getOrCreate(feedUrl);
    entry.failureCount = 0;
    entry.state = 'closed';
    entry.successCount++;
    entry.totalRequests++;
  }

  /**
   * Record a failed request. Opens the circuit after reaching the failure threshold.
   */
  recordFailure(feedUrl: string): void {
    const entry = this.getOrCreate(feedUrl);
    entry.failureCount++;
    entry.lastFailureAt = Date.now();
    entry.totalRequests++;

    if (entry.state === 'half-open') {
      // Failed during probe: reopen the circuit
      entry.state = 'open';
      entry.openedAt = Date.now();
      return;
    }

    if (entry.failureCount >= this.failureThreshold) {
      entry.state = 'open';
      entry.openedAt = Date.now();
    }
  }

  /**
   * Manually reset a circuit to closed state.
   */
  reset(feedUrl: string): void {
    this.circuits.delete(feedUrl);
  }

  /**
   * Get the current state of a feed's circuit.
   */
  getState(feedUrl: string): CircuitState {
    const entry = this.circuits.get(feedUrl);
    if (!entry) return 'closed';

    // Check if open circuit should transition to half-open
    if (entry.state === 'open') {
      const elapsed = Date.now() - entry.openedAt;
      if (elapsed >= this.cooldownMs) {
        entry.state = 'half-open';
      }
    }

    return entry.state;
  }

  /**
   * Get detailed stats for a feed's circuit.
   */
  getStats(feedUrl: string): CircuitEntry | null {
    return this.circuits.get(feedUrl) || null;
  }

  /**
   * Get all URLs with open circuits.
   */
  getOpenCircuits(): string[] {
    const result: string[] = [];
    for (const [url, entry] of this.circuits) {
      if (entry.state === 'open') {
        const elapsed = Date.now() - entry.openedAt;
        if (elapsed < this.cooldownMs) {
          result.push(url);
        }
      }
    }
    return result;
  }

  /**
   * Get the remaining cooldown time in milliseconds for an open circuit.
   * Returns 0 if the circuit is not open.
   */
  getRemainingCooldown(feedUrl: string): number {
    const entry = this.circuits.get(feedUrl);
    if (!entry || entry.state !== 'open') return 0;

    const elapsed = Date.now() - entry.openedAt;
    const remaining = this.cooldownMs - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Reset all circuits.
   */
  resetAll(): void {
    this.circuits.clear();
  }

  /**
   * Get or create a circuit entry for a feed URL.
   */
  private getOrCreate(feedUrl: string): CircuitEntry {
    let entry = this.circuits.get(feedUrl);
    if (!entry) {
      entry = {
        state: 'closed',
        failureCount: 0,
        lastFailureAt: 0,
        openedAt: 0,
        successCount: 0,
        totalRequests: 0,
      };
      this.circuits.set(feedUrl, entry);
    }
    return entry;
  }
}

// Singleton instance for application-wide use
export const feedCircuitBreaker = new CircuitBreaker();
