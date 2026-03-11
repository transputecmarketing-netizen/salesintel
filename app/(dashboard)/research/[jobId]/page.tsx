"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Circle,
  Clock,
  Building2,
  Users,
  Radio,
  FileText,
  Shield,
  TrendingUp,
  Cpu,
  Globe,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    icon: Building2,
    label: "Company Profile",
    preview: "Stripe, Inc. — Financial Technology — 8,000+ employees",
    duration: "1.2s",
  },
  {
    icon: Globe,
    label: "Web Presence Analysis",
    preview: "Scanning stripe.com, blog, careers page, press releases…",
    duration: "3.8s",
  },
  {
    icon: Users,
    label: "Leadership Mapping",
    preview: "Identified 12 key executives including new CTO David Singleton",
    duration: "2.4s",
  },
  {
    icon: Radio,
    label: "Signal Detection",
    preview: "Found 6 active buying signals across 4 categories",
    duration: "4.1s",
  },
  {
    icon: Cpu,
    label: "Tech Stack Discovery",
    preview: "Detected 24 technologies across 6 categories",
    duration: "2.8s",
  },
  {
    icon: Shield,
    label: "Competitive Analysis",
    preview: "3 competitors identified, 1 contract expiring soon",
    duration: "3.2s",
  },
  {
    icon: TrendingUp,
    label: "Propensity Scoring",
    preview: "Account Health: 87, Buying Intent: 78, Window: 0–30 days",
    duration: "1.5s",
  },
  {
    icon: Sparkles,
    label: "AI Synthesis",
    preview: 'Generating "Why Now" narrative and outreach recommendations…',
    duration: "5.2s",
  },
  {
    icon: FileText,
    label: "Report Generation",
    preview: "Compiling intelligence brief with actionable insights",
    duration: "1.8s",
  },
];

export default function ResearchPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progressive research steps
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const pct = Math.min(((currentStep + 1) / steps.length) * 100, 100);
    setProgress(pct);
  }, [currentStep]);

  const isComplete = currentStep >= steps.length - 1;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[#635BFF] text-lg font-bold text-white">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">
              Researching Stripe
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {isComplete
                ? "Research complete — intelligence report ready"
                : "Deep research in progress…"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-[var(--text-tertiary)]">
            {isComplete ? "Complete" : `Step ${currentStep + 1} of ${steps.length}`}
          </span>
          <span className="font-medium text-[var(--accent)]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-hover)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const status =
            i < currentStep
              ? "complete"
              : i === currentStep
                ? "active"
                : "pending";
          return (
            <div
              key={i}
              className={cn(
                "rounded-[var(--radius-lg)] border p-4 transition-all",
                status === "complete"
                  ? "border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
                  : status === "active"
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)] shadow-[var(--shadow-glow)]"
                    : "border-transparent bg-transparent opacity-40"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Status icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {status === "complete" ? (
                    <CheckCircle2 className="h-5 w-5 text-[var(--signal-positive)]" />
                  ) : status === "active" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
                  ) : (
                    <Circle className="h-5 w-5 text-[var(--text-tertiary)]" />
                  )}
                </div>

                {/* Step icon */}
                <step.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    status === "active"
                      ? "text-[var(--accent)]"
                      : status === "complete"
                        ? "text-[var(--text-secondary)]"
                        : "text-[var(--text-tertiary)]"
                  )}
                />

                {/* Label + preview */}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      status === "active"
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-primary)]"
                    )}
                  >
                    {step.label}
                  </p>
                  {(status === "complete" || status === "active") && (
                    <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">
                      {step.preview}
                    </p>
                  )}
                </div>

                {/* Duration */}
                {status === "complete" && (
                  <span className="flex shrink-0 items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                    <Clock className="h-3 w-3" />
                    {step.duration}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View Report button */}
      {isComplete && (
        <div className="flex justify-center">
          <Link
            href="/company/stripe"
            className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white shadow-[var(--shadow-glow)] hover:bg-[var(--accent-hover)] transition-colors"
          >
            <FileText className="h-4 w-4" />
            View Intelligence Report
          </Link>
        </div>
      )}
    </div>
  );
}
