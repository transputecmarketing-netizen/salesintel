import type { ResearchStep } from '@/types/research';
import { executeResearch, type ResearchContext } from './orchestrator';

export const DEEP_RESEARCH_CREDIT_COST = 25;

export interface DeepResearchConfig {
  includeEarningsAnalysis: boolean;
  includePatentSearch: boolean;
  includeGlassdoorSentiment: boolean;
  includeExtendedSocial: boolean;
  includeSECFilings: boolean;
  lookbackMonths: number;
}

export const DEFAULT_DEEP_CONFIG: DeepResearchConfig = {
  includeEarningsAnalysis: true,
  includePatentSearch: true,
  includeGlassdoorSentiment: true,
  includeExtendedSocial: true,
  includeSECFilings: true,
  lookbackMonths: 12,
};

export interface DeepResearchResult {
  earningsAnalysis: EarningsAnalysis | null;
  patentAnalysis: PatentAnalysis | null;
  employeeSentiment: EmployeeSentiment | null;
  socialAnalysis: ExtendedSocialAnalysis | null;
  secFilings: SECFilingAnalysis | null;
}

export interface EarningsAnalysis {
  recentQuarters: Array<{
    quarter: string;
    epsSurprise: number | null;
    revenueGrowth: number | null;
    guidanceDirection: 'raised' | 'maintained' | 'lowered' | 'unknown';
  }>;
  keyThemes: string[];
  mentionedTechnologies: string[];
  strategicPriorities: string[];
  riskFactors: string[];
  sentiment: 'bullish' | 'neutral' | 'bearish';
}

export interface PatentAnalysis {
  totalPatents: number;
  recentPatents: Array<{
    title: string;
    filingDate: string;
    status: 'pending' | 'granted' | 'expired';
    category: string;
  }>;
  innovationAreas: string[];
  patentVelocity: 'accelerating' | 'steady' | 'decelerating';
}

export interface EmployeeSentiment {
  overallRating: number | null;
  ceoApproval: number | null;
  recommendToFriend: number | null;
  cultureScore: number | null;
  workLifeBalance: number | null;
  compensation: number | null;
  careerOpportunities: number | null;
  seniorLeadership: number | null;
  pros: string[];
  cons: string[];
  trendDirection: 'improving' | 'stable' | 'declining';
}

export interface ExtendedSocialAnalysis {
  linkedinFollowers: number | null;
  linkedinGrowthRate: number | null;
  twitterFollowers: number | null;
  twitterEngagementRate: number | null;
  recentPosts: Array<{
    platform: string;
    content: string;
    engagement: number;
    date: string;
  }>;
  topTopics: string[];
  brandSentiment: 'positive' | 'neutral' | 'negative';
  executivePresence: Array<{
    name: string;
    platform: string;
    followerCount: number;
    recentPostCount: number;
  }>;
}

export interface SECFilingAnalysis {
  recentFilings: Array<{
    type: string;
    date: string;
    title: string;
    url: string;
  }>;
  materialEvents: Array<{
    type: string;
    description: string;
    date: string;
    significance: 'high' | 'medium' | 'low';
  }>;
  riskFactorChanges: string[];
  insiderTransactions: Array<{
    name: string;
    title: string;
    action: 'buy' | 'sell';
    shares: number;
    date: string;
  }>;
}

export async function executeDeepResearch(
  ctx: Omit<ResearchContext, 'jobType'>,
  config: DeepResearchConfig = DEFAULT_DEEP_CONFIG
): Promise<void> {
  const deepCtx: ResearchContext = {
    ...ctx,
    jobType: 'deep',
  };

  // Execute the full research DAG in deep mode
  // The orchestrator handles the additional deep-research steps
  await executeResearch(deepCtx);

  // If SEC filings are requested, run them as an additional enrichment
  if (config.includeSECFilings) {
    const step: ResearchStep = {
      step: 'sec_filings',
      label: 'SEC Filings Analysis',
      status: 'running',
      startedAt: new Date().toISOString(),
      completedAt: null,
      duration: null,
      resultPreview: null,
      error: null,
    };

    ctx.onStepUpdate(step);

    try {
      const { getRecentMaterialEvents } = await import('@/lib/enrichment/sec-edgar');
      const lookbackDays = config.lookbackMonths * 30;
      const events = await getRecentMaterialEvents(ctx.companyName, lookbackDays);

      ctx.onStepUpdate({
        ...step,
        status: 'completed',
        completedAt: new Date().toISOString(),
        duration: Date.now() - new Date(step.startedAt!).getTime(),
        resultPreview: `${events.length} material events found`,
      });
    } catch (err) {
      ctx.onStepUpdate({
        ...step,
        status: 'failed',
        completedAt: new Date().toISOString(),
        duration: Date.now() - new Date(step.startedAt!).getTime(),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

export function estimateDeepResearchDuration(companyName: string): {
  estimatedSeconds: number;
  estimatedSteps: number;
} {
  // Deep research typically takes 30-90 seconds depending on data availability
  // Standard has ~23 steps, deep adds ~5 more
  return {
    estimatedSeconds: 60,
    estimatedSteps: 28,
  };
}
