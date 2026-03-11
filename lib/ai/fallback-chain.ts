// lib/ai/fallback-chain.ts - LLM fallback chain: Groq -> OpenRouter
// Transparently handles provider failover on rate limits or errors.

import * as groq from './groq';
import * as openrouter from './openrouter';

export interface LLMCompletionParams {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' };
}

export interface LLMCompletionResult {
  content: string;
  provider: 'groq' | 'openrouter';
  model: string;
  fallbackUsed: boolean;
}

type Provider = {
  name: 'groq' | 'openrouter';
  isConfigured: () => boolean;
  chatCompletion: (params: groq.ChatCompletionParams) => Promise<string>;
  defaultModel: string;
};

const providers: Provider[] = [
  {
    name: 'groq',
    isConfigured: groq.isConfigured,
    chatCompletion: groq.chatCompletion,
    defaultModel: groq.getDefaultModel(),
  },
  {
    name: 'openrouter',
    isConfigured: openrouter.isConfigured,
    chatCompletion: openrouter.chatCompletion,
    defaultModel: openrouter.getDefaultModel(),
  },
];

/**
 * Send a chat completion request with automatic fallback across providers.
 *
 * Strategy:
 * 1. Try Groq first (fastest inference)
 * 2. If Groq fails with rate limit or error, try OpenRouter
 * 3. If all providers fail, throw the last error
 *
 * The `model` parameter is provider-specific. If not provided, each provider
 * uses its own default model.
 */
export async function llmComplete(
  params: LLMCompletionParams
): Promise<LLMCompletionResult> {
  const errors: Array<{ provider: string; error: Error }> = [];

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i]!;
    const isFallback = i > 0;

    // Skip providers that aren't configured
    if (!provider.isConfigured()) {
      errors.push({
        provider: provider.name,
        error: new Error(`${provider.name} API key not configured`),
      });
      continue;
    }

    try {
      // Use provider-specific default model unless caller specified one
      const providerParams: groq.ChatCompletionParams = {
        messages: params.messages,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        responseFormat: params.responseFormat,
        // Only pass model through if it was explicitly provided
        ...(params.model ? { model: params.model } : {}),
      };

      const content = await provider.chatCompletion(providerParams);

      return {
        content,
        provider: provider.name,
        model: params.model || provider.defaultModel,
        fallbackUsed: isFallback,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errors.push({ provider: provider.name, error });

      // Log the fallback for observability
      if (i < providers.length - 1) {
        console.warn(
          `[llm-fallback] ${provider.name} failed (${error.message}), falling back to ${providers[i + 1]?.name ?? 'none'}`
        );
      }

      // Continue to next provider
      continue;
    }
  }

  // All providers failed
  const errorSummary = errors
    .map((e) => `${e.provider}: ${e.error.message}`)
    .join('; ');

  throw new Error(`All LLM providers failed: ${errorSummary}`);
}

/**
 * Convenience wrapper: send a simple user message and get a string response.
 */
export async function llmSimple(
  userMessage: string,
  systemPrompt?: string,
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const messages: LLMCompletionParams['messages'] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userMessage });

  const result = await llmComplete({
    messages,
    temperature: opts?.temperature,
    maxTokens: opts?.maxTokens,
  });

  return result.content;
}

/**
 * Convenience wrapper: send a prompt and parse JSON response.
 */
export async function llmJson<T = unknown>(
  userMessage: string,
  systemPrompt?: string,
  opts?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  const messages: LLMCompletionParams['messages'] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userMessage });

  const result = await llmComplete({
    messages,
    temperature: opts?.temperature ?? 0.1,
    maxTokens: opts?.maxTokens,
    responseFormat: { type: 'json_object' },
  });

  return JSON.parse(result.content) as T;
}

/**
 * Check which providers are currently available.
 */
export function getAvailableProviders(): string[] {
  return providers.filter((p) => p.isConfigured()).map((p) => p.name);
}
