"use client";

import { cn } from "@/lib/utils";
import { MessageSquare, ThumbsUp, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";

interface SocialPost {
  id: string;
  contactName: string;
  contactTitle: string;
  platform: "linkedin" | "twitter";
  content: string;
  date: string;
  engagement: { likes: number; comments: number; shares: number };
  icebreaker: string;
}

interface EngagementOpportunitiesProps {
  className?: string;
}

const mockPosts: SocialPost[] = [
  {
    id: "1",
    contactName: "Sarah Chen",
    contactTitle: "CEO",
    platform: "linkedin",
    content:
      "Excited to announce we've expanded our team by 40% this year. The future of B2B intelligence is here, and we're just getting started.",
    date: "2025-12-09",
    engagement: { likes: 234, comments: 45, shares: 12 },
    icebreaker:
      "Congrats on the impressive 40% growth, Sarah! Scaling that fast while maintaining culture is no easy feat. I'd love to share how we've helped similar hyper-growth companies streamline their operations.",
  },
  {
    id: "2",
    contactName: "Marcus Johnson",
    contactTitle: "CTO",
    platform: "linkedin",
    content:
      "Just published our engineering blog on migrating 200+ microservices to Kubernetes. Lessons learned the hard way.",
    date: "2025-12-07",
    engagement: { likes: 189, comments: 67, shares: 31 },
    icebreaker:
      "Great write-up on the K8s migration, Marcus. Managing 200+ services is no joke. We've been solving similar observability challenges -- would love to compare notes.",
  },
];

export default function EngagementOpportunities({ className }: EngagementOpportunitiesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyIcebreaker = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-[var(--accent-primary)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Engagement Opportunities
        </h3>
      </div>

      <div className="space-y-3">
        {mockPosts.map((post) => (
          <div
            key={post.id}
            className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]"
          >
            {/* Contact info */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[10px] font-bold text-[var(--text-tertiary)]">
                {post.contactName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {post.contactName}
                </span>
                <span className="text-xs text-[var(--text-tertiary)] ml-2">
                  {post.contactTitle}
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-tertiary)] ml-auto">
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Post content */}
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2 line-clamp-2">
              {post.content}
            </p>

            {/* Engagement */}
            <div className="flex items-center gap-3 mb-3 text-[11px] text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                {post.engagement.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {post.engagement.comments}
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="w-3 h-3" />
                {post.engagement.shares}
              </span>
            </div>

            {/* AI Icebreaker */}
            <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-[var(--accent-primary)] uppercase tracking-wide">
                  AI Icebreaker
                </span>
                <button
                  onClick={() => copyIcebreaker(post.id, post.icebreaker)}
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {copiedId === post.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                {post.icebreaker}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
