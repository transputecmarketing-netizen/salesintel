export interface ResearchStepDefinition {
  id: string;
  label: string;
  phase: number;
  deepOnly?: boolean;
}

export const RESEARCH_STEPS = {
  // Phase 1: Data Collection (parallel)
  COMPANY_ENRICHMENT: { id: 'company_enrichment', label: 'Company Enrichment', phase: 1 },
  CONTACT_LOOKUP: { id: 'contact_lookup', label: 'Contact Lookup', phase: 1 },
  NEWS_SEARCH: { id: 'news_search', label: 'News Analysis', phase: 1 },
  JOB_POSTINGS: { id: 'job_postings', label: 'Job Postings', phase: 1 },
  TECH_STACK: { id: 'tech_stack', label: 'Tech Stack Detection', phase: 1 },
  FUNDING_HISTORY: { id: 'funding_history', label: 'Funding History', phase: 1 },

  // Phase 2: Analysis (parallel, depends on phase 1)
  SIGNAL_CLASSIFICATION: { id: 'signal_classification', label: 'Signal Classification', phase: 2 },
  ORG_CHART: { id: 'org_chart', label: 'Org Chart Construction', phase: 2 },
  COMPETITOR_ID: { id: 'competitor_id', label: 'Competitor Identification', phase: 2 },
  JOB_INTENT: { id: 'job_intent', label: 'Job Intent Analysis', phase: 2 },
  FINANCIAL_DATA: { id: 'financial_data', label: 'Financial Analysis', phase: 2 },
  ENTITY_EXTRACTION: { id: 'entity_extraction', label: 'Entity Extraction', phase: 2 },

  // Phase 3: Scoring & Modeling (parallel, depends on phase 2)
  INTELLIGENCE_GRAPH: { id: 'intelligence_graph', label: 'Intelligence Graph', phase: 3 },
  HEALTH_SCORE: { id: 'health_score', label: 'Account Health Score', phase: 3 },
  PROPENSITY: { id: 'propensity', label: 'Propensity to Buy', phase: 3 },
  BUYING_WINDOW: { id: 'buying_window', label: 'Buying Window', phase: 3 },
  LIFECYCLE: { id: 'lifecycle', label: 'Lifecycle Stage', phase: 3 },
  CONVERGENCE: { id: 'convergence', label: 'Convergence Detection', phase: 3 },

  // Phase 4: Output Generation (sequential, depends on phase 3)
  WHY_NOW: { id: 'why_now', label: 'Why Now Narrative', phase: 4 },
  POWER_MAP: { id: 'power_map', label: 'C-Level Power Map', phase: 4 },
  OUTREACH: { id: 'outreach', label: 'Outreach Generation', phase: 4 },
  OBJECTIONS: { id: 'objections', label: 'Objection Predictions', phase: 4 },
  ENGAGEMENT: { id: 'engagement', label: 'Engagement Sequence', phase: 4 },
} as const;

export const DEEP_RESEARCH_STEPS = {
  EARNINGS_ANALYSIS: { id: 'earnings_analysis', label: 'Earnings Call Analysis', phase: 1, deepOnly: true },
  PATENT_SEARCH: { id: 'patent_search', label: 'Patent Search', phase: 1, deepOnly: true },
  GLASSDOOR_SENTIMENT: { id: 'glassdoor_sentiment', label: 'Employee Sentiment', phase: 2, deepOnly: true },
  EXTENDED_SOCIAL: { id: 'extended_social', label: 'Extended Social Analysis', phase: 2, deepOnly: true },
} as const;

export type ResearchStepId = typeof RESEARCH_STEPS[keyof typeof RESEARCH_STEPS]['id'];
export type DeepResearchStepId = typeof DEEP_RESEARCH_STEPS[keyof typeof DEEP_RESEARCH_STEPS]['id'];

export function getStepsForPhase(phase: number, isDeep: boolean = false): ResearchStepDefinition[] {
  const standardSteps = Object.values(RESEARCH_STEPS).filter((s) => s.phase === phase);

  if (!isDeep) return standardSteps;

  const deepSteps = Object.values(DEEP_RESEARCH_STEPS).filter((s) => s.phase === phase);
  return [...standardSteps, ...deepSteps];
}

export function getAllSteps(isDeep: boolean = false): ResearchStepDefinition[] {
  const steps = Object.values(RESEARCH_STEPS) as ResearchStepDefinition[];
  if (!isDeep) return steps;
  return [...steps, ...(Object.values(DEEP_RESEARCH_STEPS) as ResearchStepDefinition[])];
}

export function getTotalPhases(): number {
  return 4;
}
