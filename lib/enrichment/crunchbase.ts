export interface FundingRound {
  roundType: string;
  amount: number | null;
  currency: string;
  announcedDate: string;
  closedDate: string | null;
  investors: Investor[];
  leadInvestors: string[];
  preMoneyValuation: number | null;
  postMoneyValuation: number | null;
}

export interface Investor {
  name: string;
  type: 'organization' | 'person';
  isLead: boolean;
  partnerName: string | null;
}

export interface Acquisition {
  acquiredCompany: string;
  acquiredDate: string;
  price: number | null;
  currency: string;
  terms: string | null;
}

export interface CrunchbaseCompanyResult {
  name: string;
  shortDescription: string;
  foundedDate: string | null;
  ipoStatus: 'private' | 'public' | 'delisted';
  totalFundingUsd: number | null;
  lastFundingType: string | null;
  lastFundingDate: string | null;
  numFundingRounds: number;
  fundingRounds: FundingRound[];
  acquisitions: Acquisition[];
  numEmployeesEnum: string | null;
  categories: string[];
  headquartersLocation: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
}

const CRUNCHBASE_BASE_URL = 'https://api.crunchbase.com/api/v4';

function getApiKey(): string {
  const key = process.env.CRUNCHBASE_API_KEY;
  if (!key) throw new Error('CRUNCHBASE_API_KEY is not configured');
  return key;
}

async function crunchbaseFetch<T>(path: string, params?: Record<string, string>): Promise<T | null> {
  try {
    const url = new URL(`${CRUNCHBASE_BASE_URL}${path}`);
    url.searchParams.set('user_key', getApiKey());

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.status === 404) return null;

    if (!res.ok) {
      console.error(`[Crunchbase] ${path} returned ${res.status}: ${res.statusText}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error(`[Crunchbase] Request to ${path} failed:`, err);
    return null;
  }
}

interface CrunchbaseOrgResponse {
  properties?: {
    name?: string;
    short_description?: string;
    founded_on?: string;
    ipo_status?: string;
    funding_total?: { value_usd?: number };
    last_funding_type?: string;
    last_funding_at?: string;
    num_funding_rounds?: number;
    num_employees_enum?: string;
    categories?: Array<{ value?: string }>;
    headquarters_location?: { value?: string };
    website_url?: string;
    linkedin?: { value?: string };
  };
  cards?: {
    funding_rounds?: Array<{
      identifier?: { value?: string };
      money_raised?: { value_usd?: number; currency?: string };
      announced_on?: string;
      closed_on?: string;
      pre_money_valuation?: { value_usd?: number };
      post_money_valuation?: { value_usd?: number };
      lead_investor_identifiers?: Array<{ value?: string }>;
      investor_identifiers?: Array<{
        value?: string;
        entity_def_id?: string;
        role?: string;
      }>;
    }>;
    acquisitions?: Array<{
      acquiree_identifier?: { value?: string };
      announced_on?: string;
      price?: { value_usd?: number; currency?: string };
      acquisition_terms?: string;
    }>;
  };
}

export async function getCompany(companyName: string): Promise<CrunchbaseCompanyResult | null> {
  const permalink = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const data = await crunchbaseFetch<CrunchbaseOrgResponse>(
    `/entities/organizations/${encodeURIComponent(permalink)}`,
    { card_ids: 'funding_rounds,acquisitions' }
  );

  if (!data?.properties) return null;

  const props = data.properties;
  const cards = data.cards;

  const fundingRounds: FundingRound[] = (cards?.funding_rounds ?? []).map((fr) => ({
    roundType: fr.identifier?.value ?? 'unknown',
    amount: fr.money_raised?.value_usd ?? null,
    currency: fr.money_raised?.currency ?? 'USD',
    announcedDate: fr.announced_on ?? '',
    closedDate: fr.closed_on ?? null,
    investors: (fr.investor_identifiers ?? []).map((inv) => ({
      name: inv.value ?? '',
      type: (inv.entity_def_id === 'person' ? 'person' : 'organization') as 'organization' | 'person',
      isLead: (fr.lead_investor_identifiers ?? []).some((li) => li.value === inv.value),
      partnerName: null,
    })),
    leadInvestors: (fr.lead_investor_identifiers ?? []).map((li) => li.value ?? ''),
    preMoneyValuation: fr.pre_money_valuation?.value_usd ?? null,
    postMoneyValuation: fr.post_money_valuation?.value_usd ?? null,
  }));

  const acquisitions: Acquisition[] = (cards?.acquisitions ?? []).map((acq) => ({
    acquiredCompany: acq.acquiree_identifier?.value ?? '',
    acquiredDate: acq.announced_on ?? '',
    price: acq.price?.value_usd ?? null,
    currency: acq.price?.currency ?? 'USD',
    terms: acq.acquisition_terms ?? null,
  }));

  const ipoStatus = (props.ipo_status ?? 'private') as CrunchbaseCompanyResult['ipoStatus'];

  return {
    name: props.name ?? companyName,
    shortDescription: props.short_description ?? '',
    foundedDate: props.founded_on ?? null,
    ipoStatus: ['private', 'public', 'delisted'].includes(ipoStatus) ? ipoStatus : 'private',
    totalFundingUsd: props.funding_total?.value_usd ?? null,
    lastFundingType: props.last_funding_type ?? null,
    lastFundingDate: props.last_funding_at ?? null,
    numFundingRounds: props.num_funding_rounds ?? 0,
    fundingRounds,
    acquisitions,
    numEmployeesEnum: props.num_employees_enum ?? null,
    categories: (props.categories ?? []).map((c) => c.value ?? '').filter(Boolean),
    headquartersLocation: props.headquarters_location?.value ?? null,
    websiteUrl: props.website_url ?? null,
    linkedinUrl: props.linkedin?.value ?? null,
  };
}

export async function getFundingHistory(companyName: string): Promise<FundingRound[]> {
  const company = await getCompany(companyName);
  return company?.fundingRounds ?? [];
}

export async function getAcquisitions(companyName: string): Promise<Acquisition[]> {
  const company = await getCompany(companyName);
  return company?.acquisitions ?? [];
}
