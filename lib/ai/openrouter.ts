// lib/ai/openrouter.ts - OpenRouter fallback client for LLM completions

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export interface ChatCompletionParams {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' };
}

export class OpenRouterRateLimitError extends Error {
  retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'OpenRouterRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class OpenRouterApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'OpenRouterApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Send a chat completion request to OpenRouter with automatic retry and exponential backoff.
 *
 * Uses the OpenAI-compatible API format that OpenRouter supports.
 * Retries up to 3 times on transient errors.
 * Throws OpenRouterRateLimitError on 429.
 */
export async function chatCompletion(params: ChatCompletionParams): Promise<string> {
  const {
    messages,
    model = DEFAULT_MODEL,
    temperature = 0.3,
    maxTokens = 4096,
    responseFormat,
  } = params;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterApiError('OPENROUTER_API_KEY is not configured');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const body: Record<string, unknown> = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      };

      if (responseFormat) {
        body.response_format = responseFormat;
      }

      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://salesintel.io',
          'X-Title': 'SalesIntel',
        },
        body: JSON.stringify(body),
      });

      // Rate limit: throw immediately
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const retryMs = retryAfter ? parseFloat(retryAfter) * 1000 : undefined;
        throw new OpenRouterRateLimitError(
          `OpenRouter rate limit exceeded (${response.status})`,
          retryMs
        );
      }

      // Client errors (4xx except 429): don't retry
      if (response.status >= 400 && response.status < 500) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        throw new OpenRouterApiError(
          `OpenRouter API error ${response.status}: ${errorBody}`,
          response.status
        );
      }

      // Server errors (5xx): retry
      if (response.status >= 500) {
        throw new OpenRouterApiError(
          `OpenRouter server error ${response.status}`,
          response.status
        );
      }

      if (!response.ok) {
        throw new OpenRouterApiError(
          `OpenRouter unexpected status ${response.status}`,
          response.status
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        error?: { message?: string };
      };

      if (data.error) {
        throw new OpenRouterApiError(
          `OpenRouter API error: ${data.error.message || JSON.stringify(data.error)}`
        );
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new OpenRouterApiError('Empty response from OpenRouter API');
      }

      return content;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Re-throw rate limit errors immediately
      if (err instanceof OpenRouterRateLimitError) {
        throw err;
      }

      // Re-throw client errors (non-retryable)
      if (err instanceof OpenRouterApiError && err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
        throw err;
      }

      // Retry on server errors / network issues
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError || new OpenRouterApiError('Unknown error during OpenRouter chat completion');
}

/**
 * Check if the OpenRouter API key is configured.
 */
export function isConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
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
