import { create } from 'zustand';

import type {
  ResearchJob,
  ResearchJobType,
  ResearchJobStatus,
  ResearchStep,
} from '@/types/research';

interface ResearchState {
  // Data
  activeJobs: Map<string, ResearchJob>;
  currentJobId: string | null;
  completedJobs: ResearchJob[];
  loading: boolean;
  error: string | null;

  // Actions
  startJob: (job: ResearchJob) => void;
  updateJobProgress: (jobId: string, progress: ResearchStep[]) => void;
  updateJobStatus: (jobId: string, status: ResearchJobStatus) => void;
  completeJob: (jobId: string, result?: ResearchJob['result']) => void;
  failJob: (jobId: string, error: string) => void;
  removeJob: (jobId: string) => void;
  setCurrentJob: (jobId: string | null) => void;

  // Loading/error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getCurrentJob: () => ResearchJob | null;
  getJob: (jobId: string) => ResearchJob | undefined;
  getActiveJobCount: () => number;
  getJobsByType: (type: ResearchJobType) => ResearchJob[];
  getJobProgress: (jobId: string) => {
    completedSteps: number;
    totalSteps: number;
    percent: number;
    currentStep: ResearchStep | null;
  } | null;
}

export const useResearchStore = create<ResearchState>((set, get) => ({
  // Initial state
  activeJobs: new Map(),
  currentJobId: null,
  completedJobs: [],
  loading: false,
  error: null,

  // Actions
  startJob: (job) =>
    set((state) => {
      const newJobs = new Map(state.activeJobs);
      newJobs.set(job.id, job);
      return {
        activeJobs: newJobs,
        currentJobId: job.id,
        error: null,
      };
    }),

  updateJobProgress: (jobId, progress) =>
    set((state) => {
      const newJobs = new Map(state.activeJobs);
      const job = newJobs.get(jobId);
      if (job) {
        newJobs.set(jobId, { ...job, progress });
      }
      return { activeJobs: newJobs };
    }),

  updateJobStatus: (jobId, status) =>
    set((state) => {
      const newJobs = new Map(state.activeJobs);
      const job = newJobs.get(jobId);
      if (job) {
        newJobs.set(jobId, {
          ...job,
          status,
          startedAt: status === 'running' ? new Date().toISOString() : job.startedAt,
        });
      }
      return { activeJobs: newJobs };
    }),

  completeJob: (jobId, result) =>
    set((state) => {
      const newJobs = new Map(state.activeJobs);
      const job = newJobs.get(jobId);

      if (job) {
        const completedJob: ResearchJob = {
          ...job,
          status: 'completed',
          result: result ?? job.result,
          completedAt: new Date().toISOString(),
        };

        newJobs.delete(jobId);

        return {
          activeJobs: newJobs,
          completedJobs: [completedJob, ...state.completedJobs],
          currentJobId: state.currentJobId === jobId ? null : state.currentJobId,
        };
      }

      return {};
    }),

  failJob: (jobId, error) =>
    set((state) => {
      const newJobs = new Map(state.activeJobs);
      const job = newJobs.get(jobId);

      if (job) {
        newJobs.set(jobId, {
          ...job,
          status: 'failed',
          completedAt: new Date().toISOString(),
        });
      }

      return {
        activeJobs: newJobs,
        error: `Job ${jobId} failed: ${error}`,
      };
    }),

  removeJob: (jobId) =>
    set((state) => {
      const newJobs = new Map(state.activeJobs);
      newJobs.delete(jobId);
      return {
        activeJobs: newJobs,
        currentJobId: state.currentJobId === jobId ? null : state.currentJobId,
        completedJobs: state.completedJobs.filter((j) => j.id !== jobId),
      };
    }),

  setCurrentJob: (jobId) => set({ currentJobId: jobId }),

  // Loading/error
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  // Computed
  getCurrentJob: () => {
    const { activeJobs, currentJobId } = get();
    return currentJobId ? activeJobs.get(currentJobId) ?? null : null;
  },

  getJob: (jobId) => {
    const { activeJobs, completedJobs } = get();
    return activeJobs.get(jobId) ?? completedJobs.find((j) => j.id === jobId);
  },

  getActiveJobCount: () => get().activeJobs.size,

  getJobsByType: (type) => {
    const { activeJobs, completedJobs } = get();
    const all = [...activeJobs.values(), ...completedJobs];
    return all.filter((j) => j.jobType === type);
  },

  getJobProgress: (jobId) => {
    const job = get().getJob(jobId);
    if (!job) return null;

    const completedSteps = job.progress.filter((s) => s.status === 'completed').length;
    const totalSteps = job.progress.length;
    const percent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const currentStep = job.progress.find((s) => s.status === 'running') ?? null;

    return { completedSteps, totalSteps, percent, currentStep };
  },
}));
