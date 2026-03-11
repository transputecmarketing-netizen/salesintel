// lib/ai/groq.ts - Groq client wrapper with retry logic and exponential backoff

import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export interface ChatCompletionParams {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' };
}

export class GroqRateLimitError extends Error {
  retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'GroqRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class GroqApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'GroqApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Send a chat completion request to Groq with automatic retry and exponential backoff.
 *
 * Retries up to 3 times on transient errors (5xx, network issues).
 * Throws GroqRateLimitError on 429 so the fallback chain can switch providers.
 */
export async function chatCompletion(params: ChatCompletionParams): Promise<string> {
  const {
    messages,
    model = DEFAULT_MODEL,
    temperature = 0.3,
    maxTokens = 4096,
    responseFormat,
  } = params;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const requestParams: Record<string, unknown> = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      };

      if (responseFormat) {
        requestParams.response_format = responseFormat;
      }

      const completion = await groq.chat.completions.create(
        requestParams as any
      );

      const content = completion.choices?.[0]?.message?.content;
      if (!content) {
        throw new GroqApiError('Empty response from Groq API');
      }

      return content;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Extract status code from various error shapes
      const statusCode = getStatusCode(err);

      // Rate limit: throw immediately so fallback chain can handle
      if (statusCode === 429) {
        const retryAfter = getRetryAfter(err);
        throw new GroqRateLimitError(
          `Groq rate limit exceeded: ${lastError.message}`,
          retryAfter
        );
      }

      // Client errors (4xx except 429): don't retry
      if (statusCode && statusCode >= 400 && statusCode < 500) {
        throw new GroqApiError(lastError.message, statusCode);
      }

      // Server errors (5xx) or network errors: retry with backoff
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError || new GroqApiError('Unknown error during Groq chat completion');
}

/**
 * Check if the Groq API key is configured.
 */
export function isConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

/**
 * Get the default model name.
 */
export function getDefaultModel(): string {
  return DEFAULT_MODEL;
}

// ═══════════════════════════════════════════════════════════════════════════
// Internal Helpers
// ═══════════════════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStatusCode(err: unknown): number | undefined {
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    if (typeof e.status === 'number') return e.status;
    if (typeof e.statusCode === 'number') return e.statusCode;
    if (typeof e.response === 'object' && e.response !== null) {
      const resp = e.response as Record<string, unknown>;
      if (typeof resp.status === 'number') return resp.status;
    }
  }
  return undefined;
}

function getRetryAfter(err: unknown): number | undefined {
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    if (typeof e.headers === 'object' && e.headers !== null) {
      const headers = e.headers as Record<string, string>;
      const retryAfter = headers['retry-after'];
      if (retryAfter) {
        const seconds = parseFloat(retryAfter);
        if (!isNaN(seconds)) return seconds * 1000;
      }
    }
  }
  return undefined;
}
