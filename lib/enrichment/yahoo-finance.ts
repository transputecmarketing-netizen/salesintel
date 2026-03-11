export interface StockQuote {
  symbol: string;
  shortName: string;
  longName: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap: number;
  trailingPE: number | null;
  forwardPE: number | null;
  dividendYield: number | null;
  exchange: string;
}

export interface FinancialMetrics {
  symbol: string;
  marketCap: number | null;
  enterpriseValue: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  profitMargin: number | null;
  operatingMargin: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  totalRevenue: number | null;
  grossProfit: number | null;
  ebitda: number | null;
  netIncome: number | null;
  totalDebt: number | null;
  totalCash: number | null;
  freeCashflow: number | null;
  operatingCashflow: number | null;
  beta: number | null;
}

export interface EarningsData {
  symbol: string;
  earningsDate: string | null;
  earningsCallDate: string | null;
  epsEstimate: number | null;
  epsActual: number | null;
  epsSurprise: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  revenueSurprise: number | null;
  quarterlyEarnings: QuarterlyEarning[];
}

export interface QuarterlyEarning {
  quarter: string;
  date: string;
  epsEstimate: number | null;
  epsActual: number | null;
  epsSurprise: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
}

// Yahoo Finance v8 API (unofficial but widely used)
const YF_BASE_URL = 'https://query2.finance.yahoo.com';

async function yahooFetch<T>(path: string): Promise<T | null> {
  try {
    const url = `${YF_BASE_URL}${path}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SalesIntel/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`[YahooFinance] ${path} returned ${res.status}: ${res.statusText}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error(`[YahooFinance] Request to ${path} failed:`, err);
    return null;
  }
}

interface YFQuoteResponse {
  quoteResponse?: {
    result?: Array<{
      symbol?: string;
      shortName?: string;
      longName?: string;
      currency?: string;
      regularMarketPrice?: number;
      regularMarketChange?: number;
      regularMarketChangePercent?: number;
      regularMarketPreviousClose?: number;
      regularMarketOpen?: number;
      regularMarketDayHigh?: number;
      regularMarketDayLow?: number;
      regularMarketVolume?: number;
      fiftyTwoWeekHigh?: number;
      fiftyTwoWeekLow?: number;
      marketCap?: number;
      trailingPE?: number;
      forwardPE?: number;
      dividendYield?: number;
      fullExchangeName?: string;
    }>;
  };
}

export async function getQuote(symbol: string): Promise<StockQuote | null> {
  const data = await yahooFetch<YFQuoteResponse>(
    `/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`
  );

  const quote = data?.quoteResponse?.result?.[0];
  if (!quote) return null;

  return {
    symbol: quote.symbol ?? symbol,
    shortName: quote.shortName ?? '',
    longName: quote.longName ?? '',
    currency: quote.currency ?? 'USD',
    regularMarketPrice: quote.regularMarketPrice ?? 0,
    regularMarketChange: quote.regularMarketChange ?? 0,
    regularMarketChangePercent: quote.regularMarketChangePercent ?? 0,
    regularMarketPreviousClose: quote.regularMarketPreviousClose ?? 0,
    regularMarketOpen: quote.regularMarketOpen ?? 0,
    regularMarketDayHigh: quote.regularMarketDayHigh ?? 0,
    regularMarketDayLow: quote.regularMarketDayLow ?? 0,
    regularMarketVolume: quote.regularMarketVolume ?? 0,
    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? 0,
    marketCap: quote.marketCap ?? 0,
    trailingPE: quote.trailingPE ?? null,
    forwardPE: quote.forwardPE ?? null,
    dividendYield: quote.dividendYield ?? null,
    exchange: quote.fullExchangeName ?? '',
  };
}

interface YFQuoteSummaryResponse {
  quoteSummary?: {
    result?: Array<{
      financialData?: {
        currentPrice?: { raw?: number };
        totalRevenue?: { raw?: number };
        grossProfits?: { raw?: number };
        ebitda?: { raw?: number };
        netIncomeToCommon?: { raw?: number };
        totalDebt?: { raw?: number };
        totalCash?: { raw?: number };
        freeCashflow?: { raw?: number };
        operatingCashflow?: { raw?: number };
        profitMargins?: { raw?: number };
        operatingMargins?: { raw?: number };
        returnOnEquity?: { raw?: number };
        returnOnAssets?: { raw?: number };
        revenueGrowth?: { raw?: number };
        earningsGrowth?: { raw?: number };
      };
      defaultKeyStatistics?: {
        enterpriseValue?: { raw?: number };
        trailingPE?: { raw?: number };
        forwardPE?: { raw?: number };
        pegRatio?: { raw?: number };
        priceToBook?: { raw?: number };
        priceToSalesTrailing12Months?: { raw?: number };
        beta?: { raw?: number };
      };
      summaryDetail?: {
        marketCap?: { raw?: number };
      };
    }>;
  };
}

