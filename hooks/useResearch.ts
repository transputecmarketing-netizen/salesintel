'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

import type { ResearchJobType, ResearchStep, ResearchJobStatus } from '@/types/research';
import { useResearchStore } from '@/stores/research';

const POLL_INTERVAL_MS = 2000;

interface UseResearchReturn {
  // State
  jobId: string | null;
  status: ResearchJobStatus | null;
  progress: ResearchStep[];
  progressPercent: number;
  currentStep: { step: string; label: string } | null;
  result: unknown;
  loading: boolean;
  error: string | null;

  // Actions
  startCompanyResearch: (params: {
    companyName: string;
    contactEmail?: string;
    jobType?: ResearchJobType;
  }) => Promise<string>;
  startContactResearch: (params: {
    email: string;
    companyName?: string;
  }) => Promise<string>;
  startDeepResearch: (params: {
    companyName: string;
    contactEmail?: string;
  }) => Promise<string>;
  cancelPolling: () => void;
}

export function useResearch(): UseResearchReturn {
  const store = useResearchStore();

  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<ResearchJobStatus | null>(null);
  const [progress, setProgress] = useState<ResearchStep[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStep, setCurrentStep] = useState<{ step: string; label: string } | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeJobIdRef = useRef<string | null>(null);

  const cancelPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    activeJobIdRef.current = null;
  }, []);

  const pollJobStatus = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/research/status/${id}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json();

        setStatus(data.status);
        setProgress(data.progress);
        setProgressPercent(data.progressPercent);
        setCurrentStep(data.currentStep);

        // Update store
        store.updateJobProgress(id, data.progress);

        if (data.status === 'completed') {
          setResult(data.result);
          store.completeJob(id, data.result);
          cancelPolling();
          setLoading(false);
        } else if (data.status === 'failed') {
          const failedStep = data.progress.find((s: ResearchStep) => s.status === 'failed');
          const errorMsg = failedStep?.error ?? 'Research job failed';
          setError(errorMsg);
          store.failJob(id, errorMsg);
          cancelPolling();
          setLoading(false);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to poll job status';
        setError(message);
        cancelPolling();
        setLoading(false);
      }
    },
    [store, cancelPolling]
  );

  const startPolling = useCallback(
    (id: string) => {
      cancelPolling();
      activeJobIdRef.current = id;

      // Immediate first poll
      pollJobStatus(id);

      pollRef.current = setInterval(() => {
        if (activeJobIdRef.current === id) {
          pollJobStatus(id);
        }
      }, POLL_INTERVAL_MS);
    },
    [pollJobStatus, cancelPolling]
  );

  const startJob = useCallback(
    async (endpoint: string, body: Record<string, unknown>): Promise<string> => {
      setLoading(true);
      setError(null);
      setResult(null);
      setProgress([]);
      setProgressPercent(0);
      setCurrentStep(null);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json();
        const newJobId = data.jobId;

        setJobId(newJobId);
        setStatus('pending');

        // Add to store
        store.startJob({
          id: newJobId,
          userId: '',
          companyId: null,
          contactEmail: null,
          jobType: (body.jobType as ResearchJobType) ?? 'standard',
          status: 'pending',
          progress: [],
          result: null,
          creditsConsumed: data.creditsConsumed ?? 0,
          startedAt: null,
          completedAt: null,
          createdAt: new Date().toISOString(),
        });

        // Start polling
        startPolling(newJobId);

        return newJobId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start research';
        setError(message);
        setLoading(false);
        throw err;
      }
    },
    [store, startPolling]
  );

  const startCompanyResearch = useCallback(
    async (params: {
      companyName: string;
      contactEmail?: string;
      jobType?: ResearchJobType;
    }) => {
      return startJob('/api/research/company', params);
    },
    [startJob]
  );

  const startContactResearch = useCallback(
    async (params: { email: string; companyName?: string }) => {
      return startJob('/api/research/contact', params);
    },
    [startJob]
  );

  const startDeepResearch = useCallback(
    async (params: { companyName: string; contactEmail?: string }) => {
      return startJob('/api/research/deep', params);
    },
    [startJob]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPolling();
    };
  }, [cancelPolling]);

  return {
    jobId,
    status,
    progress,
    progressPercent,
    currentStep,
    result,
    loading,
    error,
    startCompanyResearch,
    startContactResearch,
    startDeepResearch,
    cancelPolling,
  };
}
