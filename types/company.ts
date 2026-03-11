export interface Company {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logoUrl: string | null;
  description: string | null;
  industry: string | null;
  subIndustry: string | null;
  employeeCount: string | null;
  employeeExact: number | null;
  foundedYear: number | null;
  hqCity: string | null;
  hqState: string | null;
  hqCountry: string | null;
  fundingStage: string | null;
  totalFunding: number | null;
  lastFundingDate: string | null;
  revenueRange: string | null;
  lifecycleStage: string | null;
  techStack: TechStackItem[];
  socialLinks: SocialLinks;
  enrichedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TechStackItem {
  name: string;
  category: string;
  detectedAt: string;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  crunchbase?: string;
}

export interface CompanyScores {
  id: string;
  companyId: string;
  userId: string;
  healthScore: number;
  healthFitComponent: number;
  healthVelocityComponent: number;
  healthIntentComponent: number;
  healthReadinessComponent: number;
  propensityScore: number;
  propensityFactors: Record<string, number>;
  buyingWindowStart: string | null;
  buyingWindowEnd: string | null;
  buyingWindowConfidence: number;
  buyingWindowDriver: string | null;
  dealVelocity: 'accelerating' | 'steady' | 'decelerating' | null;
  velocitySignals: string[];
  computedAt: string;
}
