export interface ScheduledJob {
  id: string;
  name: string;
  endpoint: string;
  schedule: string; // cron expression
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  metadata: Record<string, unknown>;
}

export interface QStashPublishResult {
  messageId: string;
  success: boolean;
  error?: string;
}

const QSTASH_BASE_URL = 'https://qstash.upstash.io/v2';

function getQStashToken(): string {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error('QSTASH_TOKEN is not configured');
  return token;
}

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (!url) throw new Error('Application URL not configured');
  return url.startsWith('http') ? url : `https://${url}`;
}

/**
 * Publish a one-time job to QStash.
 */
export async function publishJob(
  endpoint: string,
  body: Record<string, unknown>,
  options?: {
    delay?: number; // seconds
    retries?: number;
    deduplicationId?: string;
  }
): Promise<QStashPublishResult> {
  try {
    const url = `${getBaseUrl()}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${getQStashToken()}`,
      'Content-Type': 'application/json',
      'Upstash-Forward-Content-Type': 'application/json',
    };

    if (options?.delay) {
      headers['Upstash-Delay'] = `${options.delay}s`;
    }

    if (options?.retries !== undefined) {
      headers['Upstash-Retries'] = String(options.retries);
    }

    if (options?.deduplicationId) {
      headers['Upstash-Deduplication-Id'] = options.deduplicationId;
    }

    const res = await fetch(`${QSTASH_BASE_URL}/publish/${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Scheduler] QStash publish failed: ${res.status} ${errorText}`);
      return { messageId: '', success: false, error: errorText };
    }

    const data = await res.json() as { messageId?: string };
    return { messageId: data.messageId ?? '', success: true };
  } catch (err) {
    console.error('[Scheduler] QStash publish error:', err);
    return { messageId: '', success: false, error: String(err) };
  }
}

/**
 * Create a recurring schedule in QStash.
 */
export async function createSchedule(
  name: string,
  endpoint: string,
  cronExpression: string,
  body?: Record<string, unknown>
): Promise<{ scheduleId: string; success: boolean; error?: string }> {
  try {
    const url = `${getBaseUrl()}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${getQStashToken()}`,
      'Content-Type': 'application/json',
      'Upstash-Forward-Content-Type': 'application/json',
      'Upstash-Cron': cronExpression,
    };

    const res = await fetch(`${QSTASH_BASE_URL}/schedules/${url}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Scheduler] Schedule creation failed: ${res.status} ${errorText}`);
      return { scheduleId: '', success: false, error: errorText };
    }

    const data = await res.json() as { scheduleId?: string };
    return { scheduleId: data.scheduleId ?? '', success: true };
  } catch (err) {
    console.error('[Scheduler] Schedule creation error:', err);
    return { scheduleId: '', success: false, error: String(err) };
  }
}

/**
 * Delete a schedule from QStash.
 */
export async function deleteSchedule(scheduleId: string): Promise<boolean> {
  try {
    const res = await fetch(`${QSTASH_BASE_URL}/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getQStashToken()}`,
      },
    });

    if (!res.ok) {
      console.error(`[Scheduler] Schedule deletion failed: ${res.status}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Scheduler] Schedule deletion error:', err);
    return false;
  }
}

/**
 * List all active schedules from QStash.
 */
export async function listSchedules(): Promise<ScheduledJob[]> {
  try {
    const res = await fetch(`${QSTASH_BASE_URL}/schedules`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getQStashToken()}`,
      },
    });

    if (!res.ok) {
      console.error(`[Scheduler] List schedules failed: ${res.status}`);
      return [];
    }

    const data = await res.json() as Array<{
      scheduleId?: string;
      cron?: string;
      destination?: string;
      createdAt?: number;
    }>;

    return data.map((s) => ({
      id: s.scheduleId ?? '',
      name: '',
      endpoint: s.destination ?? '',
      schedule: s.cron ?? '',
      isActive: true,
      lastRunAt: null,
      nextRunAt: null,
      metadata: {},
    }));
  } catch (err) {
    console.error('[Scheduler] List schedules error:', err);
    return [];
  }
}

/**
 * Verify QStash webhook signature.
 */
export async function verifySignature(
  signature: string,
  body: string,
  signingKey?: string
): Promise<boolean> {
  try {
    const key = signingKey ?? process.env.QSTASH_CURRENT_SIGNING_KEY;
    if (!key) {
      console.error('[Scheduler] No signing key configured');
      return false;
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const msgData = encoder.encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    if (computedSignature === signature) return true;

    // Try next signing key (for key rotation)
    const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY;
    if (nextKey && nextKey !== key) {
      return verifySignature(signature, body, nextKey);
    }

    return false;
  } catch (err) {
    console.error('[Scheduler] Signature verification error:', err);
    return false;
  }
}

// --- Pre-built Schedules ---

/**
 * Schedule the morning monitoring sweep (runs daily at 6 AM UTC).
 */
export async function scheduleMorningSweep(): Promise<string> {
  const result = await createSchedule(
    'morning-monitoring-sweep',
    '/api/cron/monitoring-sweep',
    '0 6 * * *',
    { scope: 'all' }
  );
  return result.scheduleId;
}

/**
 * Schedule hourly signal checks for high-priority watchlist items.
 */
export async function scheduleHighPriorityChecks(): Promise<string> {
  const result = await createSchedule(
    'high-priority-signal-check',
    '/api/cron/monitoring-sweep',
    '0 * * * *',
    { scope: 'high_priority' }
  );
  return result.scheduleId;
}

/**
 * Schedule daily digest email generation (runs daily at 7 AM UTC).
 */
export async function scheduleDailyDigest(): Promise<string> {
  const result = await createSchedule(
    'daily-digest',
    '/api/cron/digest',
    '0 7 * * *',
    { type: 'daily' }
  );
  return result.scheduleId;
}
