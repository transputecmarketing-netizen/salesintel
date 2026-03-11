import type { ResearchStep } from '@/types/research';
import { RESEARCH_STEPS, DEEP_RESEARCH_STEPS, getStepsForPhase, getTotalPhases } from './steps';

export interface ResearchContext {
  companyName: string;
  companyDomain?: string;
  contactEmail?: string;
  contactLinkedinUrl?: string;
  jobId: string;
  jobType: 'standard' | 'deep';
  onStepUpdate: (step: ResearchStep) => void;
}

interface StepExecutionResult {
  stepId: string;
  success: boolean;
  data: unknown;
  error?: string;
}

type PhaseResults = Map<string, StepExecutionResult>;

function createStep(id: string, label: string): ResearchStep {
  return {
    step: id,
    label,
    status: 'pending',
    startedAt: null,
    completedAt: null,
    duration: null,
    resultPreview: null,
    error: null,
  };
}

function markRunning(step: ResearchStep, onUpdate: (s: ResearchStep) => void): ResearchStep {
  const updated: ResearchStep = {
    ...step,
    status: 'running',
    startedAt: new Date().toISOString(),
  };
  onUpdate(updated);
  return updated;
}

function markCompleted(
  step: ResearchStep,
  preview: string | null,
  onUpdate: (s: ResearchStep) => void
): ResearchStep {
  const now = new Date();
  const startedAt = step.startedAt ? new Date(step.startedAt) : now;
  const updated: ResearchStep = {
    ...step,
    status: 'completed',
    completedAt: now.toISOString(),
    duration: now.getTime() - startedAt.getTime(),
    resultPreview: preview,
  };
  onUpdate(updated);
  return updated;
}

function markFailed(
  step: ResearchStep,
  error: string,
  onUpdate: (s: ResearchStep) => void
): ResearchStep {
  const now = new Date();
  const startedAt = step.startedAt ? new Date(step.startedAt) : now;
  const updated: ResearchStep = {
    ...step,
    status: 'failed',
    completedAt: now.toISOString(),
    duration: now.getTime() - startedAt.getTime(),
    error,
  };
  onUpdate(updated);
  return updated;
}

// --- Phase 1 Step Executors ---

async function executeCompanyEnrichment(ctx: ResearchContext): Promise<StepExecutionResult> {
  try {
    const { enrichCompany } = await import('@/lib/enrichment/apollo');
    const domain = ctx.companyDomain ?? ctx.companyName.toLowerCase().replace(/\s+/g, '') + '.com';
    const result = await enrichCompany(domain);
    return { stepId: RESEARCH_STEPS.COMPANY_ENRICHMENT.id, success: !!result, data: result };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.COMPANY_ENRICHMENT.id, success: false, data: null, error: String(err) };
  }
}

async function executeContactLookup(ctx: ResearchContext): Promise<StepExecutionResult> {
  try {
    if (!ctx.contactEmail && !ctx.contactLinkedinUrl) {
      const { searchContacts } = await import('@/lib/enrichment/apollo');
      const domain = ctx.companyDomain ?? ctx.companyName.toLowerCase().replace(/\s+/g, '') + '.com';
      const contacts = await searchContacts(domain, { seniority: ['c_suite', 'vp', 'director'], limit: 10 });
      return { stepId: RESEARCH_STEPS.CONTACT_LOOKUP.id, success: true, data: contacts };
    }

    if (ctx.contactLinkedinUrl) {
      const { enrichLinkedInProfile } = await import('@/lib/enrichment/proxycurl');
      const profile = await enrichLinkedInProfile(ctx.contactLinkedinUrl);
      return { stepId: RESEARCH_STEPS.CONTACT_LOOKUP.id, success: !!profile, data: profile };
    }

    if (ctx.contactEmail) {
      const { enrichPerson } = await import('@/lib/enrichment/clearbit');
      const person = await enrichPerson(ctx.contactEmail);
      return { stepId: RESEARCH_STEPS.CONTACT_LOOKUP.id, success: !!person, data: person };
    }

    return { stepId: RESEARCH_STEPS.CONTACT_LOOKUP.id, success: true, data: null };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.CONTACT_LOOKUP.id, success: false, data: null, error: String(err) };
  }
}

