"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  TrendingUp,
  BarChart3,
  Target,
  Send,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Radio,
  Clock,
  Zap,
} from "lucide-react";

const patterns = [
  {
    title: "CTO Transitions Drive 3x Higher Response Rates",
    description:
      "Accounts with recent CTO changes respond to outreach 3.2x more than baseline. Best window: 2-4 weeks post-announcement. Reference their previous company's challenges for highest engagement.",
    impact: "high",
    metric: "3.2x",
    metricLabel: "response rate",
    category: "Win Pattern",
  },
  {
    title: "Funding Rounds Create 60-Day Buying Windows",
    description:
      "Post-funding accounts are 2.8x more likely to engage within 60 days. Series B+ companies show strongest intent. Lead with scaling infrastructure message.",
    impact: "high",
    metric: "2.8x",
    metricLabel: "engagement lift",
    category: "Win Pattern",
  },
  {
    title: "Multi-Threaded Deals Close 47% Faster",
    description:
      "Opportunities with 3+ stakeholder contacts close 47% faster than single-threaded deals. Focus on Champion + Decision Maker + Technical Evaluator combination.",
    impact: "medium",
    metric: "47%",
    metricLabel: "faster close",
    category: "Win Pattern",
  },
  {
    title: "Cold Outreach to Competitive Accounts Underperforms",
    description:
      "Direct competitive displacement emails have 8% response rate vs 22% for signal-triggered outreach. Use buying signals as conversation openers instead of feature comparisons.",
    impact: "high",
    metric: "8%",
    metricLabel: "response rate",
    category: "Loss Pattern",
  },
];

const signalEffectiveness = [
  { signal: "Leadership Change", wins: 34, total: 42, rate: 81 },
  { signal: "Funding Round", wins: 28, total: 38, rate: 74 },
  { signal: "Hiring Surge", wins: 19, total: 31, rate: 61 },
  { signal: "Competitive Displacement", wins: 15, total: 28, rate: 54 },
  { signal: "Tech Stack Change", wins: 12, total: 25, rate: 48 },
  { signal: "Expansion / New Office", wins: 9, total: 22, rate: 41 },
];

const outreachMetrics = [
  {
    label: "Emails Sent",
    value: "1,247",
    change: "+12%",
    positive: true,
  },
  {
    label: "Response Rate",
    value: "24.3%",
    change: "+3.1%",
    positive: true,
  },
  {
    label: "Meetings Booked",
    value: "87",
    change: "+8%",
    positive: true,
  },
  {
    label: "Pipeline Created",
    value: "$2.4M",
    change: "-5%",
    positive: false,
  },
];

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState("30d");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Insights
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Win/loss patterns, signal effectiveness, and outreach performance
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-1">
          {["7d", "30d", "90d", "All"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors",
                timeRange === range
                  ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Outreach Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {outreachMetrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4"
          >
            <p className="mb-1 text-xs text-[var(--text-tertiary)]">
              {metric.label}
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {metric.value}
            </p>
            <div className="mt-1 flex items-center gap-1 text-xs">
              {metric.positive ? (
                <ArrowUpRight className="h-3 w-3 text-[var(--signal-positive)]" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-[var(--signal-critical)]" />
              )}
              <span
                style={{
                  color: metric.positive
                    ? "var(--signal-positive)"
                    : "var(--signal-critical)",
                }}
              >
                {metric.change}
              </span>
              <span className="text-[var(--text-tertiary)]">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pattern Analysis */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Lightbulb className="h-4 w-4 text-[var(--signal-high)]" />
          Pattern Analysis
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {patterns.map((pattern, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                    pattern.category === "Win Pattern"
                      ? "bg-[rgba(16,185,129,0.12)] text-[var(--signal-positive)]"
                      : "bg-[rgba(239,68,68,0.12)] text-[var(--signal-critical)]"
                  )}
                >
                  {pattern.category === "Win Pattern" ? (
                    <CheckCircle2 className="mr-1 inline h-3 w-3" />
                  ) : (
                    <XCircle className="mr-1 inline h-3 w-3" />
                  )}
                  {pattern.category}
                </span>
                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {pattern.metric}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    {pattern.metricLabel}
                  </p>
                </div>
              </div>
              <h3 className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                {pattern.title}
              </h3>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {pattern.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Signal Effectiveness Chart */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Radio className="h-4 w-4 text-[var(--accent)]" />
          Signal Effectiveness — Win Rate by Signal Type
        </h2>
        <div className="space-y-3">
          {signalEffectiveness.map((item) => (
            <div key={item.signal} className="flex items-center gap-4">
              <span className="w-44 shrink-0 text-xs text-[var(--text-secondary)]">
                {item.signal}
              </span>
              <div className="flex-1">
                <div className="h-6 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-hover)]">
                  <div
                    className="flex h-full items-center rounded-[var(--radius-sm)] px-2 text-[10px] font-semibold text-white transition-all"
                    style={{
                      width: `${item.rate}%`,
                      backgroundColor:
                        item.rate >= 70
                          ? "var(--signal-positive)"
                          : item.rate >= 50
                            ? "var(--signal-high)"
                            : "var(--signal-medium)",
                    }}
                  >
                    {item.rate}%
                  </div>
                </div>
              </div>
              <span className="w-20 shrink-0 text-right text-xs text-[var(--text-tertiary)]">
                {item.wins}/{item.total} deals
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
