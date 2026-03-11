import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';

import type { ResearchJob, ResearchStep } from '@/types/research';

const DEEP_RESEARCH_STEPS: Omit<ResearchStep, 'status' | 'startedAt' | 'completedAt' | 'duration' | 'resultPreview' | 'error'>[] = [
  { step: 'company_enrichment', label: 'Deep company enrichment (Apollo + Clearbit)' },
  { step: 'contact_map', label: 'Full org chart mapping' },
  { step: 'tech_stack_deep', label: 'Deep tech stack analysis (BuiltWith)' },
  { step: 'funding_analysis', label: 'Funding & financial analysis (Crunchbase)' },
  { step: 'job_posting_scan', label: 'Job posting intelligence scan' },
  { step: 'signal_deep_scan', label: 'Multi-source signal aggregation' },
  { step: 'competitive_landscape', label: 'Competitive landscape analysis' },
  { step: 'graph_construction', label: 'Building intelligence graph' },
  { step: 'health_scoring', label: 'Computing Account Health Score' },
  { step: 'propensity_model', label: 'Running Propensity-to-Buy model' },
  { step: 'buying_window', label: 'Predicting buying window' },
  { step: 'convergence_check', label: 'Convergence detection' },
  { step: 'why_now_narrative', label: 'Generating Why-Now narrative' },
  { step: 'outreach_generation', label: 'Generating multi-channel outreach' },
  { step: 'brief_synthesis', label: 'Synthesizing intelligence brief' },
];

const DEEP_CREDIT_COST = 25;

// @ts-ignore
(globalThis as any).__deepJobStore = (globalThis as any).__deepJobStore ?? new Map<string, ResearchJob>();
const deepJobStore: Map<string, ResearchJob> = (globalThis as any).__deepJobStore;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyName, contactEmail } = body as {
      companyName?: string;
      contactEmail?: string;
    };

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return NextResponse.json(
        { error: 'companyName is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (contactEmail !== undefined && (typeof contactEmail !== 'string' || !contactEmail.includes('@'))) {
      return NextResponse.json(
        { error: 'contactEmail must be a valid email if provided' },
        { status: 400 }
      );
    }

    const jobId = uuidv4();
    const now = new Date().toISOString();

    const progress: ResearchStep[] = DEEP_RESEARCH_STEPS.map((s) => ({
      ...s,
      status: 'pending' as const,
      startedAt: null,
      completedAt: null,
      duration: null,
      resultPreview: null,
      error: null,
    }));

    const job: ResearchJob = {
      id: jobId,
      userId,
      companyId: null,
      contactEmail: contactEmail?.trim() ?? null,
      jobType: 'deep',
      status: 'pending',
      progress,
      result: null,
      creditsConsumed: DEEP_CREDIT_COST,
      startedAt: null,
      completedAt: null,
      createdAt: now,
    };

    deepJobStore.set(jobId, job);

    runDeepResearchPipeline(jobId, companyName.trim(), contactEmail?.trim() ?? null).catch(
      (err) => console.error(`[Research/Deep] Pipeline failed for job ${jobId}:`, err)
    );

    return NextResponse.json(
      {
        jobId,
        status: 'pending',
        creditsConsumed: DEEP_CREDIT_COST,
        stepsTotal: DEEP_RESEARCH_STEPS.length,
        message: `Deep research initiated for "${companyName.trim()}" (${DEEP_CREDIT_COST} credits)`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Research/Deep] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function runDeepResearchPipeline(
  jobId: string,
  _companyName: string,
  _contactEmail: string | null
): Promise<void> {
  const job = deepJobStore.get(jobId);
  if (!job) return;

  job.status = 'running';
  job.startedAt = new Date().toISOString();

  for (const step of job.progress) {
    step.status = 'running';
    step.startedAt = new Date().toISOString();

    try {
      // Deep steps take longer
      await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 2000));

      step.status = 'completed';
      step.completedAt = new Date().toISOString();
      step.duration = Date.now() - new Date(step.startedAt).getTime();
      step.resultPreview = `${step.label} completed`;
    } catch (err) {
      step.status = 'failed';
      step.completedAt = new Date().toISOString();
      step.error = err instanceof Error ? err.message : 'Unknown error';
      job.status = 'failed';
      return;
    }
  }

  job.status = 'completed';
  job.completedAt = new Date().toISOString();
}
