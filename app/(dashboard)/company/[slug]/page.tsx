"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  Globe,
  Users,
  MapPin,
  ExternalLink,
  Crosshair,
  Send,
  FileText,
  Radio,
  TrendingUp,
  Linkedin,
  Twitter,
  ChevronRight,
  Clock,
  Sparkles,
  Shield,
  DollarSign,
  Cpu,
  MessageSquare,
  ArrowRight,
  Briefcase,
  Heart,
  ThumbsUp,
} from "lucide-react";

/* ─── Mock Company Data ─── */
const company = {
  name: "Stripe",
  logo: "S",
  logoColor: "#635BFF",
  domain: "stripe.com",
  industry: "Financial Technology",
  subIndustry: "Payment Infrastructure",
  location: "San Francisco, CA",
  employees: "8,000+",
  founded: 2010,
  revenue: "$14B+ (2024)",
  badges: ["Public API", "Enterprise", "SOC 2", "Series I"],
  description:
    "Stripe is a financial infrastructure platform for businesses. Millions of companies use Stripe to accept payments, grow revenue, and accelerate new business opportunities.",
};

const scores = [
  {
    label: "Account Health",
    value: 87,
    color: "var(--signal-positive)",
    description: "Strong engagement signals",
  },
  {
    label: "Propensity to Buy",
    value: 78,
    color: "var(--signal-high)",
    description: "High based on tech stack fit",
  },
  {
    label: "Buying Window",
    value: 92,
    color: "var(--signal-critical)",
    description: "0–30 days — act now",
  },
];

const executives = [
  {
    name: "David Singleton",
    title: "Chief Technology Officer",
    photo: "DS",
    since: "Jan 2025",
    previous: "VP Infrastructure, Google Cloud",
    linkedin: "#",
    relevance: "Decision maker — new in role, evaluating vendors",
  },
  {
    name: "Patrick Collison",
    title: "Co-founder & CEO",
    photo: "PC",
    since: "2010",
    previous: "Co-founder",
    linkedin: "#",
    relevance: "Strategic sponsor for enterprise deals",
  },
  {
    name: "Sarah Chen",
    title: "VP Engineering",
    photo: "SC",
    since: "Mar 2023",
    previous: "Dir. Engineering, Meta",
    linkedin: "#",
    relevance: "Champion — expressed interest in Q3",
  },
  {
    name: "Emily Zhang",
    title: "VP Product",
    photo: "EZ",
    since: "Aug 2024",
    previous: "Head of Product, Plaid",
    linkedin: "#",
    relevance: "Influencer — manages platform strategy",
  },
  {
    name: "Michael Torres",
    title: "CISO",
    photo: "MT",
    since: "Jun 2022",
    previous: "Security Lead, Cloudflare",
    linkedin: "#",
    relevance: "Security approval required for procurement",
  },
];

const triggers = [
  {
    type: "leadership",
    title: "New CTO Appointed",
    description: "David Singleton from Google Cloud — signals tech stack review",
    severity: "critical",
    date: "2h ago",
  },
  {
    type: "hiring",
    title: "Engineering Hiring Surge",
    description: "40% increase in engineering roles posted this quarter",
    severity: "high",
    date: "1d ago",
  },
  {
    type: "expansion",
    title: "APAC Market Entry Preparations",
    description: "Job postings for Singapore & Tokyo offices detected",
    severity: "medium",
    date: "3d ago",
  },
  {
    type: "competitive",
    title: "Competitor Contract Renewal Window",
    description: "Current vendor contract up for renewal in 30 days",
    severity: "critical",
    date: "1w ago",
  },
];

const timeline = [
  { date: "Mar 11", event: "New CTO announced", type: "leadership" },
  { date: "Mar 10", event: "15 engineering roles posted", type: "hiring" },
  { date: "Mar 7", event: "APAC expansion leaked", type: "expansion" },
  { date: "Mar 3", event: "Competitor contract renewal approaching", type: "competitive" },
  { date: "Feb 25", event: "Series I valuation bump rumored", type: "funding" },
  { date: "Feb 18", event: "New security compliance certification", type: "technology" },
];

