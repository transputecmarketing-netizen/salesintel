export interface JobPosting {
  title: string;
  department: string | null;
  location: string | null;
  url: string;
  postedAt: string | null;
  source: 'greenhouse' | 'lever';
  description: string | null;
}

export interface JobBuyingSignal {
  signal: string;
  strength: 'strong' | 'moderate' | 'weak';
  evidence: string[];
  category: 'technology_investment' | 'scaling' | 'new_initiative' | 'leadership_change' | 'digital_transformation';
}

export interface JobAnalysisResult {
  totalOpenRoles: number;
  departments: Record<string, number>;
  seniorityDistribution: Record<string, number>;
  buyingSignals: JobBuyingSignal[];
  postings: JobPosting[];
  analysisDate: string;
}

// --- Greenhouse ---

interface GreenhouseJob {
  id: number;
  title: string;
  location?: { name?: string };
  departments?: Array<{ name?: string }>;
  updated_at?: string;
  absolute_url?: string;
  content?: string;
}

async function fetchGreenhouseJobs(boardToken: string): Promise<JobPosting[]> {
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.error(`[Jobs:Greenhouse] Returned ${res.status} for board ${boardToken}`);
      return [];
    }

    const data = await res.json() as { jobs?: GreenhouseJob[] };

    return (data.jobs ?? []).map((job) => ({
      title: job.title ?? '',
      department: job.departments?.[0]?.name ?? null,
      location: job.location?.name ?? null,
      url: job.absolute_url ?? `https://boards.greenhouse.io/${boardToken}/jobs/${job.id}`,
      postedAt: job.updated_at ?? null,
      source: 'greenhouse' as const,
      description: job.content ?? null,
    }));
  } catch (err) {
    console.error('[Jobs:Greenhouse] Failed to fetch:', err);
    return [];
  }
}

// --- Lever ---

interface LeverJob {
  id: string;
  text: string;
  categories?: {
    department?: string;
    location?: string;
    team?: string;
  };
  hostedUrl?: string;
  createdAt?: number;
  descriptionPlain?: string;
}

async function fetchLeverJobs(companySlug: string): Promise<JobPosting[]> {
  try {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(companySlug)}?mode=json`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.error(`[Jobs:Lever] Returned ${res.status} for company ${companySlug}`);
      return [];
    }

    const jobs = await res.json() as LeverJob[];

    return jobs.map((job) => ({
      title: job.text ?? '',
      department: job.categories?.department ?? null,
      location: job.categories?.location ?? null,
      url: job.hostedUrl ?? `https://jobs.lever.co/${companySlug}/${job.id}`,
      postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
      source: 'lever' as const,
      description: job.descriptionPlain ?? null,
    }));
  } catch (err) {
    console.error('[Jobs:Lever] Failed to fetch:', err);
    return [];
  }
}

export async function getJobPostings(
  companySlug: string,
  options?: { greenhouse?: boolean; lever?: boolean }
): Promise<JobPosting[]> {
  const checkGreenhouse = options?.greenhouse !== false;
  const checkLever = options?.lever !== false;

  const promises: Promise<JobPosting[]>[] = [];

  if (checkGreenhouse) {
    promises.push(fetchGreenhouseJobs(companySlug));
  }
  if (checkLever) {
    promises.push(fetchLeverJobs(companySlug));
  }

  const results = await Promise.allSettled(promises);
  const allPostings: JobPosting[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allPostings.push(...result.value);
    }
  }

  return allPostings;
}

// --- Buying Signal Analysis ---

