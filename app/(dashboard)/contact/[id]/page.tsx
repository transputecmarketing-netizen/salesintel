"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Clock,
  MessageSquare,
  Send,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ExternalLink,
  Calendar,
  TrendingUp,
} from "lucide-react";

const contact = {
  name: "David Singleton",
  title: "Chief Technology Officer",
  company: "Stripe",
  companySlug: "stripe",
  initials: "DS",
  email: "d.singleton@stripe.com",
  phone: "+1 (415) 555-0142",
  location: "San Francisco, CA",
  linkedin: "linkedin.com/in/davidsingleton",
  twitter: "@dsingleton",
  photo: null,
  communicationStyle: {
    label: "Analytical & Direct",
    description:
      "Prefers data-driven conversations with clear ROI. Values technical depth over sales pitches. Responds well to peer-level engineering discussions.",
    tips: [
      "Lead with technical architecture, not features",
      "Include benchmarks and performance data",
      "Reference his published work on distributed systems",
      "Keep emails under 150 words",
    ],
  },
};

const careerHistory = [
  {
    company: "Stripe",
    role: "Chief Technology Officer",
    period: "Jan 2025 — Present",
    duration: "2 months",
    current: true,
  },
  {
    company: "Google Cloud",
    role: "VP Infrastructure",
    period: "2018 — 2024",
    duration: "6 years",
    current: false,
  },
  {
    company: "Google",
    role: "Director of Engineering",
    period: "2014 — 2018",
    duration: "4 years",
    current: false,
  },
  {
    company: "Spotify",
    role: "Engineering Lead",
    period: "2011 — 2014",
    duration: "3 years",
    current: false,
  },
];

const recentActivity = [
  {
    type: "linkedin",
    action: "Published post about distributed systems at scale",
    date: "2 days ago",
    engagement: "2.4K likes",
  },
  {
    type: "news",
    action: 'Quoted in TechCrunch: "AI infrastructure is the next platform shift"',
    date: "1 week ago",
    engagement: null,
  },
  {
    type: "event",
    action: "Speaking at QCon San Francisco — Keynote on Platform Engineering",
    date: "Mar 25, 2025",
    engagement: null,
  },
  {
    type: "linkedin",
    action: "Shared article about engineering culture transformation",
    date: "2 weeks ago",
    engagement: "890 likes",
  },
];

const draftMessage = `Hi David,

Congratulations on the CTO role at Stripe — exciting times ahead. Your keynote at Google Cloud Next on observability for distributed payments systems really resonated with our engineering team.

I lead the platform team at [Company] and we've been working on infrastructure observability specifically designed for high-throughput payment architectures. Given Stripe's scale, I thought you might find our approach to real-time anomaly detection interesting.

Would you be open to a 20-minute technical deep-dive? Happy to share some benchmarks from similar-scale deployments.

Best,
Alex`;

export default function ContactPage() {
  const params = useParams();
  const [messageContent, setMessageContent] = useState(draftMessage);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/company/${contact.companySlug}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {contact.company}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Contact Header */}
          <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-lg font-bold text-[var(--text-primary)]">
                {contact.initials}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                  {contact.name}
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  {contact.title}
                </p>
                <Link
                  href={`/company/${contact.companySlug}`}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                >
                  <Building2 className="h-3 w-3" />
                  {contact.company}
                </Link>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {contact.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {contact.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {contact.location}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <a
                    href="#"
                    className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href="#"
                    className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    <Twitter className="h-3.5 w-3.5" />
                  </a>
                  <button className="ml-2 flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-hover)] transition-colors">
                    <Send className="h-3 w-3" />
                    Send Outreach
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Career History */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Briefcase className="h-4 w-4 text-[var(--text-tertiary)]" />
              Career History
            </h2>
            <div className="relative space-y-4 pl-6">
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-[var(--border-subtle)]" />
              {careerHistory.map((job, i) => (
                <div key={i} className="relative">
                  <div
                    className={cn(
                      "absolute -left-[17px] top-1.5 h-3 w-3 rounded-full border-2 border-[var(--bg-secondary)]",
                      job.current
                        ? "bg-[var(--accent)]"
                        : "bg-[var(--text-tertiary)]"
                    )}
                  />
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {job.role}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {job.company}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    {job.period} &middot; {job.duration}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-[var(--radius-sm)] p-2 hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
                    {activity.type === "linkedin" ? (
                      <Linkedin className="h-3 w-3 text-[var(--text-tertiary)]" />
                    ) : activity.type === "event" ? (
                      <Calendar className="h-3 w-3 text-[var(--text-tertiary)]" />
                    ) : (
                      <ExternalLink className="h-3 w-3 text-[var(--text-tertiary)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)]">
                      {activity.action}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                      <span>{activity.date}</span>
                      {activity.engagement && (
                        <>
                          <span>&middot;</span>
                          <span>{activity.engagement}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Communication Style */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <MessageSquare className="h-4 w-4 text-[var(--accent)]" />
              Communication Style
            </h2>
            <div className="mb-3 inline-flex rounded-full bg-[var(--accent-subtle)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
              {contact.communicationStyle.label}
            </div>
            <p className="mb-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              {contact.communicationStyle.description}
            </p>
            <ul className="space-y-1.5">
              {contact.communicationStyle.tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
                >
                  <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-[var(--signal-positive)]" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* AI-Generated Outreach Draft */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--accent-subtle)] bg-[var(--bg-secondary)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                AI Outreach Draft
              </h2>
              <button className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="mb-3 h-64 w-full resize-none rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-3 text-xs leading-relaxed text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]">
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]">
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] px-2.5 py-1.5 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button className="flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--accent)] px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-[var(--accent-hover)] transition-colors">
                  <Send className="h-3 w-3" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
