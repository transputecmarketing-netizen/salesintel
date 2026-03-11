import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import type { ResearchJob } from '@/types/research';

// Access global job stores (shared with sibling routes)
function findJob(jobId: string): ResearchJob | undefined {
  const stores = [
    (globalThis as any).__researchJobStore as Map<string, ResearchJob> | undefined,
    (globalThis as any).__contactJobStore as Map<string, ResearchJob> | undefined,
    (globalThis as any).__deepJobStore as Map<string, ResearchJob> | undefined,
  ];
  for (const store of stores) {
    const job = store?.get(jobId);
    if (job) return job;
  }
  return undefined;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'jobId parameter is required' }, { status: 400 });
    }

    const job = findJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Research job not found' }, { status: 404 });
    }

    if (job.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const completedSteps = job.progress.filter((s) => s.status === 'completed').length;
    const totalSteps = job.progress.length;
    const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    const currentStep = job.progress.find((s) => s.status === 'running') ?? null;

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      jobType: job.jobType,
      progress: job.progress,
      progressPercent,
      completedSteps,
      totalSteps,
      currentStep: currentStep
        ? { step: currentStep.step, label: currentStep.label }
        : null,
      result: job.status === 'completed' ? job.result : null,
      creditsConsumed: job.creditsConsumed,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
    });
  } catch (err) {
    console.error('[Research/Status] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