const BUYING_SIGNAL_PATTERNS: Array<{
  pattern: RegExp;
  signal: string;
  category: JobBuyingSignal['category'];
  strength: JobBuyingSignal['strength'];
}> = [
  { pattern: /\b(?:salesforce|hubspot|marketo|pardot)\b/i, signal: 'CRM/Marketing automation investment', category: 'technology_investment', strength: 'strong' },
  { pattern: /\b(?:data engineer|data scientist|machine learning|ml engineer|ai engineer)\b/i, signal: 'AI/ML capability building', category: 'technology_investment', strength: 'strong' },
  { pattern: /\b(?:cloud architect|devops|sre|site reliability|platform engineer)\b/i, signal: 'Infrastructure modernization', category: 'digital_transformation', strength: 'strong' },
  { pattern: /\b(?:security engineer|ciso|security architect|devsecops)\b/i, signal: 'Security investment', category: 'technology_investment', strength: 'moderate' },
  { pattern: /\b(?:vp of|head of|director of|chief)\b/i, signal: 'Leadership hiring', category: 'leadership_change', strength: 'moderate' },
  { pattern: /\b(?:sdr|bdr|account executive|sales manager|revenue)\b/i, signal: 'Sales team scaling', category: 'scaling', strength: 'moderate' },
  { pattern: /\b(?:product manager|product designer|ux researcher)\b/i, signal: 'Product investment', category: 'new_initiative', strength: 'moderate' },
  { pattern: /\b(?:international|emea|apac|global expansion)\b/i, signal: 'Geographic expansion', category: 'scaling', strength: 'strong' },
  { pattern: /\b(?:compliance|regulatory|gdpr|sox|hipaa)\b/i, signal: 'Compliance initiative', category: 'new_initiative', strength: 'weak' },
  { pattern: /\b(?:digital transformation|modernization|migration)\b/i, signal: 'Digital transformation', category: 'digital_transformation', strength: 'strong' },
  { pattern: /\b(?:kubernetes|docker|microservices|serverless)\b/i, signal: 'Cloud-native adoption', category: 'digital_transformation', strength: 'moderate' },
  { pattern: /\b(?:integration|api|middleware|etl|data pipeline)\b/i, signal: 'Integration/data pipeline investment', category: 'technology_investment', strength: 'moderate' },
];

export function analyzeJobPostings(postings: JobPosting[]): JobAnalysisResult {
  const departments: Record<string, number> = {};
  const seniorityDistribution: Record<string, number> = {};
  const signalMap = new Map<string, { signal: JobBuyingSignal; evidenceSet: Set<string> }>();

  for (const posting of postings) {
    // Count departments
    const dept = posting.department || 'Unknown';
    departments[dept] = (departments[dept] || 0) + 1;

    // Classify seniority
    const seniority = classifySeniority(posting.title);
    seniorityDistribution[seniority] = (seniorityDistribution[seniority] || 0) + 1;

    // Detect buying signals
    const searchText = `${posting.title} ${posting.description || ''}`;
    for (const pattern of BUYING_SIGNAL_PATTERNS) {
      if (pattern.pattern.test(searchText)) {
        const existing = signalMap.get(pattern.signal);
        if (existing) {
          existing.evidenceSet.add(posting.title);
        } else {
          signalMap.set(pattern.signal, {
            signal: {
              signal: pattern.signal,
              strength: pattern.strength,
              evidence: [],
              category: pattern.category,
            },
            evidenceSet: new Set([posting.title]),
          });
        }
      }
    }
  }

  const buyingSignals: JobBuyingSignal[] = [];
  for (const { signal, evidenceSet } of signalMap.values()) {
    signal.evidence = Array.from(evidenceSet).slice(0, 5);
    // Upgrade strength if multiple roles indicate the same signal
    if (evidenceSet.size >= 3 && signal.strength === 'moderate') {
      signal.strength = 'strong';
    } else if (evidenceSet.size >= 3 && signal.strength === 'weak') {
      signal.strength = 'moderate';
    }
    buyingSignals.push(signal);
  }

  // Sort by strength
  const strengthOrder: Record<string, number> = { strong: 0, moderate: 1, weak: 2 };
  buyingSignals.sort((a, b) => (strengthOrder[a.strength] ?? 3) - (strengthOrder[b.strength] ?? 3));

  return {
    totalOpenRoles: postings.length,
    departments,
    seniorityDistribution,
    buyingSignals,
    postings,
    analysisDate: new Date().toISOString(),
  };
}

function classifySeniority(title: string): string {
  const lower = title.toLowerCase();
  if (/\b(?:chief|c-suite|ceo|cfo|cto|coo|cmo|cro|cio)\b/.test(lower)) return 'c_suite';
  if (/\b(?:vp|vice president|svp|evp)\b/.test(lower)) return 'vp';
  if (/\b(?:director|head of)\b/.test(lower)) return 'director';
  if (/\b(?:manager|lead|principal|staff)\b/.test(lower)) return 'manager';
  if (/\b(?:senior|sr\.?)\b/.test(lower)) return 'senior';
  if (/\b(?:junior|jr\.?|associate|intern|entry)\b/.test(lower)) return 'junior';
  return 'individual';
}
