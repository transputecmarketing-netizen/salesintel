export type ResearchJobType = 'standard' | 'deep';
export type ResearchStepStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ResearchJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ResearchStep {
  step: string;
  label: string;
  status: ResearchStepStatus;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  resultPreview: string | null;
  error: string | null;
}

export interface ResearchJob {
  id: string;
  userId: string;
  companyId: string | null;
  contactEmail: string | null;
  jobType: ResearchJobType;
  status: ResearchJobStatus;
  progress: ResearchStep[];
  result: ResearchResult | null;
  creditsConsumed: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface ResearchResult {
  company: import('./company').Company;
  contacts: import('./contact').Contact[];
  signals: import('./signal').Signal[];
  scores: import('./company').CompanyScores;
  whyNowNarrative: string;
  outreachDrafts: OutreachDraft[];
  buyingWindow: BuyingWindowPrediction;
  convergence: ConvergenceResult | null;
}

export interface BuyingWindowPrediction {
  windowStart: string;
  windowEnd: string;
  confidence: number;
  primaryDriver: string;
  optimalOutreachDate: string;
  urgency: 'immediate' | 'this_week' | 'this_month' | 'this_quarter' | 'monitor';
}

export interface ConvergenceResult {
  typesDetected: number;
  signalTypes: string[];
  severity: string;
  narrative: string;
  recommendedAction: string;
}

export interface OutreachDraft {
  channel: 'email' | 'linkedin' | 'phone_script';
  subject: string;
  body: string;
  variant: 'cold' | 'warm' | 'trigger_based';
  signalReference: string | null;
}
