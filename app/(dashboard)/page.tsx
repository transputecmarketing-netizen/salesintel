"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Search,
  Mail,
  ArrowRight,
  Sparkles,
  Users,
  Radio,
  Building2,
  TrendingUp,
  AlertTriangle,
  Clock,
  ChevronRight,
  Zap,
  Target,
  BarChart3,
  ExternalLink,
} from "lucide-react";

/* ─── Mock data ─── */
const morningBriefing = [
  {
    company: "Stripe",
    logo: "S",
    color: "#635BFF",
    reason: "New CTO appointment + 40% hiring surge in engineering",
    urgency: "critical" as const,
    action: "Draft congratulatory outreach",
    href: "/company/stripe",
  },
  {
    company: "Datadog",
    logo: "D",
    color: "#632CA6",
    reason: "Series expansion into APAC — opened Sydney office",
    urgency: "high" as const,
    action: "Update account strategy",
    href: "/company/datadog",
  },
  {
    company: "Notion",
    logo: "N",
    color: "#000",
    reason: "Competitor contract expires in 30 days",
    urgency: "high" as const,
    action: "Schedule discovery call",
    href: "/company/notion",
  },
];

const recentReports = [
  {
    company: "Figma",
    logo: "F",
    color: "#A259FF",
    date: "2h ago",
    score: 87,
    signals: 5,
  },
  {
    company: "Linear",
    logo: "L",
    color: "#5E6AD2",
    date: "5h ago",
    score: 72,
    signals: 3,
  },
  {
    company: "Vercel",
    logo: "V",
    color: "#fff",
    date: "1d ago",
    score: 91,
    signals: 8,
  },
  {
    company: "Supabase",
    logo: "S",
    color: "#3ECF8E",
    date: "1d ago",
    score: 65,
    signals: 2,
  },
  {
    company: "PlanetScale",
    logo: "P",
    color: "#000",
    date: "2d ago",
    score: 58,
    signals: 4,
  },
];

const urgencyColors = {
  critical: "var(--signal-critical)",
  high: "var(--signal-high)",
  medium: "var(--signal-medium)",
  low: "var(--signal-low)",
};

export default function DashboardPage() {
  const [companyQuery, setCompanyQuery] = useState("");
  const [emailQuery, setEmailQuery] = useState("");

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* ──── Search Hero ──── */}
      <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--bg-secondary)] via-[var(--bg-secondary)] to-[var(--accent-subtle)] p-8">
        {/* Glow effect */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[var(--accent-glow)] blur-[100px]" />

        <div className="relative">
          <h1 className="mb-1 text-2xl font-bold text-[var(--text-primary)]">
            Good morning, Alex
          </h1>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            3 accounts need your attention today &middot; 12 new signals detected
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
                placeholder="Enter company name…"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-tertiary)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:shadow-[var(--shadow-glow)] transition-all"
              />
            </div>
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                value={emailQuery}
                onChange={(e) => setEmailQuery(e.target.value)}
                placeholder="Or paste an email address…"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-tertiary)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:shadow-[var(--shadow-glow)] transition-all"
              />
            </div>
            <button className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white shadow-[var(--shadow-glow)] hover:bg-[var(--accent-hover)] transition-colors">
              <Search className="h-4 w-4" />
              Research
            </button>
          </div>
        </div>
      </section>

      {/* ──── Quick Action Cards ──── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="group rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 transition-all hover:border-[var(--accent)] hover:shadow-[var(--shadow-glow)] cursor-pointer">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-subtle)]">
            <Sparkles className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
            Pro Tip
          </h3>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            Stripe&apos;s new CTO previously led infrastructure at Google Cloud.
            Reference his GCP keynote on distributed systems for a warm opener.
          </p>
        </div>

        <div className="group rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 transition-all hover:border-[var(--badge-hiring)] cursor-pointer">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[rgba(6,182,212,0.12)]">
            <Users className="h-5 w-5 text-[var(--badge-hiring)]" />
          </div>
          <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
            C-Level Mapping
          </h3>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            4 target accounts have had executive changes this month. Map new
            decision-makers and update your champion strategy.
          </p>
        </div>

        <div className="group rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 transition-all hover:border-[var(--signal-high)] cursor-pointer">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[rgba(245,158,11,0.12)]">
            <Radio className="h-5 w-5 text-[var(--signal-high)]" />
          </div>
          <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
            Signal Boost
          </h3>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            12 new buying signals across your target accounts. 3 are high-intent
            funding and expansion events.
          </p>
        </div>
      </section>

      {/* ──── Morning Briefing ──── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--signal-high)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Morning Briefing
            </h2>
          </div>
          <span className="text-xs text-[var(--text-tertiary)]">
            Updated 15 min ago
          </span>
        </div>

        <div className="space-y-3">
          {morningBriefing.map((item) => (
            <Link
              key={item.company}
              href={item.href}
              className="group flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 transition-all hover:border-[var(--border-default)] hover:bg-[var(--bg-hover)]"
            >
              {/* Urgency indicator */}
              <div
                className="h-10 w-1 shrink-0 rounded-full"
                style={{
                  backgroundColor: urgencyColors[item.urgency],
                }}
              />

              {/* Logo */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-sm font-bold text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.logo}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--text-primary)]">
                    {item.company}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${urgencyColors[item.urgency]} 15%, transparent)`,
                      color: urgencyColors[item.urgency],
                    }}
                  >
                    {item.urgency}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-[var(--text-secondary)]">
                  {item.reason}
                </p>
              </div>

              {/* Action */}
              <span className="hidden shrink-0 items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-xs text-[var(--text-secondary)] sm:flex group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] transition-colors">
                {item.action}
                <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ──── Recent Intelligence Reports ──── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Recent Intelligence Reports
            </h2>
          </div>
          <Link
            href="/targets"
            className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {recentReports.map((report) => (
            <Link
              key={report.company}
              href={`/company/${report.company.toLowerCase()}`}
              className="group min-w-[200px] shrink-0 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 transition-all hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)]"
            >
              {/* Header */}
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-xs font-bold"
                  style={{
                    backgroundColor: report.color,
                    color:
                      report.color === "#fff" || report.color === "#000"
                        ? report.color === "#fff"
                          ? "#000"
                          : "#fff"
                        : "#fff",
                  }}
                >
                  {report.logo}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {report.company}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    {report.date}
                  </p>
                </div>
              </div>

              {/* Score */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-[var(--text-tertiary)]">
                  Health Score
                </span>
                <span
                  className="text-sm font-bold"
                  style={{
                    color:
                      report.score >= 80
                        ? "var(--signal-positive)"
                        : report.score >= 60
                          ? "var(--signal-high)"
                          : "var(--signal-critical)",
                  }}
                >
                  {report.score}
                </span>
              </div>

              {/* Score bar */}
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg-hover)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${report.score}%`,
                    backgroundColor:
                      report.score >= 80
                        ? "var(--signal-positive)"
                        : report.score >= 60
                          ? "var(--signal-high)"
                          : "var(--signal-critical)",
                  }}
                />
              </div>

              {/* Signals count */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <Radio className="h-3 w-3" />
                {report.signals} active signals
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