export async function getFinancialMetrics(symbol: string): Promise<FinancialMetrics | null> {
  const data = await yahooFetch<YFQuoteSummaryResponse>(
    `/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=financialData,defaultKeyStatistics,summaryDetail`
  );

  const result = data?.quoteSummary?.result?.[0];
  if (!result) return null;

  const fd = result.financialData;
  const ks = result.defaultKeyStatistics;
  const sd = result.summaryDetail;

  return {
    symbol,
    marketCap: sd?.marketCap?.raw ?? null,
    enterpriseValue: ks?.enterpriseValue?.raw ?? null,
    trailingPE: ks?.trailingPE?.raw ?? null,
    forwardPE: ks?.forwardPE?.raw ?? null,
    pegRatio: ks?.pegRatio?.raw ?? null,
    priceToBook: ks?.priceToBook?.raw ?? null,
    priceToSales: ks?.priceToSalesTrailing12Months?.raw ?? null,
    profitMargin: fd?.profitMargins?.raw ?? null,
    operatingMargin: fd?.operatingMargins?.raw ?? null,
    returnOnEquity: fd?.returnOnEquity?.raw ?? null,
    returnOnAssets: fd?.returnOnAssets?.raw ?? null,
    revenueGrowth: fd?.revenueGrowth?.raw ?? null,
    earningsGrowth: fd?.earningsGrowth?.raw ?? null,
    totalRevenue: fd?.totalRevenue?.raw ?? null,
    grossProfit: fd?.grossProfits?.raw ?? null,
    ebitda: fd?.ebitda?.raw ?? null,
    netIncome: fd?.netIncomeToCommon?.raw ?? null,
    totalDebt: fd?.totalDebt?.raw ?? null,
    totalCash: fd?.totalCash?.raw ?? null,
    freeCashflow: fd?.freeCashflow?.raw ?? null,
    operatingCashflow: fd?.operatingCashflow?.raw ?? null,
    beta: ks?.beta?.raw ?? null,
  };
}

interface YFEarningsResponse {
  quoteSummary?: {
    result?: Array<{
      earnings?: {
        earningsChart?: {
          quarterly?: Array<{
            date?: string;
            actual?: { raw?: number };
            estimate?: { raw?: number };
          }>;
          earningsDate?: Array<{ raw?: number }>;
        };
        financialsChart?: {
          quarterly?: Array<{
            date?: string;
            revenue?: { raw?: number };
            earnings?: { raw?: number };
          }>;
        };
      };
      calendarEvents?: {
        earnings?: {
          earningsDate?: Array<{ raw?: number }>;
          earningsCallDate?: Array<{ raw?: number }>;
          revenueEstimate?: { avg?: { raw?: number } };
          earningsEstimate?: { avg?: { raw?: number } };
        };
      };
    }>;
  };
}

export async function getEarningsData(symbol: string): Promise<EarningsData | null> {
  const data = await yahooFetch<YFEarningsResponse>(
    `/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=earnings,calendarEvents`
  );

  const result = data?.quoteSummary?.result?.[0];
  if (!result) return null;

  const calendar = result.calendarEvents?.earnings;
  const earningsChart = result.earnings?.earningsChart;

  const earningsDateRaw = calendar?.earningsDate?.[0]?.raw;
  const earningsCallDateRaw = calendar?.earningsCallDate?.[0]?.raw;

  const quarterlyEarnings: QuarterlyEarning[] = (earningsChart?.quarterly ?? []).map((q) => ({
    quarter: q.date ?? '',
    date: q.date ?? '',
    epsEstimate: q.estimate?.raw ?? null,
    epsActual: q.actual?.raw ?? null,
    epsSurprise: q.actual?.raw != null && q.estimate?.raw != null
      ? q.actual.raw - q.estimate.raw
      : null,
    revenueEstimate: null,
    revenueActual: null,
  }));

  const latestQuarter = quarterlyEarnings[quarterlyEarnings.length - 1];

  return {
    symbol,
    earningsDate: earningsDateRaw ? new Date(earningsDateRaw * 1000).toISOString() : null,
    earningsCallDate: earningsCallDateRaw ? new Date(earningsCallDateRaw * 1000).toISOString() : null,
    epsEstimate: calendar?.earningsEstimate?.avg?.raw ?? null,
    epsActual: latestQuarter?.epsActual ?? null,
    epsSurprise: latestQuarter?.epsSurprise ?? null,
    revenueEstimate: calendar?.revenueEstimate?.avg?.raw ?? null,
    revenueActual: null,
    revenueSurprise: null,
    quarterlyEarnings,
  };
}

export async function searchSymbol(companyName: string): Promise<string | null> {
  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(companyName)}&quotesCount=1&newsCount=0`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SalesIntel/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) return null;

    const data = await res.json() as { quotes?: Array<{ symbol?: string }> };
    return data.quotes?.[0]?.symbol ?? null;
  } catch {
    return null;
  }
}
