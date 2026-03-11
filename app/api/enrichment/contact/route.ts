import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { enrichPerson } from '@/lib/enrichment/clearbit';

interface ProxycurlProfile {
  fullName: string;
  headline: string;
  summary: string;
  location: string;
  connections: number;
  experiences: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string | null;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
  }>;
  skills: string[];
}

async function enrichViaProxycurl(linkedinUrl: string): Promise<ProxycurlProfile | null> {
  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedinUrl)}&skills=include`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      console.error(`[Proxycurl] Returned ${res.status}: ${res.statusText}`);
      return null;
    }

    const data = await res.json();

    return {
      fullName: `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim(),
      headline: data.headline ?? '',
      summary: data.summary ?? '',
      location: data.city ? `${data.city}, ${data.state ?? data.country ?? ''}`.trim() : '',
      connections: data.connections ?? 0,
      experiences: (data.experiences ?? []).map((exp: Record<string, unknown>) => ({
        company: (exp.company as string) ?? '',
        title: (exp.title as string) ?? '',
        startDate: exp.starts_at
          ? `${(exp.starts_at as Record<string, number>).year}-${String((exp.starts_at as Record<string, number>).month ?? 1).padStart(2, '0')}`
          : '',
        endDate: exp.ends_at
          ? `${(exp.ends_at as Record<string, number>).year}-${String((exp.ends_at as Record<string, number>).month ?? 1).padStart(2, '0')}`
          : null,
        description: (exp.description as string) ?? '',
      })),
      education: (data.education ?? []).map((edu: Record<string, unknown>) => ({
        school: (edu.school as string) ?? '',
        degree: (edu.degree_name as string) ?? '',
        field: (edu.field_of_study as string) ?? '',
      })),
      skills: (data.skills ?? []) as string[],
    };
  } catch (err) {
    console.error('[Proxycurl] Request failed:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { linkedinUrl, email } = body as {
      linkedinUrl?: string;
      email?: string;
    };

    if (!linkedinUrl && !email) {
      return NextResponse.json(
        { error: 'Either linkedinUrl or email is required' },
        { status: 400 }
      );
    }

    if (linkedinUrl && typeof linkedinUrl !== 'string') {
      return NextResponse.json({ error: 'linkedinUrl must be a string' }, { status: 400 });
    }

    if (email && (typeof email !== 'string' || !email.includes('@'))) {
      return NextResponse.json({ error: 'email must be a valid email address' }, { status: 400 });
    }

    // Run available enrichment providers in parallel
    const [proxycurlResult, clearbitResult] = await Promise.all([
      linkedinUrl ? enrichViaProxycurl(linkedinUrl.trim()) : Promise.resolve(null),
      email ? enrichPerson(email.trim()) : Promise.resolve(null),
    ]);

    if (!proxycurlResult && !clearbitResult) {
      return NextResponse.json(
        { error: 'No enrichment data found for the provided contact information' },
        { status: 404 }
      );
    }

    // Merge results
    const pcr = proxycurlResult as ProxycurlProfile | null;
    const cbr = clearbitResult as Record<string, any> | null;
    const enriched = {
      fullName: pcr?.fullName || cbr?.fullName || '',
      email: cbr?.email || email || null,
      linkedinUrl: linkedinUrl || cbr?.linkedin || null,
      title: cbr?.title || pcr?.headline || null,
      seniority: cbr?.seniority || null,
      company: cbr?.company || pcr?.experiences?.[0]?.company || null,
      location: pcr?.location || cbr?.location || null,
      bio: pcr?.summary || cbr?.bio || null,
      avatarUrl: cbr?.avatar || null,
      twitterHandle: cbr?.twitter || null,
      careerHistory: pcr?.experiences ?? [],
      education: pcr?.education ?? [],
      skills: pcr?.skills ?? [],
      connections: pcr?.connections ?? null,
      sources: {
        proxycurl: !!pcr,
        clearbit: !!cbr,
      },
    };

    return NextResponse.json({
      enriched,
      creditsConsumed: 1,
      enrichedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Enrichment/Contact] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
