"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Radio,
  AlertTriangle,
  Users,
  DollarSign,
  Globe,
  Cpu,
  Swords,
  TrendingUp,
  ExternalLink,
  Clock,
  Send,
  X,
  Filter,
  ArrowUpRight,
  Flame,
  BarChart3,
  Settings,
  ChevronRight,
} from "lucide-react";

/* ─── Mock signals ─── */
const signals = [
  {
    id: "sig-1",
    type: "leadership",
    severity: "critical",
    company: "Stripe",
    companySlug: "stripe",
    logo: "S",
    logoColor: "#635BFF",
    title: "New CTO Appointed — David Singleton from Google Cloud",
    summary:
      "Stripe has appointed David Singleton as their new CTO, replacing the outgoing Cris. Singleton previously led Google Cloud's infrastructure division and is known for championing AI-first platform strategies. This leadership change signals a potential re-evaluation of their tech stack and vendor relationships.",
    source: "TechCrunch",
    time: "2h ago",
    intent: 92,
  },
  {
    id: "sig-2",
    type: "funding",
    severity: "high",
    company: "Figma",
    companySlug: "figma",
    logo: "F",
    logoColor: "#A259FF",
    title: "Series D — $200M at $12.5B Valuation",
    summary:
      "Figma has closed a $200M Series D round led by a16z. The company plans to use the funds for enterprise expansion and AI features. With fresh capital, expect accelerated hiring and platform investments over the next 6-12 months.",
    source: "Bloomberg",
    time: "6h ago",
    intent: 78,
  },
  {
    id: "sig-3",
    type: "expansion",
    severity: "high",
    company: "Datadog",
    companySlug: "datadog",
    logo: "D",
    logoColor: "#632CA6",
    title: "APAC Expansion — New Sydney Office, 200 Headcount Target",
    summary:
      "Datadog is expanding into the Asia-Pacific region with a new Sydney headquarters. They plan to hire 200 employees in the region by Q3. This represents a major geographic expansion and new budget allocation.",
    source: "AFR",
    time: "1d ago",
    intent: 71,
  },
  {
    id: "sig-4",
    type: "hiring",
    severity: "medium",
    company: "Linear",
    companySlug: "linear",
    logo: "L",
    logoColor: "#5E6AD2",
    title: "Engineering Team Grew 30% in Q4 — 15 New Hires",
    summary:
      "Linear has been on an aggressive hiring spree, adding 15 engineers in Q4 alone. The roles span infrastructure, security, and platform teams — suggesting investment in enterprise readiness and compliance capabilities.",
    source: "LinkedIn",
    time: "3d ago",
    intent: 55,
  },
  {
    id: "sig-5",
    type: "competitive",
    severity: "critical",
    company: "Notion",
    companySlug: "notion",
    logo: "N",
    logoColor: "#000",
    title: "Competitor Contract Expires in 30 Days — Confluence Enterprise",
    summary:
      "Our intelligence indicates Notion's enterprise Confluence license expires on April 10th. Multiple internal discussions suggest dissatisfaction with the current solution. This represents a high-priority displacement opportunity.",
    source: "Internal Signal",
    time: "1d ago",
    intent: 95,
  },
  {
    id: "sig-6",
    type: "technology",
    severity: "medium",
    company: "Vercel",
    companySlug: "vercel",
    logo: "V",
    logoColor: "#fff",
    title: "Adopted Kubernetes — Migrating from Custom Orchestration",
    summary:
      "Vercel engineering blog revealed a migration to Kubernetes for their edge infrastructure. This tech stack shift may create opportunities for complementary tooling and monitoring solutions.",
    source: "Vercel Blog",
    time: "4d ago",
    intent: 48,
  },
];

const tabs = [
  { id: "all", label: "All Alerts", icon: Radio },
  { id: "critical", label: "High Priority", icon: AlertTriangle },
  { id: "hiring", label: "New Hires", icon: Users },
  { id: "funding", label: "Funding", icon: DollarSign },
  { id: "expansion", label: "Expansion", icon: Globe },
  { id: "technology", label: "Tech Stack", icon: Cpu },
  { id: "competitive", label: "Competitive", icon: Swords },
];

const typeBorderColors: Record<string, string> = {
  leadership: "var(--badge-leadership)",
  funding: "var(--badge-funding)",
  expansion: "var(--badge-expansion)",
  hiring: "var(--badge-hiring)",
  competitive: "var(--badge-competitive)",
  technology: "var(--badge-technology)",
};

const severityColors: Record<string, string> = {
  critical: "var(--signal-critical)",
  high: "var(--signal-high)",
  medium: "var(--signal-medium)",
  low: "var(--signal-low)",
};

