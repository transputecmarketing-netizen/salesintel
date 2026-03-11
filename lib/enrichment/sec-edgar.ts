export interface SECFiling {
  accessionNumber: string;
  filingType: string;
  filingDate: string;
  primaryDocument: string;
  documentUrl: string;
  description: string;
  companyName: string;
  cik: string;
}

export interface SECCompanyInfo {
  cik: string;
  name: string;
  tickers: string[];
  exchanges: string[];
  sic: string;
  sicDescription: string;
  stateOfIncorporation: string;
  fiscalYearEnd: string;
}

export interface FinancialSignal {
  type: 'executive_change' | 'acquisition' | 'funding_event' | 'restructuring' | 'risk_factor' | 'material_event';
  description: string;
  filingDate: string;
  filingType: string;
  sourceUrl: string;
}

const EDGAR_BASE_URL = 'https://efts.sec.gov/LATEST';
const EDGAR_FILINGS_URL = 'https://www.sec.gov/cgi-bin/browse-edgar';
const EDGAR_FULL_TEXT_URL = 'https://efts.sec.gov/LATEST/search-index';

function getUserAgent(): string {
  return process.env.SEC_EDGAR_USER_AGENT || 'SalesIntel contact@salesintel.app';
}

async function edgarFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': getUserAgent(),
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`[SEC EDGAR] ${url} returned ${res.status}: ${res.statusText}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error(`[SEC EDGAR] Request failed:`, err);
    return null;
  }
}

interface EdgarCompanySearchResponse {
  hits?: {
    hits?: Array<{
      _source?: {
        entity_name?: string;
        entity_id?: string;
        tickers?: string;
        exchanges?: string;
        sic?: string;
        sic_description?: string;
        state_of_incorp?: string;
        fiscal_year_end?: string;
      };
    }>;
  };
}

export async function searchCompany(companyName: string): Promise<SECCompanyInfo | null> {
  const url = `${EDGAR_BASE_URL}/search-index?q=%22${encodeURIComponent(companyName)}%22&dateRange=custom&startdt=2020-01-01&forms=10-K&from=0&size=1`;

  const data = await edgarFetch<EdgarCompanySearchResponse>(url);
  const hit = data?.hits?.hits?.[0]?._source;

  if (!hit) return null;

  return {
    cik: hit.entity_id ?? '',
    name: hit.entity_name ?? companyName,
    tickers: hit.tickers ? hit.tickers.split(',').map((t) => t.trim()) : [],
    exchanges: hit.exchanges ? hit.exchanges.split(',').map((e) => e.trim()) : [],
    sic: hit.sic ?? '',
    sicDescription: hit.sic_description ?? '',
    stateOfIncorporation: hit.state_of_incorp ?? '',
    fiscalYearEnd: hit.fiscal_year_end ?? '',
  };
}

interface EdgarFilingsResponse {
  hits?: {
    hits?: Array<{
      _id?: string;
      _source?: {
        file_date?: string;
        form_type?: string;
        display_names?: string[];
        entity_name?: string;
        entity_id?: string;
        file_description?: string;
      };
    }>;
  };
}

export async function getFilings(
  companyName: string,
  options?: {
    filingTypes?: string[];
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<SECFiling[]> {
  const forms = options?.filingTypes?.join(',') || '8-K,10-K,10-Q,S-1';
  const startDate = options?.startDate || '2023-01-01';
  const endDate = options?.endDate || new Date().toISOString().split('T')[0];
  const limit = options?.limit || 20;

  const url = `${EDGAR_BASE_URL}/search-index?q=%22${encodeURIComponent(companyName)}%22&dateRange=custom&startdt=${startDate}&enddt=${endDate}&forms=${encodeURIComponent(forms)}&from=0&size=${limit}`;

  const data = await edgarFetch<EdgarFilingsResponse>(url);

  if (!data?.hits?.hits) return [];

  return data.hits.hits.map((hit) => {
    const source = hit._source ?? {};
    const accession = hit._id ?? '';
    const accessionClean = accession.replace(/-/g, '');

    return {
      accessionNumber: accession,
      filingType: source.form_type ?? '',
      filingDate: source.file_date ?? '',
      primaryDocument: source.display_names?.[0] ?? '',
      documentUrl: `https://www.sec.gov/Archives/edgar/data/${source.entity_id ?? ''}/${accessionClean}/${source.display_names?.[0] ?? ''}`,
      description: source.file_description ?? '',
      companyName: source.entity_name ?? companyName,
      cik: source.entity_id ?? '',
    };
  });
}

export async function searchFilingsFullText(
  query: string,
  options?: {
    filingTypes?: string[];
    startDate?: string;
    limit?: number;
  }
): Promise<SECFiling[]> {
  return getFilings(query, options);
}

const MATERIAL_EVENT_KEYWORDS: Record<FinancialSignal['type'], string[]> = {
  executive_change: ['appointed', 'resigned', 'terminated', 'new ceo', 'new cfo', 'new cto', 'officer departure', 'officer appointment'],
  acquisition: ['acquisition', 'merger', 'acquired', 'definitive agreement', 'business combination'],
  funding_event: ['offering', 'securities', 'capital raise', 'private placement', 'ipo', 'public offering'],
  restructuring: ['restructuring', 'reorganization', 'layoff', 'workforce reduction', 'cost reduction'],
  risk_factor: ['risk factor', 'going concern', 'material weakness', 'restatement'],
  material_event: ['material event', 'material agreement', 'material definitive agreement'],
};

export function extractFinancialSignals(filings: SECFiling[]): FinancialSignal[] {
  const signals: FinancialSignal[] = [];

  for (const filing of filings) {
    const searchText = `${filing.description} ${filing.filingType}`.toLowerCase();

    for (const [type, keywords] of Object.entries(MATERIAL_EVENT_KEYWORDS) as Array<[FinancialSignal['type'], string[]]>) {
      const matched = keywords.some((kw) => searchText.includes(kw));
      if (matched) {
        signals.push({
          type,
          description: filing.description || `${filing.filingType} filing detected`,
          filingDate: filing.filingDate,
          filingType: filing.filingType,
          sourceUrl: filing.documentUrl,
        });
        break;
      }
    }
  }

  return signals;
}

export async function getRecentMaterialEvents(
  companyName: string,
  lookbackDays: number = 90
): Promise<FinancialSignal[]> {
  const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const filings = await getFilings(companyName, {
    filingTypes: ['8-K', 'S-1', 'SC 13D'],
    startDate,
    limit: 50,
  });

  return extractFinancialSignals(filings);
}
