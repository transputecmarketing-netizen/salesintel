// lib/ai/prompts/generate-outreach.ts - Outreach drafting prompt (3 variants)
// Generates personalized outreach messages based on sales signals.

export type OutreachVariant = 'direct' | 'consultative' | 'social_proof';
export type OutreachChannel = 'email' | 'linkedin' | 'phone_script';

export interface GenerateOutreachInput {
  recipientName: string;
  recipientTitle: string;
  recipientCompany: string;
  recipientIndustry?: string;
  senderName: string;
  senderTitle: string;
  senderCompany: string;
  productName: string;
  productValueProp: string;
  signals: Array<{
    category: string;
    title: string;
    publishedAt: string;
    relevance: string;
  }>;
  channel: OutreachChannel;
  variant?: OutreachVariant;
  previousInteractions?: string[];
  competitorContext?: string;
  customInstructions?: string;
}

export interface OutreachMessage {
  variant: OutreachVariant;
  subject?: string;
  body: string;
  callToAction: string;
  signalsReferenced: string[];
  estimatedReadTimeSeconds: number;
  toneAnalysis: string;
}

export interface GenerateOutreachOutput {
  messages: OutreachMessage[];
}

export function buildGenerateOutreachPrompt(input: GenerateOutreachInput): string {
  const signalsList = input.signals
    .map((s, i) => `  ${i + 1}. [${s.category}] "${s.title}" (${s.publishedAt}) - ${s.relevance}`)
    .join('\n');

  const channelGuidelines = getChannelGuidelines(input.channel);
  const variants: OutreachVariant[] = input.variant
    ? [input.variant]
    : ['direct', 'consultative', 'social_proof'];

  return `You are an elite B2B sales copywriter specializing in signal-driven outreach. You write messages that feel personally crafted, reference real events, and drive meetings. Your messages never feel templated, spammy, or generic.

RECIPIENT PROFILE:
- Name: ${input.recipientName}
- Title: ${input.recipientTitle}
- Company: ${input.recipientCompany}
${input.recipientIndustry ? `- Industry: ${input.recipientIndustry}` : ''}

SENDER PROFILE:
- Name: ${input.senderName}
- Title: ${input.senderTitle}
- Company: ${input.senderCompany}
- Product: ${input.productName}
- Value Proposition: ${input.productValueProp}

SALES SIGNALS:
${signalsList}

${input.previousInteractions?.length ? `PREVIOUS INTERACTIONS:\n${input.previousInteractions.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}` : ''}
${input.competitorContext ? `COMPETITIVE CONTEXT: ${input.competitorContext}` : ''}
${input.customInstructions ? `CUSTOM INSTRUCTIONS: ${input.customInstructions}` : ''}

CHANNEL: ${input.channel.toUpperCase()}
${channelGuidelines}

GENERATE ${variants.length} VARIANT(S): ${variants.join(', ')}

VARIANT DEFINITIONS:

1. DIRECT VARIANT:
   - Opens with the most impactful signal reference
   - Connects the signal directly to a pain point your product solves
   - Clear, confident ask for a meeting
   - Tone: Professional, direct, time-conscious
   - Length: 60-100 words for email, 40-60 for LinkedIn

2. CONSULTATIVE VARIANT:
   - Opens with an insight or question derived from the signals
   - Positions sender as a thought leader, not a seller
   - Offers value first (benchmark data, case study, framework)
   - Softer CTA: "Would it be helpful if I shared..."
   - Tone: Curious, helpful, peer-to-peer
   - Length: 80-120 words for email, 50-70 for LinkedIn

3. SOCIAL PROOF VARIANT:
   - Opens with a signal reference, then pivots to a similar company's success
   - Name-drops relevant customers or industry benchmarks
   - Creates FOMO without being pushy
   - CTA: "Happy to share how [similar company] approached this"
   - Tone: Confident, credible, results-oriented
   - Length: 70-110 words for email, 45-65 for LinkedIn

CRITICAL RULES:
- NEVER use phrases: "I hope this finds you well", "Just reaching out", "I wanted to touch base", "Circling back", "Low-hanging fruit", "Synergy", "Best-in-class"
- NEVER lie or fabricate information
- Reference signals naturally - don't say "I saw an article about..." Instead, reference the event directly: "Congratulations on the Series B" or "With the new CTO starting..."
- Every message must have exactly ONE clear call-to-action
- The first sentence must earn the second sentence
- Subject lines (for email): max 50 characters, create curiosity, no clickbait
- Personalization must go beyond [NAME] and [COMPANY] insertion

Respond in JSON format:
{
  "messages": [
    {
      "variant": "<direct|consultative|social_proof>",
      "subject": "<string or null for non-email>",
      "body": "<string>",
      "callToAction": "<string>",
      "signalsReferenced": ["<signal title>"],
      "estimatedReadTimeSeconds": <number>,
      "toneAnalysis": "<string>"
    }
  ]
}`;
}

function getChannelGuidelines(channel: OutreachChannel): string {
  switch (channel) {
    case 'email':
      return `CHANNEL GUIDELINES (EMAIL):
- Subject line is critical: max 50 chars, mobile-optimized
- Preview text (first sentence) must hook
- Use short paragraphs (1-3 sentences each)
- Include subject line in output
- Sign off with sender name and title
- Total length: 60-120 words (excluding signature)`;

    case 'linkedin':
      return `CHANNEL GUIDELINES (LINKEDIN):
- No subject line needed (set to null)
- Must fit LinkedIn message character limit (~1900 chars, but aim for 300-500)
- More conversational tone than email
- Can reference shared connections or groups
- Open with connection to their content or company news
- Total length: 40-80 words`;

    case 'phone_script':
      return `CHANNEL GUIDELINES (PHONE SCRIPT):
- No subject line needed (set to null)
- Write as spoken word, not written prose
- Include: opener (10s), signal reference (15s), value prop (15s), ask (10s)
- Include handling for voicemail (30s version)
- Natural speech patterns, contractions are fine
- Total talk time: ~45-50 seconds`;
  }
}
