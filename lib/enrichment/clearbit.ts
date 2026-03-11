export interface ClearbitCompanyResult {
  name: string;
  domain: string;
  logo: string;
  description: string;
  category: {
    sector: string;
    industryGroup: string;
    industry: string;
    subIndustry: string;
  };
  metrics: {
    raised: number | null;
    alexaUsRank: number | null;
    alexaGlobalRank: number | null;
    employees: number | null;
    employeesRange: string | null;
    marketCap: number | null;
    annualRevenue: number | null;
    estimatedAnnualRevenue: string | null;
    fiscalYearEnd: number | null;
  };
  tags: string[];
  tech: string[];
  geo: {
    streetNumber: string | null;
    streetName: string | null;
    city: string | null;
    state: string | null;
    stateCode: string | null;
    postalCode: string | null;
    country: string | null;
    countryCode: string | null;
  };
  foundedYear: number | null;
  socialLinks: {
    linkedin: string | null;
    twitter: string | null;
    facebook: string | null;
    crunchbase: string | null;
  };
}

const CLEARBIT_BASE_URL = 'https://company.clearbit.com/v2';

function getApiKey(): string {
  const key = process.env.CLEARBIT_API_KEY;
  if (!key) throw new Error('CLEARBIT_API_KEY is not configured');
  return key;
}

export async function enrichCompany(domain: string): Promise<ClearbitCompanyResult | null> {
  try {
    const res = await fetch(`${CLEARBIT_BASE_URL}/companies/find?domain=${encodeURIComponent(domain)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      console.error(`[Clearbit] Company enrichment returned ${res.status}: ${res.statusText}`);
      return null;
    }

    const data = await res.json();

    return {
      name: data.name ?? '',
      domain: data.domain ?? domain,
      logo: data.logo ?? '',
      description: data.description ?? '',
      category: {
        sector: data.category?.sector ?? '',
        industryGroup: data.category?.industryGroup ?? '',
        industry: data.category?.industry ?? '',
        subIndustry: data.category?.subIndustry ?? '',
      },
      metrics: {
        raised: data.metrics?.raised ?? null,
        alexaUsRank: data.metrics?.alexaUsRank ?? null,
        alexaGlobalRank: data.metrics?.alexaGlobalRank ?? null,
        employees: data.metrics?.employees ?? null,
        employeesRange: data.metrics?.employeesRange ?? null,
        marketCap: data.metrics?.marketCap ?? null,
        annualRevenue: data.metrics?.annualRevenue ?? null,
        estimatedAnnualRevenue: data.metrics?.estimatedAnnualRevenue ?? null,
        fiscalYearEnd: data.metrics?.fiscalYearEnd ?? null,
      },
      tags: data.tags ?? [],
      tech: data.tech ?? [],
      geo: {
        streetNumber: data.geo?.streetNumber ?? null,
        streetName: data.geo?.streetName ?? null,
        city: data.geo?.city ?? null,
        state: data.geo?.state ?? null,
        stateCode: data.geo?.stateCode ?? null,
        postalCode: data.geo?.postalCode ?? null,
        country: data.geo?.country ?? null,
        countryCode: data.geo?.countryCode ?? null,
      },
      foundedYear: data.foundedYear ?? null,
      socialLinks: {
        linkedin: data.linkedin?.handle ? `https://linkedin.com/company/${data.linkedin.handle}` : null,
        twitter: data.twitter?.handle ? `https://twitter.com/${data.twitter.handle}` : null,
        facebook: data.facebook?.handle ? `https://facebook.com/${data.facebook.handle}` : null,
        crunchbase: data.crunchbase?.handle ? `https://crunchbase.com/organization/${data.crunchbase.handle}` : null,
      },
    };
  } catch (err) {
    console.error('[Clearbit] Company enrichment failed:', err);
    return null;
  }
}

export async function getCompanyLogo(domain: string): Promise<string | null> {
  try {
    const logoUrl = `https://logo.clearbit.com/${encodeURIComponent(domain)}`;
    const res = await fetch(logoUrl, { method: 'HEAD' });
    return res.ok ? logoUrl : null;
  } catch {
    return null;
  }
}

export interface ClearbitPersonResult {
  fullName: string;
  email: string;
  title: string;
  seniority: string;
  role: string;
  company: string;
  avatar: string | null;
  bio: string | null;
  linkedin: string | null;
  twitter: string | null;
  location: string | null;
}

export async function enrichPerson(email: string): Promise<ClearbitPersonResult | null> {
  try {
    const res = await fetch(
      `https://person.clearbit.com/v2/people/find?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (res.status === 404) return null;

    if (!res.ok) {
      console.error(`[Clearbit] Person enrichment returned ${res.status}: ${res.statusText}`);
      return null;
    }

    const data = await res.json();

    return {
      fullName: data.name?.fullName ?? '',
      email: data.email ?? email,
      title: data.employment?.title ?? '',
      seniority: data.employment?.seniority ?? '',
      role: data.employment?.role ?? '',
      company: data.employment?.name ?? '',
      avatar: data.avatar ?? null,
      bio: data.bio ?? null,
      linkedin: data.linkedin?.handle ? `https://linkedin.com/in/${data.linkedin.handle}` : null,
      twitter: data.twitter?.handle ? `https://twitter.com/${data.twitter.handle}` : null,
      location: data.geo?.city ? `${data.geo.city}, ${data.geo.state ?? data.geo.country ?? ''}`.trim() : null,
    };
  } catch (err) {
    console.error('[Clearbit] Person enrichment failed:', err);
    return null;
  }
}
