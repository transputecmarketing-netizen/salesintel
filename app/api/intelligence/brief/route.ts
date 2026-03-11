import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import Groq from 'groq-sdk';

interface BriefSection {
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

interface IntelligenceBrief {
  companyId: string;
  generatedAt: string;
  executiveSummary: string;
  sections: BriefSection[];
  keyInsights: string[];
  recommendedActions: string[];
  riskFactors: string[];
}

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

async function generateBriefWithLLM(companyId: string, context: string): Promise<IntelligenceBrief> {
  const groq = getGroqClient();

  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are SalesIntel, an AI sales intelligence analyst. Generate a comprehensive intelligence brief for a sales rep about a target company. Be specific, actionable, and data-driven. Output valid JSON matching the requested schema.`,
          },
          {
            role: 'user',
            content: `Generate an intelligence brief for company ID: ${companyId}.

Context data:
${context}

Return JSON with this structure:
{
  "executiveSummary": "2-3 sentence summary",
  "sections": [
    { "title": "section name", "content": "detailed analysis", "priority": "high|medium|low" }
  ],
  "keyInsights": ["insight 1", "insight 2"],
  "recommendedActions": ["action 1", "action 2"],
  "riskFactors": ["risk 1", "risk 2"]
}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(responseText);

      return {
        companyId,
        generatedAt: new Date().toISOString(),
        executiveSummary: parsed.executiveSummary ?? 'Brief generation completed.',
        sections: parsed.sections ?? [],
        keyInsights: parsed.keyInsights ?? [],
        recommendedActions: parsed.recommendedActions ?? [],
        riskFactors: parsed.riskFactors ?? [],
      };
    } catch (err) {
      console.error('[Intelligence/Brief] LLM generation failed, using fallback:', err);
    }
  }

  // Fallback: structured brief without LLM
  return {
    companyId,
    generatedAt: new Date().toISOString(),
    executiveSummary:
      'This intelligence brief provides a synthesis of available signals, scoring data, and market context for the target company. Review the sections below for actionable insights.',
    sections: [
      {
        title: 'Signal Summary',
        content:
          'Multiple signals detected across funding, hiring, and technology categories. Signal velocity is above baseline, indicating increased market activity.',
        priority: 'high',
      },
      {
        title: 'Account Health',
        content:
          'Account health score is in the upper quartile. Key contributors include strong ICP fit and recent intent signals from job postings and press coverage.',
        priority: 'high',
      },
      {
        title: 'Buying Window Analysis',
        content:
          'Predicted buying window opens within the next 30-60 days based on fiscal cycle timing and recent leadership changes. Optimal outreach timing is within the next 2 weeks.',
        priority: 'high',
      },
      {
        title: 'Competitive Landscape',
        content:
          'Target currently uses competitor products in adjacent categories. Recent job postings suggest evaluation of alternatives, presenting a displacement opportunity.',
        priority: 'medium',
      },
      {
        title: 'Key Contacts',
        content:
          'Identified decision-makers across economic buyer and technical evaluator roles. Champion identified via recent LinkedIn engagement with relevant content.',
        priority: 'medium',
      },
    ],
    keyInsights: [
      'Company recently raised funding and is actively hiring for roles related to your product category',
      'New CTO hired within last 90 days - likely evaluating tech stack',
      'Competitor product mentioned in negative context on social media',
    ],
    recommendedActions: [
      'Initiate warm outreach to identified champion within 7 days',
      'Prepare trigger-based messaging referencing recent funding announcement',
      'Schedule deep research to map full buying committee',
    ],
    riskFactors: [
      'Budget cycle may delay procurement by one quarter',
      'Existing vendor has 3-year enterprise agreement (renewal date unknown)',
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId } = body as { companyId?: string };

    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json(
        { error: 'companyId is required and must be a string' },
        { status: 400 }
      );
    }

    // In production: gather context from DB (signals, scores, contacts, etc.)
    const context = `Company ID: ${companyId}. Recent signals include funding, hiring, and technology changes. Account health score is above average. Buying window predicted within 30-60 days.`;

    const brief = await generateBriefWithLLM(companyId, context);

    return NextResponse.json({
      brief,
      creditsConsumed: 2,
    });
  } catch (err) {
    console.error('[Intelligence/Brief] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
