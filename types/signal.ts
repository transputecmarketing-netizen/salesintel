export type SignalType =
  | 'funding' | 'hiring' | 'expansion' | 'leadership'
  | 'technology' | 'financial' | 'competitive' | 'tender'
  | 'product_launch' | 'partnership' | 'earnings' | 'social';

export type SignalSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type RecommendedAction = 'urgent_outreach' | 'engage' | 'research' | 'monitor' | 'ignore';

export type UserSignalStatus = 'unread' | 'read' | 'dismissed' | 'actioned';

export interface Signal {
  id: string;
  companyId: string;
  contactId: string | null;
  signalType: SignalType;
  signalSubtype: string | null;
  severity: SignalSeverity;
  intentScore: number;
  confidence: number;
  title: string;
  summary: string | null;
  rawContent: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  sourceTier: number;
  whyItMatters: string | null;
  recommendedAction: RecommendedAction | null;
  actionTemplate: string | null;
  classifiedBy: 'keyword' | 'ml' | 'llm';
  entities: SignalEntities;
  evidence: EvidenceItem[];
  detectedAt: string;
  publishedAt: string | null;
  createdAt: string;
  // UI state
  company?: { name: string; slug: string; logoUrl: string | null; industry: string | null };
  userStatus?: UserSignalStatus;
}

export interface SignalEntities {
  people?: Array<{ name: string; title?: string }>;
  companies?: Array<{ name: string; role?: string }>;
  technologies?: Array<{ name: string }>;
  amounts?: Array<{ value: string; currency?: string }>;
}

export interface EvidenceItem {
  type: 'article' | 'filing' | 'job_posting' | 'social_post' | 'press_release';
  content: string;
  sourceUrl: string | null;
  date: string;
}

export interface SignalClassification {
  signalType: SignalType;
  signalSubtype: string;
  severity: SignalSeverity;
  intentScore: number;
  confidence: number;
  recommendedAction: RecommendedAction;
  whyItMatters: string;
  entities: SignalEntities;
}

export interface SignalFilters {
  types?: SignalType[];
  severities?: SignalSeverity[];
  dateRange?: { start: string; end: string };
  companyId?: string;
  status?: UserSignalStatus[];
  minIntentScore?: number;
}