async function executeNewsSearch(_ctx: ResearchContext): Promise<StepExecutionResult> {
  try {
    // News search uses the RSS/GDELT infrastructure already in the project
    // Placeholder: integrate with lib/rss when available
    return { stepId: RESEARCH_STEPS.NEWS_SEARCH.id, success: true, data: { articles: [] } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.NEWS_SEARCH.id, success: false, data: null, error: String(err) };
  }
}

async function executeJobPostings(ctx: ResearchContext): Promise<StepExecutionResult> {
  try {
    const { getJobPostings, analyzeJobPostings } = await import('@/lib/enrichment/jobs');
    const slug = ctx.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const postings = await getJobPostings(slug);
    const analysis = analyzeJobPostings(postings);
    return { stepId: RESEARCH_STEPS.JOB_POSTINGS.id, success: true, data: analysis };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.JOB_POSTINGS.id, success: false, data: null, error: String(err) };
  }
}

async function executeTechStack(ctx: ResearchContext): Promise<StepExecutionResult> {
  try {
    const { detectTechStack } = await import('@/lib/enrichment/builtwith');
    const domain = ctx.companyDomain ?? ctx.companyName.toLowerCase().replace(/\s+/g, '') + '.com';
    const result = await detectTechStack(domain);
    return { stepId: RESEARCH_STEPS.TECH_STACK.id, success: !!result, data: result };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.TECH_STACK.id, success: false, data: null, error: String(err) };
  }
}

async function executeFundingHistory(ctx: ResearchContext): Promise<StepExecutionResult> {
  try {
    const { getCompany } = await import('@/lib/enrichment/crunchbase');
    const result = await getCompany(ctx.companyName);
    return { stepId: RESEARCH_STEPS.FUNDING_HISTORY.id, success: !!result, data: result };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.FUNDING_HISTORY.id, success: false, data: null, error: String(err) };
  }
}

// --- Phase 2 Step Executors ---

async function executeSignalClassification(_ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    // Uses LLM to classify signals from phase 1 data
    // Would call lib/ai/prompts for classification
    return { stepId: RESEARCH_STEPS.SIGNAL_CLASSIFICATION.id, success: true, data: { signals: [] } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.SIGNAL_CLASSIFICATION.id, success: false, data: null, error: String(err) };
  }
}

async function executeOrgChart(_ctx: ResearchContext, prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    const contactData = prev.get(RESEARCH_STEPS.CONTACT_LOOKUP.id)?.data;
    // Build org hierarchy from contact data
    return { stepId: RESEARCH_STEPS.ORG_CHART.id, success: true, data: { contacts: contactData, hierarchy: [] } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.ORG_CHART.id, success: false, data: null, error: String(err) };
  }
}

async function executeCompetitorId(_ctx: ResearchContext, prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    const companyData = prev.get(RESEARCH_STEPS.COMPANY_ENRICHMENT.id)?.data;
    // Identify competitors based on industry and tech stack
    return { stepId: RESEARCH_STEPS.COMPETITOR_ID.id, success: true, data: { company: companyData, competitors: [] } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.COMPETITOR_ID.id, success: false, data: null, error: String(err) };
  }
}

async function executeJobIntent(_ctx: ResearchContext, prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    const jobData = prev.get(RESEARCH_STEPS.JOB_POSTINGS.id)?.data;
    // Already analyzed in phase 1, refine with LLM
    return { stepId: RESEARCH_STEPS.JOB_INTENT.id, success: true, data: jobData };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.JOB_INTENT.id, success: false, data: null, error: String(err) };
  }
}

