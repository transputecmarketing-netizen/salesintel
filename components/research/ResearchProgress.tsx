"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import type { ResearchStep } from "@/types/research";
import ResearchStepComponent from "./ResearchStep";

interface ResearchProgressProps {
  steps?: ResearchStep[];
  className?: string;
}

const mockSteps: ResearchStep[] = [
  {
    step: "domain_lookup",
    label: "Domain & Company Lookup",
    status: "completed",
    startedAt: "2025-12-10T14:30:00Z",
    completedAt: "2025-12-10T14:30:02Z",
    duration: 1200,
    resultPreview: "Found: Datadog Inc. (NASDAQ: DDOG)",
    error: null,
  },
  {
    step: "enrichment",
    label: "Enriching Company Data",
    status: "completed",
    startedAt: "2025-12-10T14:30:02Z",
    completedAt: "2025-12-10T14:30:05Z",
    duration: 2800,
    resultPreview: "850 employees, Series F, $2.1B valuation",
    error: null,
  },
  {
    step: "signal_detection",
    label: "Scanning for Buying Signals",
    status: "completed",
    startedAt: "2025-12-10T14:30:05Z",
    completedAt: "2025-12-10T14:30:09Z",
    duration: 4200,
    resultPreview: "8 signals detected across 4 categories",
    error: null,
  },
  {
    step: "contact_discovery",
    label: "Discovering Key Contacts",
    status: "running",
    startedAt: "2025-12-10T14:30:09Z",
    completedAt: null,
    duration: null,
    resultPreview: null,
    error: null,
  },
  {
    step: "scoring",
    label: "Computing Health & Propensity Scores",
    status: "pending",
    startedAt: null,
    completedAt: null,
    duration: null,
    resultPreview: null,
    error: null,
  },
  {
    step: "narrative",
    label: "Generating Why Now Narrative",
    status: "pending",
    startedAt: null,
    completedAt: null,
    duration: null,
    resultPreview: null,
    error: null,
  },
  {
    step: "outreach",
    label: "Drafting Outreach Messages",
    status: "pending",
    startedAt: null,
    completedAt: null,
    duration: null,
    resultPreview: null,
    error: null,
  },
];

export default function ResearchProgress({ steps, className }: ResearchProgressProps) {
  const items = steps?.length ? steps : mockSteps;
  const completedCount = items.filter((s) => s.status === "completed").length;
  const progress = (completedCount / items.length) * 100;

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-primary)] animate-pulse" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Research in Progress
          </h3>
          <span className="text-[11px] text-[var(--text-tertiary)] ml-auto tabular-nums">
            {completedCount} / {items.length} steps
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-[var(--border-primary)]">
        {items.map((step) => (
          <ResearchStepComponent key={step.step} step={step} />
        ))}
      </div>
    </div>
  );
}
