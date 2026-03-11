import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import Groq from 'groq-sdk';
import type { OutreachDraft } from '@/types/research';

type OutreachVariant = 'cold' | 'warm' | 'trigger_based';
type OutreachChannel = 'email' | 'linkedin' | 'phone_script';

interface GenerateRequest {
  companyId: string;
  contactId?: string;
  signalId?: string;
  variant: OutreachVariant;
  channel?: OutreachChannel;
}

const VARIANT_PROMPTS: Record<OutreachVariant, string> = {
  cold: 'Write a cold outreach message. Be concise, personalized, and value-driven. Reference the company\'s recent activities to show research. No generic templates.',
  warm: 'Write a warm outreach message building on an existing connection or mutual interest. Reference shared context, mutual connections, or prior interactions.',
  trigger_based: 'Write a trigger-based outreach message directly referencing a specific signal or event. The message should feel timely and relevant, showing you\'re paying attention to their business.',
};

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

async function generateWithLLM(
  variant: OutreachVariant,
  channel: OutreachChannel,
  context: string
): Promise<OutreachDraft[]> {
  const groq = getGroqClient();

  if (groq) {
    try {
      const channelInstructions: Record<OutreachChannel, string> = {
        email: 'Format as an email with subject line and body. Keep under 150 words.',
        linkedin: 'Format as a LinkedIn message. Keep under 100 words. Professional but conversational.',
        phone_script: 'Format as a phone call script with opening, value prop, and close. Include objection handles.',
      };

      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are SalesIntel's AI outreach writer. Generate highly personalized, effective sales outreach. ${VARIANT_PROMPTS[variant]}

${channelInstructions[channel]}

Output valid JSON with this structure:
{
  "drafts": [
    {
      "subject": "email subject or empty for linkedin/phone",
      "body": "the message body",
      "variant": "${variant}",
      "channel": "${channel}",
      "signalReference": "which signal/event this references, if any"
    }
  ]
}

Generate 2 alternative versions.`,
          },
          {
            role: 'user',
            content: context,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(responseText);

      return (parsed.drafts ?? []).map((d: Record<string, string>) => ({
        channel: (d.channel as OutreachChannel) ?? channel,
        subject: d.subject ?? '',
        body: d.body ?? '',
        variant,
        signalReference: d.signalReference ?? null,
      }));
    } catch (err) {
      console.error('[Outreach/Generate] LLM generation failed, using templates:', err);
    }
  }

  // Fallback templates
  return [
    {
      channel,
      subject: channel === 'email' ? 'Quick question about your growth plans' : '',
      body: channel === 'email'
        ? `Hi [Name],\n\nI noticed [Company] has been making some exciting moves recently. [Signal reference].\n\nWe help companies like yours [value proposition]. Would you be open to a brief conversation about how we might support your growth?\n\nBest,\n[Your name]`
        : channel === 'linkedin'
          ? `Hi [Name], I saw [Company]'s recent [signal]. Impressive momentum! We help companies at your stage with [value prop]. Would love to share a few ideas - open to connecting?`
          : `Opening: "Hi [Name], this is [Your name] from [Company]. I'm reaching out because I saw [signal reference]."\n\nValue prop: "We help companies like [Company] with [value prop]."\n\nAsk: "Would you have 15 minutes this week to explore if there's a fit?"`,
      variant,
      signalReference: null,
    },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, contactId, signalId, variant, channel } = body as GenerateRequest & { channel?: OutreachChannel };

    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json(
        { error: 'companyId is required and must be a string' },
        { status: 400 }
      );
    }

    const validVariants: OutreachVariant[] = ['cold', 'warm', 'trigger_based'];
    if (!variant || !validVariants.includes(variant)) {
      return NextResponse.json(
        { error: `variant must be one of: ${validVariants.join(', ')}` },
        { status: 400 }
      );
    }

    const validChannels: OutreachChannel[] = ['email', 'linkedin', 'phone_script'];
    const selectedChannel: OutreachChannel = channel && validChannels.includes(channel)
      ? channel
      : 'email';

    // In production: fetch company, contact, and signal data from DB
    const context = `Generate ${variant} outreach via ${selectedChannel} for company ID: ${companyId}.${
      contactId ? ` Contact ID: ${contactId}.` : ''
    }${signalId ? ` Triggered by signal ID: ${signalId}.` : ''}`;

    const drafts = await generateWithLLM(variant, selectedChannel, context);

    return NextResponse.json({
      drafts,
      companyId,
      contactId: contactId ?? null,
      signalId: signalId ?? null,
      variant,
      channel: selectedChannel,
      creditsConsumed: 1,
    });
  } catch (err) {
    console.error('[Outreach/Generate] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