async function executeFinancialData(ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    const { searchSymbol, getFinancialMetrics, getQuote } = await import('@/lib/enrichment/yahoo-finance');
    const symbol = await searchSymbol(ctx.companyName);
    if (!symbol) {
      return { stepId: RESEARCH_STEPS.FINANCIAL_DATA.id, success: true, data: { isPublic: false } };
    }
    const [metrics, quote] = await Promise.all([getFinancialMetrics(symbol), getQuote(symbol)]);
    return { stepId: RESEARCH_STEPS.FINANCIAL_DATA.id, success: true, data: { isPublic: true, symbol, metrics, quote } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.FINANCIAL_DATA.id, success: false, data: null, error: String(err) };
  }
}

async function executeEntityExtraction(_ctx: ResearchContext, prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    // Extract entities (people, companies, technologies) from all phase 1 data
    const allData = Array.from(prev.values()).map((r) => r.data);
    return { stepId: RESEARCH_STEPS.ENTITY_EXTRACTION.id, success: true, data: { entities: [], sourceData: allData } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.ENTITY_EXTRACTION.id, success: false, data: null, error: String(err) };
  }
}

// --- Phase 3 Step Executors ---

async function executeIntelligenceGraph(_ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    return { stepId: RESEARCH_STEPS.INTELLIGENCE_GRAPH.id, success: true, data: { entities: [], edges: [] } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.INTELLIGENCE_GRAPH.id, success: false, data: null, error: String(err) };
  }
}

async function executeHealthScore(_ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    // Compute health score from signals, financial data, engagement
    return { stepId: RESEARCH_STEPS.HEALTH_SCORE.id, success: true, data: { score: 0, components: {} } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.HEALTH_SCORE.id, success: false, data: null, error: String(err) };
  }
}

async function executePropensity(_ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    return { stepId: RESEARCH_STEPS.PROPENSITY.id, success: true, data: { score: 0, factors: {} } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.PROPENSITY.id, success: false, data: null, error: String(err) };
  }
}

async function executeBuyingWindow(_ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    return {
      stepId: RESEARCH_STEPS.BUYING_WINDOW.id,
      success: true,
      data: { windowStart: null, windowEnd: null, confidence: 0, primaryDriver: '', urgency: 'monitor' },
    };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.BUYING_WINDOW.id, success: false, data: null, error: String(err) };
  }
}

async function executeLifecycle(_ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    return { stepId: RESEARCH_STEPS.LIFECYCLE.id, success: true, data: { stage: 'awareness', confidence: 0 } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.LIFECYCLE.id, success: false, data: null, error: String(err) };
  }
}

async function executeConvergence(_ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    return {
      stepId: RESEARCH_STEPS.CONVERGENCE.id,
      success: true,
      data: { typesDetected: 0, signalTypes: [], severity: 'low', narrative: '', recommendedAction: '' },
    };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.CONVERGENCE.id, success: false, data: null, error: String(err) };
  }
}

// --- Phase 4 Step Executors ---

async function executeWhyNow(_ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    // LLM generates why-now narrative from all collected intelligence
    return { stepId: RESEARCH_STEPS.WHY_NOW.id, success: true, data: { narrative: '' } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.WHY_NOW.id, success: false, data: null, error: String(err) };
  }
}

async function executePowerMap(_ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    return { stepId: RESEARCH_STEPS.POWER_MAP.id, success: true, data: { contacts: [], relationships: [] } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.POWER_MAP.id, success: false, data: null, error: String(err) };
  }
}

async function executeOutreach(_ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    return { stepId: RESEARCH_STEPS.OUTREACH.id, success: true, data: { drafts: [] } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.OUTREACH.id, success: false, data: null, error: String(err) };
  }
}

async function executeObjections(_ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    return { stepId: RESEARCH_STEPS.OBJECTIONS.id, success: true, data: { objections: [] } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.OBJECTIONS.id, success: false, data: null, error: String(err) };
  }
}

async function executeEngagement(_ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    return { stepId: RESEARCH_STEPS.ENGAGEMENT.id, success: true, data: { sequence: [] } };
  } catch (err) {
    return { stepId: RESEARCH_STEPS.ENGAGEMENT.id, success: false, data: null, error: String(err) };
  }
}

// --- Deep Research Step Executors ---

