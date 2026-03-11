import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import Groq from 'groq-sdk';

interface Icebreaker {
  text: string;
  tone: 'professional' | 'casual' | 'witty';
  relevance: string;
}

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

async function generateIcebreakers(
  postContent: string,
  _contactId: string | null
): Promise<Icebreaker[]> {
  const groq = getGroqClient();

  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are SalesIntel's AI copywriter. Generate 3 icebreaker opening lines based on a prospect's social media post. Each icebreaker should:
- Directly reference the post content
- Feel natural and non-salesy
- Create an opening for further conversation
- Be under 2 sentences

Return valid JSON:
{
  "icebreakers": [
    { "text": "the icebreaker line", "tone": "professional|casual|witty", "relevance": "why this works" }
  ]
}`,
          },
          {
            role: 'user',
            content: `Social post content:\n\n"${postContent}"`,
          },
        ],
        temperature: 0.8,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(responseText);
      return parsed.icebreakers ?? [];
    } catch (err) {
      console.error('[Outreach/Icebreaker] LLM generation failed:', err);
    }
  }

  // Fallback icebreakers based on simple analysis
  const hasQuestion = postContent.includes('?');
  const hasAchievement = /launched|shipped|raised|hired|promoted|achieved|milestone/i.test(postContent);
  const hasOpinion = /I think|I believe|unpopular opinion|hot take|in my experience/i.test(postContent);

  const icebreakers: Icebreaker[] = [];

  if (hasAchievement) {
    icebreakers.push({
      text: `Congrats on the milestone you shared! That kind of momentum is hard to build - would love to hear more about what's driving it.`,
      tone: 'professional',
      relevance: 'References achievement/milestone in the post',
    });
  }

  if (hasOpinion) {
    icebreakers.push({
      text: `Really resonated with your take - it aligns with a pattern we're seeing across the industry. Curious if you've considered [related angle]?`,
      tone: 'casual',
      relevance: 'Engages with their opinion to start a dialogue',
    });
  }

  if (hasQuestion) {
    icebreakers.push({
      text: `Saw your question about this topic - we've been researching the same thing and found some interesting data. Happy to share if useful.`,
      tone: 'professional',
      relevance: 'Offers value by answering their question',
    });
  }

  // Always include a generic but relevant one
  icebreakers.push({
    text: `Your recent post caught my eye - the insight about the market shift is spot on. We're seeing the same trend with our customers.`,
    tone: 'casual',
    relevance: 'General engagement with their content',
  });

  return icebreakers.slice(0, 3);
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postContent, contactId } = body as {
      postContent?: string;
      contactId?: string;
    };

    if (!postContent || typeof postContent !== 'string' || postContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'postContent is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (postContent.length > 5000) {
      return NextResponse.json(
        { error: 'postContent must be under 5000 characters' },
        { status: 400 }
      );
    }

    const icebreakers = await generateIcebreakers(
      postContent.trim(),
      contactId ?? null
    );

    return NextResponse.json({
      icebreakers,
      contactId: contactId ?? null,
      postContentLength: postContent.trim().length,
      creditsConsumed: 1,
    });
  } catch (err) {
    console.error('[Outreach/Icebreaker] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