const techStack = [
  { category: "Infrastructure", tools: ["AWS", "GCP", "Kubernetes", "Terraform"] },
  { category: "Languages", tools: ["Ruby", "Go", "TypeScript", "Python"] },
  { category: "Data", tools: ["Apache Kafka", "Spark", "Snowflake", "dbt"] },
  { category: "Monitoring", tools: ["Datadog", "PagerDuty", "Grafana"] },
  { category: "Security", tools: ["HashiCorp Vault", "Snyk", "CrowdStrike"] },
  { category: "Dev Tools", tools: ["GitHub", "CircleCI", "Buildkite", "Linear"] },
];

const engagementPosts = [
  {
    platform: "LinkedIn",
    author: "David Singleton",
    content: "Thrilled to join Stripe as CTO. The scale of payment infrastructure challenges here is incredible. Looking forward to building the future of financial APIs.",
    engagement: "2.4K likes · 342 comments",
    date: "2 days ago",
    icebreaker:
      'Congrats on the new role, David! Your work on distributed systems at Google Cloud was impressive. Would love to share how we help teams like yours get visibility into complex microservice architectures.',
  },
  {
    platform: "Twitter",
    author: "Stripe Engineering",
    content: "We're open-sourcing our new rate limiting library built on top of Redis Cluster. Check out the blog post for implementation details and benchmarks.",
    engagement: "892 likes · 156 retweets",
    date: "5 days ago",
    icebreaker:
      "Loved the rate limiting blog post — the Redis Cluster approach is elegant. We've seen similar patterns at scale and have some complementary observability tooling that might interest your infrastructure team.",
  },
];