async function executeEarningsAnalysis(ctx: ResearchContext): Promise<StepExecutionResult> {
  try {
    const { searchSymbol, getEarningsData } = await import('@/lib/enrichment/yahoo-finance');
    const symbol = await searchSymbol(ctx.companyName);
    if (!symbol) {
      return { stepId: DEEP_RESEARCH_STEPS.EARNINGS_ANALYSIS.id, success: true, data: null };
    }
    const earnings = await getEarningsData(symbol);
    return { stepId: DEEP_RESEARCH_STEPS.EARNINGS_ANALYSIS.id, success: true, data: earnings };
  } catch (err) {
    return { stepId: DEEP_RESEARCH_STEPS.EARNINGS_ANALYSIS.id, success: false, data: null, error: String(err) };
  }
}

async function executePatentSearch(_ctx: ResearchContext): Promise<StepExecutionResult> {
  try {
    // Patent search via USPTO or Google Patents API
    return { stepId: DEEP_RESEARCH_STEPS.PATENT_SEARCH.id, success: true, data: { patents: [] } };
  } catch (err) {
    return { stepId: DEEP_RESEARCH_STEPS.PATENT_SEARCH.id, success: false, data: null, error: String(err) };
  }
}

async function executeGlassdoorSentiment(_ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    return { stepId: DEEP_RESEARCH_STEPS.GLASSDOOR_SENTIMENT.id, success: true, data: { rating: null, sentiment: 'neutral' } };
  } catch (err) {
    return { stepId: DEEP_RESEARCH_STEPS.GLASSDOOR_SENTIMENT.id, success: false, data: null, error: String(err) };
  }
}

async function executeExtendedSocial(_ctx: ResearchContext, _prev: PhaseResults): Promise<StepExecutionResult> {
  try {
    return { stepId: DEEP_RESEARCH_STEPS.EXTENDED_SOCIAL.id, success: true, data: { posts: [], engagement: {} } };
  } catch (err) {
    return { stepId: DEEP_RESEARCH_STEPS.EXTENDED_SOCIAL.id, success: false, data: null, error: String(err) };
  }
}

// --- Step Registry ---

type StepExecutor = (ctx: ResearchContext, prev: PhaseResults) => Promise<StepExecutionResult>;

const PHASE1_EXECUTORS: Record<string, StepExecutor> = {
  [RESEARCH_STEPS.COMPANY_ENRICHMENT.id]: (ctx) => executeCompanyEnrichment(ctx),
  [RESEARCH_STEPS.CONTACT_LOOKUP.id]: (ctx) => executeContactLookup(ctx),
  [RESEARCH_STEPS.NEWS_SEARCH.id]: (ctx) => executeNewsSearch(ctx),
  [RESEARCH_STEPS.JOB_POSTINGS.id]: (ctx) => executeJobPostings(ctx),
  [RESEARCH_STEPS.TECH_STACK.id]: (ctx) => executeTechStack(ctx),
  [RESEARCH_STEPS.FUNDING_HISTORY.id]: (ctx) => executeFundingHistory(ctx),
};

const PHASE2_EXECUTORS: Record<string, StepExecutor> = {
  [RESEARCH_STEPS.SIGNAL_CLASSIFICATION.id]: executeSignalClassification,
  [RESEARCH_STEPS.ORG_CHART.id]: executeOrgChart,
  [RESEARCH_STEPS.COMPETITOR_ID.id]: executeCompetitorId,
  [RESEARCH_STEPS.JOB_INTENT.id]: executeJobIntent,
  [RESEARCH_STEPS.FINANCIAL_DATA.id]: executeFinancialData,
  [RESEARCH_STEPS.ENTITY_EXTRACTION.id]: executeEntityExtraction,
};

const PHASE3_EXECUTORS: Record<string, StepExecutor> = {
  [RESEARCH_STEPS.INTELLIGENCE_GRAPH.id]: executeIntelligenceGraph,
  [RESEARCH_STEPS.HEALTH_SCORE.id]: executeHealthScore,
  [RESEARCH_STEPS.PROPENSITY.id]: executePropensity,
  [RESEARCH_STEPS.BUYING_WINDOW.id]: executeBuyingWindow,
  [RESEARCH_STEPS.LIFECYCLE.id]: executeLifecycle,
  [RESEARCH_STEPS.CONVERGENCE.id]: executeConvergence,
};