export default function SignalsPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filtered =
    activeTab === "all"
      ? signals
      : activeTab === "critical"
        ? signals.filter((s) => s.severity === "critical")
        : signals.filter((s) => s.type === activeTab);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Signal Alerts
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Real-time buying signals and intelligence across your target accounts
        </p>
      </div>

      {/* Tab Bar */}
      <div className="mb-6 flex items-center gap-1 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main layout: signals + right sidebar */}
      <div className="flex gap-6">
        {/* Signal cards — 2/3 width */}
        <div className="flex-1 space-y-3 min-w-0">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] py-16 text-center">
              <Radio className="mb-3 h-8 w-8 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                No signals match this filter.
              </p>
            </div>
          )}

          {filtered.map((sig) => (
            <div
              key={sig.id}
              className="relative rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 transition-all hover:border-[var(--border-default)]"
              style={{
                borderLeftWidth: "3px",
                borderLeftColor:
                  typeBorderColors[sig.type] || "var(--text-tertiary)",
              }}
            >
              {/* Top row: badge + severity + time */}
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${typeBorderColors[sig.type]} 15%, transparent)`,
                    color: typeBorderColors[sig.type],
                  }}
                >
                  {sig.type}
                </span>
                <span
                  className="flex items-center gap-1 text-[10px] font-medium uppercase"
                  style={{ color: severityColors[sig.severity] }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: severityColors[sig.severity],
                    }}
                  />
                  {sig.severity}
                </span>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                  <Clock className="h-3 w-3" />
                  {sig.time}
                </span>
              </div>

              {/* Company info */}
              <Link
                href={`/company/${sig.companySlug}`}
                className="mb-2 flex items-center gap-2"
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: sig.logoColor }}
                >
                  {sig.logo}
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)]">
                  {sig.company}
                </span>
              </Link>

              {/* Title */}
              <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
                {sig.title}
              </h3>

              {/* AI Summary */}
              <p className="mb-4 text-xs leading-relaxed text-[var(--text-secondary)]">
                {sig.summary}
              </p>

              {/* Bottom row: source + intent + actions */}
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                  <ExternalLink className="h-3 w-3" />
                  {sig.source}
                </span>

                {/* Intent bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    Intent
                  </span>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--bg-hover)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${sig.intent}%`,
                        backgroundColor:
                          sig.intent >= 80
                            ? "var(--signal-critical)"
                            : sig.intent >= 60
                              ? "var(--signal-high)"
                              : "var(--signal-medium)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
                    {sig.intent}%
                  </span>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button className="rounded-[var(--radius-sm)] px-3 py-1.5 text-[11px] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors">
                    Dismiss
                  </button>
                  <button className="flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--accent-subtle)] px-3 py-1.5 text-[11px] font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors">
                    <Send className="h-3 w-3" />
                    Draft Outreach
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right sidebar — 1/3 width */}
        <aside className="hidden w-72 shrink-0 space-y-4 lg:block">
          {/* Alert Trends */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
              Alert Trends
            </h3>
            <div className="space-y-3">
              {[
                { label: "Hiring Signals", count: 23, change: "+12%", color: "var(--badge-hiring)" },
                { label: "Funding Events", count: 8, change: "+5%", color: "var(--badge-funding)" },
                { label: "Leadership Changes", count: 5, change: "+20%", color: "var(--badge-leadership)" },
                { label: "Tech Stack Shifts", count: 11, change: "-3%", color: "var(--badge-technology)" },
              ].map((trend) => (
                <div key={trend.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: trend.color }}
                    />
                    <span className="text-xs text-[var(--text-secondary)]">
                      {trend.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {trend.count}
                    </span>
                    <span
                      className={cn(
                        "text-[10px]",
                        trend.change.startsWith("+")
                          ? "text-[var(--signal-positive)]"
                          : "text-[var(--signal-critical)]"
                      )}
                    >
                      {trend.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High-Intent Matches */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
              High-Intent Matches
            </h3>
            <div className="space-y-2.5">
              {[
                { company: "Stripe", intent: 95, logo: "S", color: "#635BFF" },
                { company: "Notion", intent: 92, logo: "N", color: "#000" },
                { company: "Figma", intent: 78, logo: "F", color: "#A259FF" },
              ].map((match) => (
                <Link
                  key={match.company}
                  href={`/company/${match.company.toLowerCase()}`}
                  className="flex items-center gap-2.5 rounded-[var(--radius-sm)] p-2 transition-colors hover:bg-[var(--bg-hover)]"
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded text-[10px] font-bold text-white"
                    style={{ backgroundColor: match.color }}
                  >
                    {match.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)]">
                      {match.company}
                    </p>
                    <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
                      <div
                        className="h-full rounded-full bg-[var(--signal-critical)]"
                        style={{ width: `${match.intent}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--signal-critical)]">
                    {match.intent}%
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Signal Settings */}
          <Link
            href="/settings/signals"
            className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 transition-colors hover:border-[var(--border-default)]"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-[var(--text-tertiary)]" />
              <span className="text-sm text-[var(--text-secondary)]">
                Signal Settings
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
