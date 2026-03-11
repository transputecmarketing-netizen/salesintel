"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Target,
  Plug,
  Building2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Zap,
  Plus,
  X,
  Search,
} from "lucide-react";

const stepsMeta = [
  {
    number: 1,
    title: "Define Your ICP",
    description: "Tell us about your ideal customer",
    icon: Target,
  },
  {
    number: 2,
    title: "Connect Integrations",
    description: "Link your sales stack",
    icon: Plug,
  },
  {
    number: 3,
    title: "Add First Target",
    description: "Start tracking a company",
    icon: Building2,
  },
];

const industries = [
  "SaaS / Cloud",
  "Fintech",
  "Healthcare",
  "E-commerce",
  "Cybersecurity",
  "DevTools",
  "AI / ML",
  "Data & Analytics",
  "EdTech",
  "Logistics",
];

const companySizes = [
  "1–50",
  "51–200",
  "201–1,000",
  "1,001–5,000",
  "5,001–10,000",
  "10,000+",
];

const techPreferences = [
  "AWS",
  "GCP",
  "Azure",
  "Kubernetes",
  "React",
  "Python",
  "Snowflake",
  "Databricks",
  "Terraform",
  "Docker",
  "PostgreSQL",
  "MongoDB",
];

const integrations = [
  { name: "Salesforce", icon: "SF", color: "#00A1E0", connected: false },
  { name: "HubSpot", icon: "HS", color: "#FF7A59", connected: false },
  { name: "Slack", icon: "SL", color: "#4A154B", connected: false },
  { name: "Gmail", icon: "GM", color: "#EA4335", connected: false },
  { name: "LinkedIn Sales Navigator", icon: "LI", color: "#0A66C2", connected: false },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);
  const [targetCompany, setTargetCompany] = useState("");

  const toggleItem = (
    item: string,
    list: string[],
    setter: (v: string[]) => void
  ) => {
    setter(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  };

  const canNext =
    currentStep === 0
      ? selectedIndustries.length > 0
      : currentStep === 1
        ? true
        : targetCompany.length > 0;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-2xl flex-col">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--accent)] shadow-[var(--shadow-glow)]">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Welcome to SalesIntel
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Let&apos;s set up your account in 3 quick steps
        </p>
      </div>

      {/* Step indicators */}
      <div className="mb-8 flex items-center justify-center gap-4">
        {stepsMeta.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                i < currentStep
                  ? "bg-[var(--signal-positive)] text-white"
                  : i === currentStep
                    ? "bg-[var(--accent)] text-white shadow-[var(--shadow-glow)]"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
              )}
            >
              {i < currentStep ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={cn(
                "hidden text-xs sm:inline",
                i === currentStep
                  ? "font-medium text-[var(--text-primary)]"
                  : "text-[var(--text-tertiary)]"
              )}
            >
              {step.title}
            </span>
            {i < stepsMeta.length - 1 && (
              <div
                className={cn(
                  "h-px w-8",
                  i < currentStep
                    ? "bg-[var(--signal-positive)]"
                    : "bg-[var(--border-subtle)]"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        {/* Step 1: ICP */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                Define Your Ideal Customer Profile
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Select the characteristics of companies you sell to. This helps
                us prioritize the right signals.
              </p>
            </div>

            {/* Industries */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                Target Industries
              </label>
              <div className="flex flex-wrap gap-2">
                {industries.map((ind) => (
                  <button
                    key={ind}
                    onClick={() =>
                      toggleItem(ind, selectedIndustries, setSelectedIndustries)
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition-colors",
                      selectedIndustries.includes(ind)
                        ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                        : "border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            {/* Company Size */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                Company Size (employees)
              </label>
              <div className="flex flex-wrap gap-2">
                {companySizes.map((size) => (
                  <button
                    key={size}
                    onClick={() =>
                      toggleItem(size, selectedSizes, setSelectedSizes)
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition-colors",
                      selectedSizes.includes(size)
                        ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                        : "border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                Tech Stack Preferences (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {techPreferences.map((tech) => (
                  <button
                    key={tech}
                    onClick={() =>
                      toggleItem(tech, selectedTech, setSelectedTech)
                    }
                    className={cn(
                      "rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs transition-colors",
                      selectedTech.includes(tech)
                        ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                        : "border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Integrations */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                Connect Your Sales Stack
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Link your tools for seamless intelligence workflow. You can
                always add more later.
              </p>
            </div>

            <div className="space-y-3">
              {integrations.map((integration) => {
                const isConnected = connectedIntegrations.includes(
                  integration.name
                );
                return (
                  <div
                    key={integration.name}
                    className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-xs font-bold text-white"
                        style={{ backgroundColor: integration.color }}
                      >
                        {integration.icon}
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {integration.name}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        toggleItem(
                          integration.name,
                          connectedIntegrations,
                          setConnectedIntegrations
                        )
                      }
                      className={cn(
                        "rounded-[var(--radius-md)] px-4 py-2 text-xs font-medium transition-colors",
                        isConnected
                          ? "bg-[var(--signal-positive)] text-white"
                          : "border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                      )}
                    >
                      {isConnected ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Connected
                        </span>
                      ) : (
                        "Connect"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-[var(--text-tertiary)]">
              You can skip this step and connect integrations later from
              Settings.
            </p>
          </div>
        )}

        {/* Step 3: Add First Target */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                Add Your First Target Company
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Enter a company name or domain. We&apos;ll start researching
                immediately and deliver your first intelligence report.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="Enter company name or domain (e.g. stripe.com)"
                className="w-full rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-tertiary)] py-4 pl-12 pr-4 text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:shadow-[var(--shadow-glow)] transition-all"
              />
            </div>

            {targetCompany && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--accent-subtle)] bg-[var(--accent-subtle)] p-4">
                <div className="flex items-center gap-2 text-sm text-[var(--accent)]">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">
                    Ready to research &ldquo;{targetCompany}&rdquo;
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  We&apos;ll analyze their company profile, leadership,
                  technology stack, buying signals, and competitive landscape.
                  Your first report will be ready in about 30 seconds.
                </p>
              </div>
            )}

            <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-4">
              <h3 className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
                Popular targets to get started:
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Stripe", "Figma", "Datadog", "Notion", "Linear", "Vercel"].map(
                  (name) => (
                    <button
                      key={name}
                      onClick={() => setTargetCompany(name)}
                      className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                    >
                      {name}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          className={cn(
            "flex items-center gap-1 rounded-[var(--radius-md)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors",
            currentStep === 0
              ? "invisible"
              : "hover:bg-[var(--bg-hover)]"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {currentStep < 2 ? (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canNext}
            className={cn(
              "flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors",
              canNext
                ? "hover:bg-[var(--accent-hover)] shadow-[var(--shadow-glow)]"
                : "opacity-50 cursor-not-allowed"
            )}
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            disabled={!canNext}
            className={cn(
              "flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors",
              canNext
                ? "hover:bg-[var(--accent-hover)] shadow-[var(--shadow-glow)]"
                : "opacity-50 cursor-not-allowed"
            )}
          >
            <Zap className="h-4 w-4" />
            Start Researching
          </button>
        )}
      </div>

      {/* Skip link */}
      <div className="mt-4 text-center">
        <button className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:underline">
          Skip setup and explore the dashboard
        </button>
      </div>
    </div>
  );
}
