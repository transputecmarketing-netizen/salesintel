"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Radio,
  Bell,
  Volume2,
  VolumeX,
  AlertTriangle,
} from "lucide-react";

const signalCategories = [
  {
    id: "leadership",
    label: "Leadership Changes",
    description: "C-suite appointments, departures, and reorganizations",
    color: "var(--badge-leadership)",
    enabled: true,
    priority: "critical",
  },
  {
    id: "funding",
    label: "Funding Events",
    description: "Venture rounds, IPO filings, debt financing",
    color: "var(--badge-funding)",
    enabled: true,
    priority: "high",
  },
  {
    id: "hiring",
    label: "Hiring Signals",
    description: "Job posting surges, key role openings, team growth",
    color: "var(--badge-hiring)",
    enabled: true,
    priority: "medium",
  },
  {
    id: "expansion",
    label: "Expansion Events",
    description: "New offices, market entry, geographic expansion",
    color: "var(--badge-expansion)",
    enabled: true,
    priority: "high",
  },
  {
    id: "technology",
    label: "Tech Stack Changes",
    description: "Technology adoptions, migrations, open-source contributions",
    color: "var(--badge-technology)",
    enabled: true,
    priority: "medium",
  },
  {
    id: "competitive",
    label: "Competitive Signals",
    description: "Contract expirations, vendor reviews, competitor mentions",
    color: "var(--badge-competitive)",
    enabled: true,
    priority: "critical",
  },
  {
    id: "financial",
    label: "Financial Events",
    description: "Earnings reports, revenue changes, cost restructuring",
    color: "var(--badge-financial)",
    enabled: false,
    priority: "low",
  },
  {
    id: "partnership",
    label: "Partnerships & Alliances",
    description: "Strategic partnerships, joint ventures, channel deals",
    color: "var(--badge-expansion)",
    enabled: false,
    priority: "low",
  },
];

const priorityOptions = [
  { value: "critical", label: "Critical", color: "var(--signal-critical)" },
  { value: "high", label: "High", color: "var(--signal-high)" },
  { value: "medium", label: "Medium", color: "var(--signal-medium)" },
  { value: "low", label: "Low", color: "var(--signal-low)" },
];

export default function SignalSettingsPage() {
  const [signals, setSignals] = useState(signalCategories);
  const [globalAlerts, setGlobalAlerts] = useState(true);

  const toggleSignal = (id: string) => {
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const updatePriority = (id: string, priority: string) => {
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, priority } : s))
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          Signal Preferences
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Configure which signals to track and their alert priority
        </p>
      </div>

      {/* Global toggle */}
      <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
        <div className="flex items-center gap-3">
          {globalAlerts ? (
            <Volume2 className="h-5 w-5 text-[var(--accent)]" />
          ) : (
            <VolumeX className="h-5 w-5 text-[var(--text-tertiary)]" />
          )}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Signal Alerts
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              {globalAlerts ? "Actively monitoring signals" : "All signals paused"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setGlobalAlerts(!globalAlerts)}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            globalAlerts ? "bg-[var(--accent)]" : "bg-[var(--bg-hover)]"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              globalAlerts ? "left-[22px]" : "left-0.5"
            )}
          />
        </button>
      </div>

      {/* Signal categories */}
      <div className="space-y-3">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className={cn(
              "rounded-[var(--radius-lg)] border bg-[var(--bg-secondary)] p-5 transition-all",
              signal.enabled
                ? "border-[var(--border-subtle)]"
                : "border-[var(--border-subtle)] opacity-60"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: signal.color }}
                />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {signal.label}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {signal.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleSignal(signal.id)}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  signal.enabled ? "bg-[var(--accent)]" : "bg-[var(--bg-hover)]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    signal.enabled ? "left-[22px]" : "left-0.5"
                  )}
                />
              </button>
            </div>

            {signal.enabled && (
              <div className="mt-3 flex items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  Alert Priority:
                </span>
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updatePriority(signal.id, opt.value)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors",
                      signal.priority === opt.value
                        ? "text-white"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    )}
                    style={{
                      backgroundColor:
                        signal.priority === opt.value
                          ? opt.color
                          : "var(--bg-tertiary)",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button className="rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors">
          Save Preferences
        </button>
      </div>
    </div>
  );
}
