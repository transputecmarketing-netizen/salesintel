// --- Credit Costs ---
export const CREDIT_COSTS = {
  standard_research: 10,
  deep_research: 25,
  ai_outreach_generation: 2,
  ai_outreach_regeneration: 1,
  contact_enrichment: 3,
  company_enrichment: 5,
  tech_stack_detection: 3,
  funding_lookup: 2,
  linkedin_enrichment: 5,
  sec_filing_search: 2,
  financial_data: 2,
  job_analysis: 3,
  signal_classification: 1,
  watchlist_monitoring_daily: 1,
  graph_build: 5,
  export_report: 2,
} as const;

// --- Tier Names ---
export const TIER_NAMES = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
  enterprise: 'Enterprise',
} as const;

// --- Signal Types ---
export const SIGNAL_TYPE_LABELS: Record<string, string> = {
  funding: 'Funding',
  hiring: 'Hiring',
  expansion: 'Expansion',
  leadership: 'Leadership',
  technology: 'Technology',
  financial: 'Financial',
  competitive: 'Competitive',
  tender: 'Tender / RFP',
  product_launch: 'Product Launch',
  partnership: 'Partnership',
  earnings: 'Earnings',
  social: 'Social',
};

export const SIGNAL_TYPE_ICONS: Record<string, string> = {
  funding: 'DollarSign',
  hiring: 'Users',
  expansion: 'Globe',
  leadership: 'UserCog',
  technology: 'Cpu',
  financial: 'TrendingUp',
  competitive: 'Swords',
  tender: 'FileText',
  product_launch: 'Rocket',
  partnership: 'Handshake',
  earnings: 'BarChart',
  social: 'MessageCircle',
};

// --- Severity Levels ---
export const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low', 'info'] as const;

export const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Informational',
};

// --- Seniority Levels ---
export const SENIORITY_LEVELS = ['c_suite', 'vp', 'director', 'manager', 'individual'] as const;

export const SENIORITY_LABELS: Record<string, string> = {
  c_suite: 'C-Suite',
  vp: 'VP',
  director: 'Director',
  manager: 'Manager',
  individual: 'Individual Contributor',
};

// --- Role Types ---
export const ROLE_TYPE_LABELS: Record<string, string> = {
  economic_buyer: 'Economic Buyer',
  technical_evaluator: 'Technical Evaluator',
  champion: 'Champion',
  blocker: 'Blocker',
  influencer: 'Influencer',
};

// --- Research Steps ---
export const RESEARCH_PHASE_LABELS: Record<number, string> = {
  1: 'Data Collection',
  2: 'Analysis',
  3: 'Scoring & Modeling',
  4: 'Output Generation',
};

// --- API Rate Limits ---
export const API_RATE_LIMITS = {
  default: { maxRequests: 60, windowMs: 60_000 },
  research: { maxRequests: 5, windowMs: 3_600_000 },
  outreach: { maxRequests: 20, windowMs: 3_600_000 },
  enrichment: { maxRequests: 30, windowMs: 60_000 },
  search: { maxRequests: 30, windowMs: 60_000 },
} as const;

// --- Pagination ---
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// --- Monitoring ---
export const MONITORING_INTERVALS = {
  high_priority: '0 * * * *',      // Every hour
  standard: '0 6 * * *',           // Daily at 6 AM UTC
  digest: '0 7 * * *',             // Daily at 7 AM UTC
  cleanup: '0 3 * * 0',            // Weekly Sunday 3 AM UTC
} as const;

// --- External API URLs ---
export const API_URLS = {
  apollo: 'https://api.apollo.io/v1',
  clearbit: 'https://company.clearbit.com/v2',
  crunchbase: 'https://api.crunchbase.com/api/v4',
  builtwith: 'https://api.builtwith.com/v21/api.json',
  proxycurl: 'https://nubela.co/proxycurl/api',
  secEdgar: 'https://efts.sec.gov/LATEST',
  yahooFinance: 'https://query2.finance.yahoo.com',
  greenhouse: 'https://boards-api.greenhouse.io/v1',
  lever: 'https://api.lever.co/v0',
  groq: 'https://api.groq.com/openai/v1',
  stripe: 'https://api.stripe.com/v1',
  qstash: 'https://qstash.upstash.io/v2',
} as const;

// --- Cache TTLs (in seconds) ---
export const CACHE_TTL = {
  companyEnrichment: 86_400,        // 24 hours
  contactEnrichment: 43_200,        // 12 hours
  techStack: 604_800,               // 7 days
  fundingHistory: 86_400,           // 24 hours
  jobPostings: 21_600,              // 6 hours
  stockQuote: 300,                  // 5 minutes
  financialMetrics: 3_600,          // 1 hour
  secFilings: 86_400,               // 24 hours
  signalClassification: 3_600,      // 1 hour
  researchResult: 86_400,           // 24 hours
} as const;

// --- Feature Flags ---
export const FEATURES = {
  DEEP_RESEARCH: 'deep_research',
  AI_OUTREACH: 'ai_outreach',
  BUYING_WINDOW: 'buying_window',
  CONVERGENCE: 'convergence',
  INTELLIGENCE_GRAPH: 'intelligence_graph',
  MONITORING: 'monitoring',
  TEAM_COLLABORATION: 'team_collaboration',
  CRM_INTEGRATION: 'crm_integration',
} as const;

// --- App Metadata ---
export const APP_NAME = 'SalesIntel';
export const APP_DESCRIPTION = 'AI-powered sales intelligence platform';
export const APP_VERSION = '1.0.0';
