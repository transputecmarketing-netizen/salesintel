import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';

import type { ResearchJob, ResearchStep, ResearchJobType } from '@/types/research';

const STANDARD_STEPS: Omit<ResearchStep, 'status' | 'startedAt' | 'completedAt' | 'duration' | 'resultPreview' | 'error'>[] = [
  { step: 'company_enrichment', label: 'Enriching company data' },
  { step: 'contact_discovery', label: 'Discovering key contacts' },
  { step: 'signal_scan', label: 'Scanning for signals' },
  { step: 'tech_stack', label: 'Detecting tech stack' },
  { step: 'scoring', label: 'Computing scores' },
  { step: 'outreach_draft', label: 'Generating outreach drafts' },
];

const CREDIT_COST: Record<ResearchJobType, number> = {
  standard: 5,
  deep: 25,
};

// In-memory job store for development; swap for DB/Redis in production
// @ts-ignore: exported for use by status route
(globalThis as any).__researchJobStore = (globalThis as any).__researchJobStore ?? new Map<string, ResearchJob>();
const jobStore: Map<string, ResearchJob> = (globalThis as any).__researchJobStore;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { companyName, contactEmail, jobType = 'standard' } = body as {
      companyName?: string;
      contactEmail?: string;
      jobType?: ResearchJobType;
    };

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return NextResponse.json(
        { error: 'companyName is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (jobType !== 'standard' && jobType !== 'deep') {
      return NextResponse.json(
        { error: 'jobType must be "standard" or "deep"' },
        { status: 400 }
      );
    }

    if (contactEmail && typeof contactEmail !== 'string') {
      return NextResponse.json(
        { error: 'contactEmail must be a string if provided' },
        { status: 400 }
      );
    }

    const jobId = uuidv4();
    const now = new Date().toISOString();

    const progress: ResearchStep[] = STANDARD_STEPS.map((s) => ({
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
      jobType,
      status: 'pending',
      progress,
      result: null,
      creditsConsumed: CREDIT_COST[jobType],
      startedAt: null,
      completedAt: null,
      createdAt: now,
    };

    jobStore.set(jobId, job);

    // Start research in background (non-blocking)
    runResearchPipeline(jobId, companyName.trim(), contactEmail?.trim() ?? null, jobType).catch(
      (err) => console.error(`[Research] Pipeline failed for job ${jobId}:`, err)
    );

    return NextResponse.json(
      {
        jobId,
        status: 'pending',
        creditsConsumed: CREDIT_COST[jobType],
        message: `Research job created for "${companyName.trim()}"`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Research/Company] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function runResearchPipeline(
  jobId: string,
  companyName: string,
  contactEmail: string | null,
  _jobType: ResearchJobType
): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job) return;

  job.status = 'running';
  job.startedAt = new Date().toISOString();

  for (let i = 0; i < job.progress.length; i++) {
    const step = job.progress[i]!;
    step.status = 'running';
    step.startedAt = new Date().toISOString();

    try {
      // Simulate each step with a delay; replace with real enrichment calls
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

      step.status = 'completed';
      step.completedAt = new Date().toISOString();
      step.duration = Date.now() - new Date(step.startedAt).getTime();
      step.resultPreview = `Completed ${step.label} for ${companyName}${contactEmail ? ` (contact: ${contactEmail})` : ''}`;
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
