import type { Signal } from '@/types/signal';
import type { Contact } from '@/types/contact';
import type { Company } from '@/types/company';
import type { OutreachDraft } from '@/types/research';

export interface OutreachGenerationInput {
  company: Company;
  contact: Contact;
  signals: Signal[];
  whyNowNarrative: string;
  additionalContext?: string;
}

export interface OutreachGenerationResult {
  drafts: OutreachDraft[];
  metadata: {
    generatedAt: string;
    model: string;
    tokensUsed: number;
  };
}

type OutreachVariant = 'cold' | 'warm' | 'trigger_based';

function buildSystemPrompt(): string {
  return `You are an expert B2B sales copywriter for SalesIntel. Generate highly personalized outreach messages that:
- Reference specific, recent signals about the prospect's company
- Demonstrate deep understanding of their role and challenges
- Are concise (under 150 words for email body, under 300 chars for LinkedIn)
- Include a clear, low-friction call to action
- Never use generic phrases like "I hope this finds you well"
- Match the communication style of the recipient
- Reference their career history or recent activity when relevant

Always output valid JSON matching the requested schema.`;
}

function buildGenerationPrompt(input: OutreachGenerationInput, variant: OutreachVariant): string {
  const signalSummaries = input.signals
    .slice(0, 3)
    .map((s) => `- [${s.signalType}] ${s.title}: ${s.summary ?? ''}`)
    .join('\n');

  const careerContext = input.contact.careerHistory
    .slice(0, 3)
    .map((c) => `${c.title} at ${c.company}`)
    .join(', ');

  const commStyle = input.contact.commStyle ?? 'professional';

  return `Generate a ${variant} outreach message.

COMPANY: ${input.company.name} (${input.company.industry ?? 'Unknown industry'})
CONTACT: ${input.contact.fullName}, ${input.contact.title ?? 'Unknown title'}
SENIORITY: ${input.contact.seniority ?? 'Unknown'}
ROLE TYPE: ${input.contact.roleType ?? 'Unknown'}
COMMUNICATION STYLE: ${commStyle}
CAREER: ${careerContext || 'Not available'}
RECENT ACTIVITY: ${input.contact.recentActivity?.[0]?.content ?? 'None found'}

RECENT SIGNALS:
${signalSummaries || 'No specific signals'}

WHY NOW: ${input.whyNowNarrative}

${input.additionalContext ? `ADDITIONAL CONTEXT: ${input.additionalContext}` : ''}

VARIANT: ${variant}
${variant === 'cold' ? 'This is a cold outreach. No prior relationship. Focus on relevance and value.' : ''}
${variant === 'warm' ? 'This is a warm outreach. Assume some familiarity or shared connection. Be more conversational.' : ''}
${variant === 'trigger_based' ? 'This is triggered by a specific signal. Lead with the signal and explain why it matters.' : ''}

Return JSON: { "subject": "...", "body": "...", "signalReference": "..." }`;
}

async function callLLM(systemPrompt: string, userPrompt: string): Promise<{ subject: string; body: string; signalReference: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      console.error(`[OutreachGen] LLM returned ${res.status}: ${res.statusText}`);
      throw new Error(`LLM request failed: ${res.status}`);
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };

    const content = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    return {
      subject: parsed.subject ?? '',
      body: parsed.body ?? '',
      signalReference: parsed.signalReference ?? null,
    };
  } catch (err) {
    console.error('[OutreachGen] LLM call failed:', err);
    throw err;
  }
}

export async function generateOutreach(input: OutreachGenerationInput): Promise<OutreachGenerationResult> {
  const variants: OutreachVariant[] = ['cold', 'warm', 'trigger_based'];
  const systemPrompt = buildSystemPrompt();
  const drafts: OutreachDraft[] = [];
  let totalTokens = 0;

  const results = await Promise.allSettled(
    variants.map(async (variant) => {
      const prompt = buildGenerationPrompt(input, variant);
      const result = await callLLM(systemPrompt, prompt);
      return { variant, result };
    })
  );

  for (const settled of results) {
    if (settled.status === 'fulfilled') {
      const { variant, result } = settled.value;
      drafts.push({
        channel: 'email',
        subject: result.subject,
        body: result.body,
        variant,
        signalReference: result.signalReference,
      });
    } else {
      console.error(`[OutreachGen] Failed to generate ${settled.reason}`);
    }
  }

  // If signal-based, also generate a LinkedIn variant
  if (input.signals.length > 0) {
    try {
      const linkedinPrompt = buildGenerationPrompt(input, 'trigger_based');
      const linkedinResult = await callLLM(
        systemPrompt + '\nThis is for LinkedIn InMail. Keep it under 300 characters. Be concise and direct.',
        linkedinPrompt
      );

      drafts.push({
        channel: 'linkedin',
        subject: '',
        body: linkedinResult.body,
        variant: 'trigger_based',
        signalReference: linkedinResult.signalReference,
      });
    } catch {
      // LinkedIn variant is optional, don't fail
    }
  }

  return {
    drafts,
    metadata: {
      generatedAt: new Date().toISOString(),
      model: 'llama-3.1-70b-versatile',
      tokensUsed: totalTokens,
    },
  };
}

export async function regenerateVariant(
  input: OutreachGenerationInput,
  variant: OutreachVariant,
  feedback?: string
): Promise<OutreachDraft | null> {
  try {
    const systemPrompt = buildSystemPrompt();
    let prompt = buildGenerationPrompt(input, variant);

    if (feedback) {
      prompt += `\n\nUSER FEEDBACK ON PREVIOUS DRAFT: ${feedback}\nPlease improve based on this feedback.`;
    }

    const result = await callLLM(systemPrompt, prompt);

    return {
      channel: 'email',
      subject: result.subject,
      body: result.body,
      variant,
      signalReference: result.signalReference,
    };
  } catch (err) {
    console.error('[OutreachGen] Regeneration failed:', err);
    return null;
  }
}
