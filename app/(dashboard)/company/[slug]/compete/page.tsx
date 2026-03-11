import Link from "next/link";
import { ArrowLeft, Swords, Target, TrendingUp, Shield, AlertTriangle } from "lucide-react";

const competitors = [
  {
    name: "Competitor A — Legacy Vendor",
    status: "Incumbent",
    statusColor: "var(--signal-critical)",
    contractExpiry: "Apr 10, 2025",
    strengths: ["Deep integration", "Established relationships", "Custom SLAs"],
    weaknesses: ["Slow innovation", "High cost", "Poor developer experience"],
    displacement: 78,
  },
  {
    name: "Competitor B — Rising Challenger",
    status: "Evaluating",
    statusColor: "var(--signal-high)",
    contractExpiry: null,
    strengths: ["Modern UX", "Aggressive pricing", "AI features"],
    weaknesses: ["Limited enterprise features", "Small team", "No SOC 2"],
    displacement: 45,
  },
  {
    name: "Competitor C — Open Source Alternative",
    status: "Considering",
    statusColor: "var(--signal-medium)",
    contractExpiry: null,
    strengths: ["Free tier", "Community support", "Flexibility"],
    weaknesses: ["No support SLA", "Integration burden", "Security gaps"],
    displacement: 62,
  },
];

export default async function CompanyCompetePage({
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

      <div>
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-[var(--badge-competitive)]" />
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Competitive Landscape
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Intelligence on competitive positioning and displacement opportunities
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-gradient-to-r from-[var(--bg-secondary)] to-[rgba(239,68,68,0.05)] p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--signal-critical)]" />
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Key Competitive Insight
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              The incumbent vendor&apos;s contract expires in <strong className="text-[var(--signal-critical)]">30 days</strong>. Internal signals
              suggest dissatisfaction with performance and support responsiveness. Combined with the
              new CTO&apos;s history of vendor consolidation, this represents a prime displacement window.
            </p>
          </div>
        </div>
      </div>

      {/* Competitor cards */}
      <div className="space-y-4">
        {competitors.map((comp) => (
          <div
            key={comp.name}
            className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {comp.name}
                </h3>
                {comp.contractExpiry && (
                  <p className="mt-0.5 text-[10px] text-[var(--signal-critical)]">
                    Contract expires: {comp.contractExpiry}
                  </p>
                )}
              </div>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                style={{
                  backgroundColor: `color-mix(in srgb, ${comp.statusColor} 15%, transparent)`,
                  color: comp.statusColor,
                }}
              >
                {comp.status}
              </span>
            </div>

            {/* Displacement likelihood */}
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-[var(--text-tertiary)]">
                  Displacement Likelihood
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {comp.displacement}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-hover)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${comp.displacement}%`,
                    backgroundColor:
                      comp.displacement >= 70
                        ? "var(--signal-positive)"
                        : comp.displacement >= 50
                          ? "var(--signal-high)"
                          : "var(--signal-medium)",
                  }}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-1 text-[10px] font-medium text-[var(--signal-critical)]">
                  <Shield className="h-3 w-3" />
                  Their Strengths
                </p>
                <ul className="space-y-1">
                  {comp.strengths.map((s) => (
                    <li
                      key={s}
                      className="text-xs text-[var(--text-secondary)]"
                    >
                      &bull; {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1 text-[10px] font-medium text-[var(--signal-positive)]">
                  <Target className="h-3 w-3" />
                  Their Weaknesses
                </p>
                <ul className="space-y-1">
                  {comp.weaknesses.map((w) => (
                    <li
                      key={w}
                      className="text-xs text-[var(--text-secondary)]"
                    >
                      &bull; {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
