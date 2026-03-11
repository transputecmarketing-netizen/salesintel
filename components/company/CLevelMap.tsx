"use client";

import { cn } from "@/lib/utils";
import { Quote, ChevronRight, Network } from "lucide-react";

interface Executive {
  id: string;
  name: string;
  title: string;
  avatarUrl: string | null;
  quote: string;
  priorities: string[];
}

interface CLevelMapProps {
  className?: string;
}

const mockExecutives: Executive[] = [
  {
    id: "1",
    name: "Sarah Chen",
    title: "Chief Executive Officer",
    avatarUrl: null,
    quote: "Our priority for 2025 is aggressive international expansion.",
    priorities: ["International expansion", "AI integration", "Enterprise sales"],
  },
  {
    id: "2",
    name: "Marcus Johnson",
    title: "Chief Technology Officer",
    avatarUrl: null,
    quote: "We're rebuilding our platform on a modern microservices architecture.",
    priorities: ["Platform modernization", "Developer experience", "Security"],
  },
  {
    id: "3",
    name: "Lisa Park",
    title: "Chief Revenue Officer",
    avatarUrl: null,
    quote: "Moving upmarket into enterprise is our biggest growth lever.",
    priorities: ["Enterprise pipeline", "Partner channel", "Net retention"],
  },
  {
    id: "4",
    name: "David Kim",
    title: "VP Engineering",
    avatarUrl: null,
    quote: "We need to double engineering headcount by Q3.",
    priorities: ["Hiring", "Infrastructure", "API platform"],
  },
];

export default function CLevelMap({ className }: CLevelMapProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Executive Map</h3>
        <button className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:underline">
          <Network className="w-3.5 h-3.5" />
          View Org Chart
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {mockExecutives.map((exec) => (
          <div
            key={exec.id}
            className="flex-shrink-0 w-64 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)] transition-colors"
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-3">
              {exec.avatarUrl ? (
                <img
                  src={exec.avatarUrl}
                  alt={exec.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-sm font-bold text-[var(--text-tertiary)]">
                  {exec.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {exec.name}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] truncate">{exec.title}</p>
              </div>
            </div>

            {/* Quote */}
            <div className="flex gap-2 mb-3">
              <Quote className="w-3 h-3 text-[var(--text-tertiary)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed line-clamp-2">
                {exec.quote}
              </p>
            </div>

            {/* Priorities */}
            <div className="flex flex-wrap gap-1">
              {exec.priorities.map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
