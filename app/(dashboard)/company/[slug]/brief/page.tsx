import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Download,
  Share2,
  Printer,
  Building2,
  Users,
  Radio,
  TrendingUp,
  Shield,
  Sparkles,
} from "lucide-react";

export default async function CompanyBriefPage({
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              Intelligence Brief
            </h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Exportable account intelligence document
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
          <button className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
          <button className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--accent-hover)] transition-colors">
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Brief document */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8">
        {/* Title block */}
        <div className="mb-8 border-b border-[var(--border-subtle)] pb-6">
          <p className="mb-2 text-[10px] uppercase tracking-widest text-[var(--accent)]">
            SalesIntel Intelligence Brief
          </p>
          <h2 className="mb-1 text-2xl font-bold text-[var(--text-primary)]">
            Stripe, Inc.
          </h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            Generated Mar 11, 2025 &middot; Confidential
          </p>
        </div>

        {/* Executive Summary */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Executive Summary
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Stripe represents a high-priority enterprise opportunity with an Account Health Score of 87/100
            and an estimated buying window of 0–30 days. Three converging signals — a new CTO appointment,
            aggressive engineering hiring, and an incumbent vendor contract expiry — create an urgent
            engagement window. Our champion (Sarah Chen, VP Eng) has expressed prior interest, and the
            new CTO&apos;s background aligns closely with our platform capabilities.
          </p>
        </section>

        {/* Company Overview */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--text-tertiary)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Company Overview
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Industry", "Financial Technology — Payment Infrastructure"],
              ["Headquarters", "San Francisco, CA"],
              ["Employees", "8,000+"],
              ["Revenue", "$14B+ (2024)"],
              ["Founded", "2010"],
              ["Stage", "Late-stage Private (Series I)"],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="text-[var(--text-tertiary)]">{label}:</span>
                <span className="text-[var(--text-primary)]">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Key Signals */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Radio className="h-4 w-4 text-[var(--signal-critical)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Key Buying Signals
            </h3>
          </div>
          <div className="space-y-2">
            {[
              {
                signal: "New CTO (David Singleton) from Google Cloud",
                impact: "Technology audit likely within 60 days",
                priority: "Critical",
              },
              {
                signal: "40% engineering hiring surge in Q4",
                impact: "Expanded team needs enterprise tooling",
                priority: "High",
              },
              {
                signal: "Competitor contract expires Apr 10",
                impact: "30-day displacement window",
                priority: "Critical",
              },
              {
                signal: "APAC expansion — Singapore & Tokyo",
                impact: "New infrastructure needs for global scale",
                priority: "Medium",
              },
            ].map((item) => (
              <div
                key={item.signal}
                className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-3"
              >
                <span
                  className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      item.priority === "Critical"
                        ? "var(--signal-critical)"
                        : item.priority === "High"
                          ? "var(--signal-high)"
                          : "var(--signal-medium)",
                  }}
                />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {item.signal}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Impact: {item.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Key Stakeholders */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--text-tertiary)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Key Stakeholders
            </h3>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ["David Singleton, CTO", "Decision Maker", "New in role — evaluating all vendors"],
              ["Sarah Chen, VP Eng", "Champion", "Expressed interest in Q3 conversations"],
              ["Michael Torres, CISO", "Blocker", "Security review required for procurement"],
            ].map(([name, role, note]) => (
              <div key={name} className="flex items-center gap-4 rounded-[var(--radius-sm)] bg-[var(--bg-tertiary)] p-3">
                <span className="flex-1 font-medium text-[var(--text-primary)]">{name}</span>
                <span className="text-xs text-[var(--accent)]">{role}</span>
                <span className="text-xs text-[var(--text-tertiary)]">{note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recommended Strategy */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--signal-positive)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Recommended Strategy
            </h3>
          </div>
          <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            <li>
              <strong className="text-[var(--text-primary)]">Immediate (Week 1):</strong>{" "}
              Send congratulatory outreach to David Singleton referencing his GCP infrastructure work.
              Leverage Sarah Chen for a warm introduction.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Short-term (Weeks 2–3):</strong>{" "}
              Schedule a tailored demo focused on infrastructure observability at scale. Prepare
              competitive displacement materials for the contract renewal conversation.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Medium-term (Month 2):</strong>{" "}
              Engage CISO Michael Torres with security compliance documentation. Position for
              the APAC expansion as a growth opportunity.
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
