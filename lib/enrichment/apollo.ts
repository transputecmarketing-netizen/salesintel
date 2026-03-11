export interface ApolloCompanyResult {
  name: string;
  domain: string;
  industry: string;
  employeeCount: string;
  employeeExact: number;
  foundedYear: number;
  hqCity: string;
  hqState: string;
  hqCountry: string;
  description: string;
  logoUrl: string;
  socialLinks: { linkedin: string; twitter: string };
  techStack: string[];
  annualRevenue: string;
}

export interface ApolloContactResult {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  seniority: string;
  department: string;
  linkedinUrl: string;
  phone: string;
  photoUrl: string;
}

const APOLLO_BASE_URL = 'https://api.apollo.io/v1';

function getApiKey(): string {
  const key = process.env.APOLLO_API_KEY;
  if (!key) throw new Error('APOLLO_API_KEY is not configured');
  return key;
}

async function apolloFetch<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${APOLLO_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': getApiKey(),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`[Apollo] ${path} returned ${res.status}: ${res.statusText}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error(`[Apollo] Request to ${path} failed:`, err);
    return null;
  }
}

interface ApolloOrgResponse {
  organization?: {
    name?: string;
    primary_domain?: string;
    industry?: string;
    estimated_num_employees?: number;
    raw_address?: string;
    city?: string;
    state?: string;
    country?: string;
    short_description?: string;
    logo_url?: string;
    linkedin_url?: string;
    twitter_url?: string;
    founded_year?: number;
    technologies?: string[];
    annual_revenue_printed?: string;
  };
}

export async function enrichCompany(domain: string): Promise<ApolloCompanyResult | null> {
  const data = await apolloFetch<ApolloOrgResponse>('/organizations/enrich', {
    domain,
  });

  if (!data?.organization) return null;

  const org = data.organization;

  const employeeExact = org.estimated_num_employees ?? 0;
  let employeeCount = 'Unknown';
  if (employeeExact > 0) {
    if (employeeExact <= 10) employeeCount = '1-10';
    else if (employeeExact <= 50) employeeCount = '11-50';
    else if (employeeExact <= 200) employeeCount = '51-200';
    else if (employeeExact <= 500) employeeCount = '201-500';
    else if (employeeExact <= 1000) employeeCount = '501-1000';
    else if (employeeExact <= 5000) employeeCount = '1001-5000';
    else if (employeeExact <= 10000) employeeCount = '5001-10000';
    else employeeCount = '10000+';
  }

  return {
    name: org.name ?? '',
    domain: org.primary_domain ?? domain,
    industry: org.industry ?? '',
    employeeCount,
    employeeExact,
    foundedYear: org.founded_year ?? 0,
    hqCity: org.city ?? '',
    hqState: org.state ?? '',
    hqCountry: org.country ?? '',
    description: org.short_description ?? '',
    logoUrl: org.logo_url ?? '',
    socialLinks: {
      linkedin: org.linkedin_url ?? '',
      twitter: org.twitter_url ?? '',
    },
    techStack: org.technologies ?? [],
    annualRevenue: org.annual_revenue_printed ?? '',
  };
}

interface ApolloPersonSearchResponse {
  people?: Array<{
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
    title?: string;
    seniority?: string;
    departments?: string[];
    linkedin_url?: string;
    phone_numbers?: Array<{ sanitized_number?: string }>;
    photo_url?: string;
  }>;
}

export async function searchContacts(
  domain: string,
  options?: {
    seniority?: string[];
    department?: string[];
    limit?: number;
  }
): Promise<ApolloContactResult[]> {
  const body: Record<string, unknown> = {
    q_organization_domains: domain,
    page: 1,
    per_page: options?.limit ?? 10,
  };

  if (options?.seniority?.length) {
    body.person_seniorities = options.seniority;
  }

  if (options?.department?.length) {
    body.person_departments = options.department;
  }

  const data = await apolloFetch<ApolloPersonSearchResponse>('/mixed_people/search', body);

  if (!data?.people) return [];

  return data.people.map((p) => ({
    fullName: p.name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
    firstName: p.first_name ?? '',
    lastName: p.last_name ?? '',
    email: p.email ?? '',
    title: p.title ?? '',
    seniority: p.seniority ?? '',
    department: p.departments?.[0] ?? '',
    linkedinUrl: p.linkedin_url ?? '',
    phone: p.phone_numbers?.[0]?.sanitized_number ?? '',
    photoUrl: p.photo_url ?? '',
  }));
}
