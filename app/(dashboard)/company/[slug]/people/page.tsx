import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Linkedin,
  Mail,
  Shield,
  Star,
  ChevronRight,
} from "lucide-react";

const orgLevels = [
  {
    title: "C-Suite",
    members: [
      {
        id: "p1",
        name: "Patrick Collison",
        role: "Co-founder & CEO",
        initials: "PC",
        department: "Executive",
        relevance: "Strategic sponsor",
        status: "neutral",
      },
      {
        id: "p2",
        name: "John Collison",
        role: "Co-founder & President",
        initials: "JC",
        department: "Executive",
        relevance: "Operational decision-maker",
        status: "neutral",
      },
      {
        id: "p3",
        name: "David Singleton",
        role: "Chief Technology Officer",
        initials: "DS",
        department: "Engineering",
        relevance: "New — key decision-maker",
        status: "hot",
      },
      {
        id: "p4",
        name: "Dhivya Suryadevara",
        role: "Chief Financial Officer",
        initials: "DS",
        department: "Finance",
        relevance: "Budget approval authority",
        status: "neutral",
      },
    ],
  },
  {
    title: "VP / Director Level",
    members: [
      {
        id: "p5",
        name: "Sarah Chen",
        role: "VP Engineering",
        initials: "SC",
        department: "Engineering",
        relevance: "Champion — expressed interest",
        status: "champion",
      },
      {
        id: "p6",
        name: "Emily Zhang",
        role: "VP Product",
        initials: "EZ",
        department: "Product",
        relevance: "Influencer — platform strategy",
        status: "warm",
      },
      {
        id: "p7",
        name: "Michael Torres",
        role: "CISO",
        initials: "MT",
        department: "Security",
        relevance: "Security approval required",
        status: "blocker",
      },
      {
        id: "p8",
        name: "Rachel Kim",
        role: "VP Sales",
        initials: "RK",
        department: "Sales",
        relevance: "Revenue alignment discussions",
        status: "neutral",
      },
    ],
  },
  {
    title: "Manager / Lead",
    members: [
      {
        id: "p9",
        name: "James Liu",
        role: "Sr. Engineering Manager",
        initials: "JL",
        department: "Engineering",
        relevance: "Technical evaluator",
        status: "warm",
      },
      {
        id: "p10",
        name: "Aisha Patel",
        role: "Infrastructure Lead",
        initials: "AP",
        department: "Engineering",
        relevance: "End user — daily operations",
        status: "champion",
      },
    ],
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  champion: { label: "Champion", color: "var(--signal-positive)", bg: "rgba(16,185,129,0.12)" },
  hot: { label: "Hot Lead", color: "var(--signal-critical)", bg: "rgba(239,68,68,0.12)" },
  warm: { label: "Warm", color: "var(--signal-high)", bg: "rgba(245,158,11,0.12)" },
  neutral: { label: "Neutral", color: "var(--text-tertiary)", bg: "var(--bg-tertiary)" },
  blocker: { label: "Potential Blocker", color: "var(--badge-competitive)", bg: "rgba(239,68,68,0.08)" },
};

export default async function CompanyPeoplePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/company/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Company
      </Link>

      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          Contact Map
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Key stakeholders and their relationship to your opportunity
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3">
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: cfg.color }}
            />
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {cfg.label}
            </span>
          </div>
        ))}
      </div>

      {/* Org levels */}
      <div className="space-y-6">
        {orgLevels.map((level) => (
          <div key={level.title}>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              <Users className="h-3.5 w-3.5" />
              {level.title}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {level.members.map((person) => {
                const status = statusConfig[person.status] ?? { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', label: 'Unknown' };
                return (
                  <Link
                    key={person.id}
                    href={`/contact/${person.id}`}
                    className="group rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 transition-all hover:border-[var(--border-default)] hover:shadow-[var(--shadow-sm)]"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: status.bg,
                          color: status.color,
                        }}
                      >
                        {person.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                          {person.name}
                        </p>
                        <p className="truncate text-[10px] text-[var(--text-tertiary)]">
                          {person.role}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        {person.department}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                        style={{
                          backgroundColor: status.bg,
                          color: status.color,
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="mt-2 text-[10px] text-[var(--text-secondary)]">
                      {person.relevance}
                    </p>

                    {/* Quick actions */}
                    <div className="mt-3 flex items-center gap-2 border-t border-[var(--border-subtle)] pt-2">
                      <button
                        onClick={(e) => e.preventDefault()}
                        className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
                      >
                        <Linkedin className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => e.preventDefault()}
                        className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
                      >
                        <Mail className="h-3 w-3" />
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
