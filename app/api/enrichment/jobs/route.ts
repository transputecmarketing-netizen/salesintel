import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface JobPosting {
  title: string;
  department: string;
  location: string;
  seniority: string;
  postedDate: string;
  url: string;
  techMentions: string[];
  budgetSignals: string[];
}

interface JobAnalysis {
  totalOpenings: number;
  byDepartment: Record<string, number>;
  bySeniority: Record<string, number>;
  techMentions: Record<string, number>;
  growthSignals: string[];
  budgetSignals: string[];
  hiringVelocity: 'aggressive' | 'moderate' | 'slow' | 'unknown';
}

async function fetchJobPostings(companyName: string, domain?: string): Promise<JobPosting[]> {
  // In production: scrape job boards (LinkedIn, Greenhouse, Lever, etc.)
  // or use APIs like Theirstack, Otta, or Glassdoor
  const apiKey = process.env.JOB_SCRAPER_API_KEY;

  if (apiKey && domain) {
    try {
      // Example API call to a job posting aggregator
      const res = await fetch(
        `https://api.theirstack.com/v1/jobs/search?company_domain=${encodeURIComponent(domain)}&limit=50`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        return (data.jobs ?? []).map((job: Record<string, unknown>) => ({
          title: (job.title as string) ?? '',
          department: (job.department as string) ?? 'Unknown',
          location: (job.location as string) ?? 'Remote',
          seniority: inferSeniority((job.title as string) ?? ''),
          postedDate: (job.posted_at as string) ?? new Date().toISOString(),
          url: (job.url as string) ?? '',
          techMentions: extractTechMentions((job.description as string) ?? ''),
          budgetSignals: extractBudgetSignals((job.description as string) ?? ''),
        }));
      }
    } catch (err) {
      console.error('[Jobs] API fetch failed:', err);
    }
  }

  // Fallback: return empty (in development) or cached results
  void companyName; // used when API is available
  return [];
}

function inferSeniority(title: string): string {
  const lower = title.toLowerCase();
  if (/\b(chief|c-level|ceo|cto|cfo|coo|ciso)\b/.test(lower)) return 'c_suite';
  if (/\b(vp|vice president)\b/.test(lower)) return 'vp';
  if (/\bdirector\b/.test(lower)) return 'director';
  if (/\b(manager|lead|head)\b/.test(lower)) return 'manager';
  if (/\bsenior\b/.test(lower)) return 'senior';
  if (/\bjunior\b/.test(lower)) return 'junior';
  return 'individual';
}

function extractTechMentions(description: string): string[] {
  const techTerms = [
    'kubernetes', 'docker', 'aws', 'gcp', 'azure', 'terraform',
    'react', 'typescript', 'python', 'java', 'golang', 'rust',
    'postgresql', 'mongodb', 'redis', 'kafka', 'elasticsearch',
    'datadog', 'snowflake', 'databricks', 'salesforce', 'hubspot',
  ];
  const lower = description.toLowerCase();
  return techTerms.filter((term) => lower.includes(term));
}

function extractBudgetSignals(description: string): string[] {
  const signals: string[] = [];
  const lower = description.toLowerCase();

  if (/new team|building.*team|founding.*team/i.test(lower)) {
    signals.push('Building new team (greenfield budget)');
  }
  if (/enterprise|scale|growth/i.test(lower)) {
    signals.push('Growth-focused role (expansion budget)');
  }
  if (/replace|migration|moderniz/i.test(lower)) {
    signals.push('Replacement/modernization project');
  }
  if (/evaluate|assess|select.*vendor/i.test(lower)) {
    signals.push('Active vendor evaluation');
  }

  return signals;
}

function analyzeJobPostings(postings: JobPosting[]): JobAnalysis {
  const byDepartment: Record<string, number> = {};
  const bySeniority: Record<string, number> = {};
  const techCounts: Record<string, number> = {};
  const allBudgetSignals: string[] = [];

  for (const job of postings) {
    byDepartment[job.department] = (byDepartment[job.department] || 0) + 1;
    bySeniority[job.seniority] = (bySeniority[job.seniority] || 0) + 1;

    for (const tech of job.techMentions) {
      techCounts[tech] = (techCounts[tech] || 0) + 1;
    }

    allBudgetSignals.push(...job.budgetSignals);
  }

  const growthSignals: string[] = [];
  if (postings.length > 20) growthSignals.push('High volume of open positions indicates rapid growth');
  if ((bySeniority['c_suite'] || 0) + (bySeniority['vp'] || 0) > 3) {
    growthSignals.push('Multiple senior leadership hires signal strategic changes');
  }
  if ((byDepartment['Engineering'] || 0) > 10) {
    growthSignals.push('Large engineering hiring suggests product investment');
  }

  let hiringVelocity: JobAnalysis['hiringVelocity'] = 'unknown';
  if (postings.length > 30) hiringVelocity = 'aggressive';
  else if (postings.length > 10) hiringVelocity = 'moderate';
  else if (postings.length > 0) hiringVelocity = 'slow';

  return {
    totalOpenings: postings.length,
    byDepartment,
    bySeniority,
    techMentions: techCounts,
    growthSignals,
    budgetSignals: [...new Set(allBudgetSignals)],
    hiringVelocity,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyName, domain } = body as {
      companyName?: string;
      domain?: string;
    };

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return NextResponse.json(
        { error: 'companyName is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (domain !== undefined && typeof domain !== 'string') {
      return NextResponse.json({ error: 'domain must be a string if provided' }, { status: 400 });
    }

    const postings = await fetchJobPostings(companyName.trim(), domain?.trim());
    const analysis = analyzeJobPostings(postings);

    return NextResponse.json({
      companyName: companyName.trim(),
      domain: domain?.trim() ?? null,
      postings,
      analysis,
      creditsConsumed: 1,
      enrichedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Enrichment/Jobs] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