const triggerTypeColors: Record<string, string> = {
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

export default function CompanyPage() {
  const params = useParams();
  const [activeNav, setActiveNav] = useState("overview");

  const subNav = [
    { id: "overview", label: "Overview" },
    { id: "signals", label: "Signals", href: `/company/${params.slug}/signals` },
    { id: "people", label: "People", href: `/company/${params.slug}/people` },
    { id: "compete", label: "Competitive", href: `/company/${params.slug}/compete` },
    { id: "brief", label: "Brief", href: `/company/${params.slug}/brief` },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ──── Company Header ──── */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-lg)] text-2xl font-bold text-white shadow-[var(--shadow-md)]"
              style={{ backgroundColor: company.logoColor }}
            >
              {company.logo}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  {company.name}
                </h1>
                {company.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {company.industry} &middot; {company.subIndustry}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {company.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {company.employees}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {company.domain}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {company.revenue}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
              <Crosshair className="h-3.5 w-3.5" />
              Add to Targets
            </button>
            <button className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--accent-hover)] transition-colors">
              <Send className="h-3.5 w-3.5" />
              Draft Outreach
            </button>
            <button className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
              <FileText className="h-3.5 w-3.5" />
              Export Brief
            </button>
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="mt-5 flex items-center gap-1 border-t border-[var(--border-subtle)] pt-4">
          {subNav.map((item) =>
            item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={cn(
                  "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs transition-colors",
                  activeNav === item.id
                    ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                    : "text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
                )}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      </div>

      {/* ──── Score Row ──── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {scores.map((score) => (
          <div
            key={score.label}
            className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-[var(--text-tertiary)]">
                {score.label}
              </span>
              <span
                className="text-2xl font-bold"
                style={{ color: score.color }}
              >
                {score.value}
              </span>
            </div>
            {/* Gauge bar */}
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-[var(--bg-hover)]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${score.value}%`,
                  backgroundColor: score.color,
                }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)]">
              {score.description}
            </p>
          </div>
        ))}
      </div>

      {/* ──── Why Now Narrative ──── */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Why Now — AI Synthesis
          </h2>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          <p>
            Stripe is entering a critical inflection point driven by three converging signals:
            the appointment of a new CTO with deep platform infrastructure experience, an
            aggressive 40% engineering hiring surge, and an imminent competitor contract renewal
            window. Together, these create a <strong className="text-[var(--text-primary)]">high-urgency engagement opportunity within the next 30 days</strong>.
          </p>
          <p>
            David Singleton&apos;s background at Google Cloud — where he championed consolidated
            vendor strategies and AI-first platform architecture — suggests an incoming technology
            audit. Our solution aligns directly with his documented priorities: observability at
            scale, developer experience, and infrastructure cost optimization.
          </p>
          <p>
            The existing champion, Sarah Chen (VP Engineering), has expressed interest in our
            platform during Q3 conversations. With Singleton&apos;s arrival and the expanded engineering
            team, budget authority and technical evaluation capacity have both increased. The
            recommended approach is a <strong className="text-[var(--text-primary)]">multi-threaded outreach strategy</strong> targeting
            Singleton for strategic alignment and Chen for technical validation.
          </p>
        </div>
      </div>

      {/* ──── C-Level Intelligence ──── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            C-Level Intelligence
          </h2>
          <Link
            href={`/company/${params.slug}/people`}
            className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
          >
            View org chart <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {executives.map((exec) => (
            <div
              key={exec.name}
              className="min-w-[240px] shrink-0 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-xs font-bold text-[var(--text-primary)]">
                  {exec.photo}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {exec.name}
                  </p>
                  <p className="truncate text-[10px] text-[var(--text-tertiary)]">
                    {exec.title}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <p className="text-[var(--text-tertiary)]">
                  <span className="text-[var(--text-secondary)]">Since:</span>{" "}
                  {exec.since}
                </p>
                <p className="text-[var(--text-tertiary)]">
                  <span className="text-[var(--text-secondary)]">Previously:</span>{" "}
                  {exec.previous}
                </p>
                <p className="mt-2 rounded-[var(--radius-sm)] bg-[var(--accent-subtle)] px-2 py-1 text-[10px] text-[var(--accent)]">
                  {exec.relevance}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ──── Active Triggers ──── */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
          Active Buying Triggers
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {triggers.map((trigger, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4"
              style={{
                borderLeftWidth: "3px",
                borderLeftColor: triggerTypeColors[trigger.type],
              }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${triggerTypeColors[trigger.type]} 15%, transparent)`,
                    color: triggerTypeColors[trigger.type],
                  }}
                >
                  {trigger.type}
                </span>
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: severityColors[trigger.severity],
                  }}
                />
                <span className="ml-auto text-[10px] text-[var(--text-tertiary)]">
                  {trigger.date}
                </span>
              </div>
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                {trigger.title}
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {trigger.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ──── Signal Timeline ──── */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
          Signal Timeline
        </h2>
        <div className="relative space-y-4 pl-6">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border-subtle)]" />

          {timeline.map((item, i) => (
            <div key={i} className="relative flex gap-4">
              <div
                className="absolute left-[-17px] top-1.5 h-3 w-3 rounded-full border-2 border-[var(--bg-secondary)]"
                style={{
                  backgroundColor: triggerTypeColors[item.type] || "var(--text-tertiary)",
                }}
              />
              <div className="flex-1">
                <p className="text-sm text-[var(--text-primary)]">
                  {item.event}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {item.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ──── Tech Stack ──── */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
          Tech Stack
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {techStack.map((cat) => (
            <div key={cat.category}>
              <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">
                {cat.category}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cat.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ──── Engagement Opportunities ──── */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
          Engagement Opportunities
        </h2>
        <div className="space-y-4">
          {engagementPosts.map((post, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5"
            >
              <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                {post.platform === "LinkedIn" ? (
                  <Linkedin className="h-3.5 w-3.5" />
                ) : (
                  <Twitter className="h-3.5 w-3.5" />
                )}
                <span className="font-medium text-[var(--text-secondary)]">
                  {post.author}
                </span>
                <span>&middot;</span>
                <span>{post.date}</span>
              </div>
              <p className="mb-2 text-sm text-[var(--text-primary)]">
                &ldquo;{post.content}&rdquo;
              </p>
              <p className="mb-4 text-[10px] text-[var(--text-tertiary)]">
                {post.engagement}
              </p>

              {/* AI Icebreaker */}
              <div className="rounded-[var(--radius-md)] border border-[var(--accent-subtle)] bg-[var(--accent-subtle)] p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium text-[var(--accent)]">
                  <Sparkles className="h-3 w-3" />
                  AI-Generated Icebreaker
                </div>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  {post.icebreaker}
                </p>
                <button className="mt-2 flex items-center gap-1 text-[10px] font-medium text-[var(--accent)] hover:underline">
                  <Send className="h-3 w-3" />
                  Use as outreach opener
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