const PHASE4_EXECUTORS: Record<string, StepExecutor> = {
  [RESEARCH_STEPS.WHY_NOW.id]: executeWhyNow,
  [RESEARCH_STEPS.POWER_MAP.id]: executePowerMap,
  [RESEARCH_STEPS.OUTREACH.id]: executeOutreach,
  [RESEARCH_STEPS.OBJECTIONS.id]: executeObjections,
  [RESEARCH_STEPS.ENGAGEMENT.id]: executeEngagement,
};

const DEEP_PHASE1_EXECUTORS: Record<string, StepExecutor> = {
  [DEEP_RESEARCH_STEPS.EARNINGS_ANALYSIS.id]: (ctx) => executeEarningsAnalysis(ctx),
  [DEEP_RESEARCH_STEPS.PATENT_SEARCH.id]: (ctx) => executePatentSearch(ctx),
};

const DEEP_PHASE2_EXECUTORS: Record<string, StepExecutor> = {
  [DEEP_RESEARCH_STEPS.GLASSDOOR_SENTIMENT.id]: executeGlassdoorSentiment,
  [DEEP_RESEARCH_STEPS.EXTENDED_SOCIAL.id]: executeExtendedSocial,
};

function getExecutorsForPhase(phase: number, isDeep: boolean): Record<string, StepExecutor> {
  const phaseMap: Record<number, Record<string, StepExecutor>> = {
    1: PHASE1_EXECUTORS,
    2: PHASE2_EXECUTORS,
    3: PHASE3_EXECUTORS,
    4: PHASE4_EXECUTORS,
  };

  const executors = { ...(phaseMap[phase] ?? {}) };

  if (isDeep) {
    const deepMap: Record<number, Record<string, StepExecutor>> = {
      1: DEEP_PHASE1_EXECUTORS,
      2: DEEP_PHASE2_EXECUTORS,
    };
    Object.assign(executors, deepMap[phase] ?? {});
  }

  return executors;
}

// --- Main Orchestrator ---

async function executePhaseParallel(
  phase: number,
  ctx: ResearchContext,
  previousResults: PhaseResults,
  stepStates: Map<string, ResearchStep>
): Promise<PhaseResults> {
  const isDeep = ctx.jobType === 'deep';
  const executors = getExecutorsForPhase(phase, isDeep);
  const phaseResults: PhaseResults = new Map();

  const promises = Object.entries(executors).map(async ([stepId, executor]) => {
    const stepState = stepStates.get(stepId);
    if (!stepState) return;

    // Mark running
    const running = markRunning(stepState, ctx.onStepUpdate);
    stepStates.set(stepId, running);

    try {
      const result = await executor(ctx, previousResults);
      phaseResults.set(stepId, result);

      const preview = result.success
        ? summarizeResult(stepId, result.data)
        : null;

      const completed = markCompleted(running, preview, ctx.onStepUpdate);
      stepStates.set(stepId, completed);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      phaseResults.set(stepId, { stepId, success: false, data: null, error: errorMsg });

      const failed = markFailed(running, errorMsg, ctx.onStepUpdate);
      stepStates.set(stepId, failed);
    }
  });

  await Promise.allSettled(promises);
  return phaseResults;
}

async function executePhaseSequential(
  phase: number,
  ctx: ResearchContext,
  previousResults: PhaseResults,
  stepStates: Map<string, ResearchStep>
): Promise<PhaseResults> {
  const isDeep = ctx.jobType === 'deep';
  const executors = getExecutorsForPhase(phase, isDeep);
  const phaseResults: PhaseResults = new Map();

  for (const [stepId, executor] of Object.entries(executors)) {
    const stepState = stepStates.get(stepId);
    if (!stepState) continue;

    const running = markRunning(stepState, ctx.onStepUpdate);
    stepStates.set(stepId, running);

    try {
      const mergedPrev = new Map([...previousResults, ...phaseResults]);
      const result = await executor(ctx, mergedPrev);
      phaseResults.set(stepId, result);

      const preview = result.success ? summarizeResult(stepId, result.data) : null;
      const completed = markCompleted(running, preview, ctx.onStepUpdate);
      stepStates.set(stepId, completed);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      phaseResults.set(stepId, { stepId, success: false, data: null, error: errorMsg });

      const failed = markFailed(running, errorMsg, ctx.onStepUpdate);
      stepStates.set(stepId, failed);
    }
  }

  return phaseResults;
}

