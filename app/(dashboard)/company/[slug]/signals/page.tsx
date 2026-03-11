import Link from "next/link";
import {
  ArrowLeft,
  Radio,
  Clock,
  ExternalLink,
  Filter,
  ChevronDown,
} from "lucide-react";

const signals = [
  {
    id: "1",
    type: "leadership",
    title: "New CTO Appointed — David Singleton from Google Cloud",
    source: "TechCrunch",
    date: "Mar 11, 2025",
    time: "2h ago",
    intent: 92,
    severity: "critical",
  },
  {
    id: "2",
    type: "hiring",
    title: "40% Increase in Engineering Job Postings",
    source: "LinkedIn",
    date: "Mar 10, 2025",
    time: "1d ago",
    intent: 68,
    severity: "high",
  },
  {
    id: "3",
    type: "expansion",
    title: "APAC Expansion — Singapore & Tokyo Office Plans",
    source: "AFR",
    date: "Mar 7, 2025",
    time: "4d ago",
    intent: 71,
    severity: "high",
  },
  {
    id: "4",
    type: "competitive",
    title: "Competitor Contract Renewal Window Opening",
    source: "Internal Signal",
    date: "Mar 3, 2025",
    time: "1w ago",
    intent: 95,
    severity: "critical",
  },
  {
    id: "5",
    type: "funding",
    title: "Series I Valuation Increase Rumored",
    source: "Bloomberg",
    date: "Feb 25, 2025",
    time: "2w ago",
    intent: 55,
    severity: "medium",
  },
  {
    id: "6",
    type: "technology",
    title: "New Security Compliance Certification (ISO 27701)",
    source: "Stripe Blog",
    date: "Feb 18, 2025",
    time: "3w ago",
    intent: 40,
    severity: "low",
  },
];

const typeColors: Record<string, string> = {
  leadership: "var(--badge-leadership)",
  hiring: "var(--badge-hiring)",
  expansion: "var(--badge-expansion)",
  competitive: "var(--badge-competitive)",
  funding: "var(--badge-funding)",
  technology: "var(--badge-technology)",
};

const severityColors: Record<string, string> = {
  critical: "var(--signal-critical)",
  high: "var(--signal-high)",
  medium: "var(--signal-medium)",
  low: "var(--signal-low)",
};

export default async function CompanySignalsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={`/company/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Company
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Signal History
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            All detected signals for this account
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
          <Filter className="h-3 w-3" />
          Filter
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Timeline */}
      <div className="relative space-y-4 pl-6">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border-subtle)]" />

        {signals.map((sig) => (
          <Link
            key={sig.id}
            href={`/signals/${sig.id}`}
            className="relative block rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 transition-all hover:border-[var(--border-default)] hover:bg-[var(--bg-hover)]"
            style={{
              borderLeftWidth: "3px",
              borderLeftColor: typeColors[sig.type],
            }}
          >
            <div
              className="absolute -left-[21px] top-5 h-3 w-3 rounded-full border-2 border-[var(--bg-primary)]"
              style={{ backgroundColor: typeColors[sig.type] }}
            />

            <div className="mb-2 flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                style={{
                  backgroundColor: `color-mix(in srgb, ${typeColors[sig.type]} 15%, transparent)`,
                  color: typeColors[sig.type],
                }}
              >
                {sig.type}
              </span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: severityColors[sig.severity] }}
              />
              <span className="ml-auto flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                <Clock className="h-3 w-3" />
                {sig.date}
              </span>
            </div>

            <h3 className="mb-1 text-sm font-medium text-[var(--text-primary)]">
              {sig.title}
            </h3>

            <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {sig.source}
              </span>
              <div className="flex items-center gap-1">
                <span>Intent:</span>
                <div className="h-1 w-16 overflow-hidden rounded-full bg-[var(--bg-hover)]">
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
                <span className="font-semibold">{sig.intent}%</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
