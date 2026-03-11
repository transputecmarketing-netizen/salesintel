import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Send,
  Building2,
  Radio,
  TrendingUp,
  User,
  Share2,
  Bookmark,
} from "lucide-react";

/* Mock signal detail data */
const signal = {
  id: "sig-1",
  type: "leadership",
  severity: "critical",
  company: "Stripe",
  companySlug: "stripe",
  logo: "S",
  logoColor: "#635BFF",
  title: "New CTO Appointed — David Singleton from Google Cloud",
  summary:
    "Stripe has appointed David Singleton as their new CTO. Singleton previously led Google Cloud's infrastructure division and is known for championing AI-first platform strategies.",
  fullAnalysis: `Stripe's appointment of David Singleton as CTO represents a significant strategic shift. Singleton spent 12 years at Google, most recently leading the Cloud Infrastructure division where he oversaw a $26B revenue business unit.

Key implications for our opportunity:
1. **Technology Re-evaluation**: Singleton is known for consolidating vendor relationships and building platform-first architectures. Expect a comprehensive review of existing tooling within 90 days.
2. **AI-First Strategy**: His track record at Google suggests Stripe will double down on AI capabilities, creating potential alignment with our ML observability offerings.
3. **Enterprise Acceleration**: Singleton led Google Cloud's enterprise sales motion — this signals Stripe's intent to accelerate their enterprise push.

Our intelligence suggests the first 60 days of his tenure will involve a full technology audit. This creates a narrow but high-value window for introductions.`,
  source: "TechCrunch",
  sourceUrl: "https://techcrunch.com/example",
  time: "2 hours ago",
  intent: 92,
  relatedSignals: [
    "Stripe engineering team grew 15% in Q4",
    "New VP Engineering hired from Meta",
    "AI research lab announcement",
  ],
  suggestedActions: [
    "Draft congratulatory message to David Singleton via LinkedIn",
    "Prepare a tailored demo focused on infrastructure observability",
    "Brief champion (Sarah Chen, VP Eng) on how we align with Singleton's priorities",
  ],
};

const typeColors: Record<string, string> = {
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

export default async function SignalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back link */}
      <Link
        href="/signals"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Signals
      </Link>

      {/* Header card */}
      <div
        className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6"
        style={{
          borderLeftWidth: "4px",
          borderLeftColor: typeColors[signal.type],
        }}
      >
        {/* Badges row */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize"
            style={{
              backgroundColor: `color-mix(in srgb, ${typeColors[signal.type]} 15%, transparent)`,
              color: typeColors[signal.type],
            }}
          >
            {signal.type}
          </span>
          <span
            className="flex items-center gap-1 text-[10px] font-medium uppercase"
            style={{ color: severityColors[signal.severity] }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: severityColors[signal.severity] }}
            />
            {signal.severity} priority
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
            <Clock className="h-3 w-3" />
            {signal.time}
          </span>
        </div>

        {/* Company */}
        <Link
          href={`/company/${signal.companySlug}`}
          className="mb-3 inline-flex items-center gap-2"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-xs font-bold text-white"
            style={{ backgroundColor: signal.logoColor }}
          >
            {signal.logo}
          </div>
          <span className="text-base font-medium text-[var(--text-primary)] hover:text-[var(--accent)]">
            {signal.company}
          </span>
        </Link>

        {/* Title */}
        <h1 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
          {signal.title}
        </h1>

        {/* Summary */}
        <p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
          {signal.summary}
        </p>

        {/* Intent + source */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)]">
              Buying Intent
            </span>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--bg-hover)]">
              <div
                className="h-full rounded-full bg-[var(--signal-critical)]"
                style={{ width: `${signal.intent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[var(--signal-critical)]">
              {signal.intent}%
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
            <ExternalLink className="h-3 w-3" />
            {signal.source}
          </span>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex items-center gap-2 border-t border-[var(--border-subtle)] pt-4">
          <button className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors">
            <Send className="h-3.5 w-3.5" />
            Draft Outreach
          </button>
          <button className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
            <Bookmark className="h-3.5 w-3.5" />
            Save
          </button>
          <button className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* Full Analysis */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
          AI Analysis
        </h2>
        <div className="prose-sm text-sm leading-relaxed whitespace-pre-line text-[var(--text-secondary)]">
          {signal.fullAnalysis}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Related Signals */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            Related Signals
          </h3>
          <ul className="space-y-2">
            {signal.relatedSignals.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
              >
                <Radio className="mt-0.5 h-3 w-3 shrink-0 text-[var(--text-tertiary)]" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Suggested Actions */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            Suggested Actions
          </h3>
          <ul className="space-y-2">
            {signal.suggestedActions.map((a, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
              >
                <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-[var(--accent)]" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