function summarizeResult(stepId: string, data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;

  const d = data as Record<string, unknown>;

  switch (stepId) {
    case RESEARCH_STEPS.COMPANY_ENRICHMENT.id:
      return d.name ? `Enriched: ${d.name}` : 'Company data collected';
    case RESEARCH_STEPS.CONTACT_LOOKUP.id:
      if (Array.isArray(d)) return `Found ${d.length} contacts`;
      return d.fullName ? `Profile: ${d.fullName}` : 'Contact data collected';
    case RESEARCH_STEPS.JOB_POSTINGS.id:
      return d.totalOpenRoles != null ? `${d.totalOpenRoles} open roles found` : 'Job data collected';
    case RESEARCH_STEPS.TECH_STACK.id:
      return d.totalTechnologies != null ? `${d.totalTechnologies} technologies detected` : 'Tech stack analyzed';
    case RESEARCH_STEPS.FUNDING_HISTORY.id:
      return d.totalFundingUsd ? `Total funding: $${Number(d.totalFundingUsd).toLocaleString()}` : 'Funding data collected';
    case RESEARCH_STEPS.FINANCIAL_DATA.id:
      return d.isPublic ? `Public company: ${d.symbol}` : 'Private company';
    case RESEARCH_STEPS.HEALTH_SCORE.id:
      return d.score != null ? `Health score: ${d.score}` : null;
    case RESEARCH_STEPS.PROPENSITY.id:
      return d.score != null ? `Propensity: ${d.score}` : null;
    default:
      return 'Completed';
  }
}

export async function executeResearch(ctx: ResearchContext): Promise<void> {
  const isDeep = ctx.jobType === 'deep';
  const totalPhases = getTotalPhases();

  // Initialize all step states
  const stepStates = new Map<string, ResearchStep>();
  const allStepDefs = getStepsForPhase(1, isDeep)
    .concat(getStepsForPhase(2, isDeep))
    .concat(getStepsForPhase(3, isDeep))
    .concat(getStepsForPhase(4, isDeep));

  for (const stepDef of allStepDefs) {
    const step = createStep(stepDef.id, stepDef.label);
    stepStates.set(stepDef.id, step);
    ctx.onStepUpdate(step);
  }

  let cumulativeResults: PhaseResults = new Map();

  // Phase 1: Data Collection (parallel)
  const phase1Results = await executePhaseParallel(1, ctx, cumulativeResults, stepStates);
  cumulativeResults = new Map([...cumulativeResults, ...phase1Results]);

  // Phase 2: Analysis (parallel, depends on phase 1)
  const phase2Results = await executePhaseParallel(2, ctx, cumulativeResults, stepStates);
  cumulativeResults = new Map([...cumulativeResults, ...phase2Results]);

  // Phase 3: Scoring & Modeling (parallel, depends on phase 2)
  const phase3Results = await executePhaseParallel(3, ctx, cumulativeResults, stepStates);
  cumulativeResults = new Map([...cumulativeResults, ...phase3Results]);

  // Phase 4: Output Generation (sequential, depends on phase 3)
  const phase4Results = await executePhaseSequential(4, ctx, cumulativeResults, stepStates);
  cumulativeResults = new Map([...cumulativeResults, ...phase4Results]);

  // Log summary
  const succeeded = Array.from(cumulativeResults.values()).filter((r) => r.success).length;
  const failed = Array.from(cumulativeResults.values()).filter((r) => !r.success).length;
  console.log(`[Research] Job ${ctx.jobId} completed: ${succeeded} succeeded, ${failed} failed across ${totalPhases} phases`);
}
