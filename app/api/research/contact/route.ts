import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';

import type { ResearchJob, ResearchStep } from '@/types/research';

const CONTACT_STEPS: Omit<ResearchStep, 'status' | 'startedAt' | 'completedAt' | 'duration' | 'resultPreview' | 'error'>[] = [
  { step: 'email_lookup', label: 'Looking up contact by email' },
  { step: 'linkedin_enrichment', label: 'Enriching LinkedIn profile' },
  { step: 'career_history', label: 'Mapping career history' },
  { step: 'social_activity', label: 'Scanning recent social activity' },
  { step: 'comm_style', label: 'Analyzing communication style' },
  { step: 'role_mapping', label: 'Determining buying role' },
];

const CREDIT_COST = 3;

// @ts-ignore
(globalThis as any).__contactJobStore = (globalThis as any).__contactJobStore ?? new Map<string, ResearchJob>();
const contactJobStore: Map<string, ResearchJob> = (globalThis as any).__contactJobStore;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, companyName } = body as {
      email?: string;
      companyName?: string;
    };

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    if (companyName !== undefined && typeof companyName !== 'string') {
      return NextResponse.json(
        { error: 'companyName must be a string if provided' },
        { status: 400 }
      );
    }

    const jobId = uuidv4();
    const now = new Date().toISOString();

    const progress: ResearchStep[] = CONTACT_STEPS.map((s) => ({
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
      contactEmail: email.trim(),
      jobType: 'standard',
      status: 'pending',
      progress,
      result: null,
      creditsConsumed: CREDIT_COST,
      startedAt: null,
      completedAt: null,
      createdAt: now,
    };

    contactJobStore.set(jobId, job);

    // Run in background
    runContactResearch(jobId, email.trim(), companyName?.trim() ?? null).catch(
      (err) => console.error(`[Research/Contact] Pipeline failed for job ${jobId}:`, err)
    );

    return NextResponse.json(
      {
        jobId,
        status: 'pending',
        creditsConsumed: CREDIT_COST,
        message: `Contact research initiated for "${email.trim()}"`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Research/Contact] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function runContactResearch(
  jobId: string,
  _email: string,
  _companyName: string | null
): Promise<void> {
  const job = contactJobStore.get(jobId);
  if (!job) return;

  job.status = 'running';
  job.startedAt = new Date().toISOString();

  for (const step of job.progress) {
    step.status = 'running';
    step.startedAt = new Date().toISOString();

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 800));

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
