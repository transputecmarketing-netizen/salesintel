"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Crosshair,
  Radio,
  Activity,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  ExternalLink,
  ChevronDown,
  Building2,
  TrendingUp,
  Eye,
  Trash2,
  X,
} from "lucide-react";

/* ─── Mock data ─── */
const targets = [
  {
    id: "1",
    company: "Stripe",
    logo: "S",
    color: "#635BFF",
    industry: "Fintech",
    tier: "Tier 1",
    tierColor: "var(--signal-critical)",
    lastSignal: "New CTO appointed",
    lastSignalTime: "2h ago",
    signalType: "leadership",
    health: 87,
    buyingWindow: "0–30 days",
    windowUrgent: true,
    slug: "stripe",
  },
  {
    id: "2",
    company: "Datadog",
    logo: "D",
    color: "#632CA6",
    industry: "Observability",
    tier: "Tier 1",
    tierColor: "var(--signal-critical)",
    lastSignal: "APAC expansion announced",
    lastSignalTime: "6h ago",
    signalType: "expansion",
    health: 72,
    buyingWindow: "30–60 days",
    windowUrgent: false,
    slug: "datadog",
  },
  {
    id: "3",
    company: "Notion",
    logo: "N",
    color: "#000",
    industry: "Productivity",
    tier: "Tier 2",
    tierColor: "var(--signal-high)",
    lastSignal: "Competitor contract expiring",
    lastSignalTime: "1d ago",
    signalType: "competitive",
    health: 65,
    buyingWindow: "0–30 days",
    windowUrgent: true,
    slug: "notion",
  },
  {
    id: "4",
    company: "Figma",
    logo: "F",
    color: "#A259FF",
    industry: "Design Tools",
    tier: "Tier 1",
    tierColor: "var(--signal-critical)",
    lastSignal: "Series D — $200M raised",
    lastSignalTime: "3d ago",
    signalType: "funding",
    health: 91,
    buyingWindow: "30–60 days",
    windowUrgent: false,
    slug: "figma",
  },
  {
    id: "5",
    company: "Linear",
    logo: "L",
    color: "#5E6AD2",
    industry: "Dev Tools",
    tier: "Tier 2",
    tierColor: "var(--signal-high)",
    lastSignal: "Engineering team grew 30%",
    lastSignalTime: "1w ago",
    signalType: "hiring",
    health: 58,
    buyingWindow: "60–90 days",
    windowUrgent: false,
    slug: "linear",
  },
  {
    id: "6",
    company: "Vercel",
    logo: "V",
    color: "#fff",
    industry: "Cloud Platform",
    tier: "Tier 1",
    tierColor: "var(--signal-critical)",
    lastSignal: "New VP of Sales hired",
    lastSignalTime: "2d ago",
    signalType: "leadership",
    health: 83,
    buyingWindow: "30–60 days",
    windowUrgent: false,
    slug: "vercel",
  },
];

const signalBadgeColors: Record<string, string> = {
  leadership: "var(--badge-leadership)",
  expansion: "var(--badge-expansion)",
  competitive: "var(--badge-competitive)",
  funding: "var(--badge-funding)",
  hiring: "var(--badge-hiring)",
  technology: "var(--badge-technology)",
};

function healthColor(score: number) {
  if (score >= 75) return "var(--signal-positive)";
  if (score >= 50) return "var(--signal-high)";
  return "var(--signal-critical)";
}

export default function TargetsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = targets.filter(
    (t) =>
      t.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            My Targets
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Track and monitor your highest-priority accounts
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-glow)] hover:bg-[var(--accent-hover)] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Target
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
          <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <Crosshair className="h-3.5 w-3.5" />
            Total Targets
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            {targets.length}
          </p>
          <p className="mt-1 text-xs text-[var(--signal-positive)]">
            +2 this week
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
          <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <Radio className="h-3.5 w-3.5" />
            High Intent Signals Today
          </div>
          <p className="text-3xl font-bold text-[var(--signal-critical)]">5</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Across 3 accounts
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
          <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <Activity className="h-3.5 w-3.5" />
            Average Account Health
          </div>
          <p className="text-3xl font-bold text-[var(--signal-positive)]">
            76
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Up from 68 last week
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search targets…"
            className="w-60 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        {["Sector", "Tier", "Signal Status"].map((label) => (
          <button
            key={label}
            className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:border-[var(--border-default)] transition-colors"
          >
            <Filter className="h-3 w-3" />
            {label}
            <ChevronDown className="h-3 w-3" />
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
        {/* Header row */}
        <div className="grid grid-cols-[2fr_0.7fr_1.5fr_1fr_0.8fr_0.5fr] gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
          <span>Company</span>
          <span>Tier</span>
          <span>Last Signal</span>
          <span>Signal Health</span>
          <span>Buying Window</span>
          <span />
        </div>

        {/* Rows */}
        {filtered.map((t) => (
          <Link
            key={t.id}
            href={`/company/${t.slug}`}
            className="grid grid-cols-[2fr_0.7fr_1.5fr_1fr_0.8fr_0.5fr] gap-4 items-center border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] px-5 py-3.5 transition-colors hover:bg-[var(--bg-hover)]"
          >
            {/* Company */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-xs font-bold text-white"
                style={{ backgroundColor: t.color }}
              >
                {t.logo}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {t.company}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  {t.industry}
                </p>
              </div>
            </div>

            {/* Tier */}
            <span
              className="inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: `color-mix(in srgb, ${t.tierColor} 15%, transparent)`,
                color: t.tierColor,
              }}
            >
              {t.tier}
            </span>

            {/* Last Signal */}
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      signalBadgeColors[t.signalType] || "var(--text-tertiary)",
                  }}
                />
                <span className="truncate text-sm text-[var(--text-primary)]">
                  {t.lastSignal}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                {t.lastSignalTime}
              </p>
            </div>

            {/* Health bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span
                  className="font-semibold"
                  style={{ color: healthColor(t.health) }}
                >
                  {t.health}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-hover)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${t.health}%`,
                    backgroundColor: healthColor(t.health),
                  }}
                />
              </div>
            </div>

            {/* Buying Window */}
            <span
              className={cn(
                "text-xs font-medium",
                t.windowUrgent
                  ? "text-[var(--signal-critical)]"
                  : "text-[var(--text-secondary)]"
              )}
            >
              {t.buyingWindow}
            </span>

            {/* Actions */}
            <button
              onClick={(e) => e.preventDefault()}
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--bg-active)] hover:text-[var(--text-secondary)]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </Link>
        ))}
      </div>

      {/* ──── Add Target Modal ──── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 shadow-[var(--shadow-lg)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Add Target Company
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Company Name
                </label>
                <input
                  placeholder="e.g. Acme Corp"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Website / Domain
                </label>
                <input
                  placeholder="e.g. acme.com"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Tier
                </label>
                <select className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
                  <option>Tier 1 — Strategic</option>
                  <option>Tier 2 — High Priority</option>
                  <option>Tier 3 — Monitor</option>
                </select>
              </div>

              <button className="w-full rounded-[var(--radius-md)] bg-[var(--accent)] py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors">
                Add &amp; Start Research
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
