"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getSignalColor } from "@/lib/utils";
import { Filter } from "lucide-react";
import type { SignalType } from "@/types/signal";

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: SignalType;
}

interface SignalTimelineProps {
  className?: string;
}

const mockEvents: TimelineEvent[] = [
  {
    id: "1",
    date: "2025-12-10",
    title: "VP Engineering Departure",
    description: "Key technical leader left after 4 years. Replacement search underway.",
    type: "leadership",
  },
  {
    id: "2",
    date: "2025-12-08",
    title: "Series C Funding Announced",
    description: "$85M raised led by Sequoia Capital. Plans to double engineering team.",
    type: "funding",
  },
  {
    id: "3",
    date: "2025-12-03",
    title: "New Office in London",
    description: "International expansion with new EMEA headquarters in London.",
    type: "expansion",
  },
  {
    id: "4",
    date: "2025-11-28",
    title: "Kubernetes Migration Detected",
    description: "Job postings and tech blog confirm move to containerized infrastructure.",
    type: "technology",
  },
  {
    id: "5",
    date: "2025-11-20",
    title: "Competitor Win/Loss Alert",
    description: "Lost a deal to a competitor in the mid-market segment per G2 review.",
    type: "competitive",
  },
];

const typeLabels: Record<string, string> = {
  funding: "Funding",
  hiring: "Hiring",
  expansion: "Expansion",
  leadership: "Leadership",
  technology: "Technology",
  competitive: "Competitive",
};

export default function SignalTimeline({ className }: SignalTimelineProps) {
  const [filterType, setFilterType] = useState<string | null>(null);

  const allTypes = Array.from(new Set(mockEvents.map((e) => e.type)));
  const filteredEvents = filterType
    ? mockEvents.filter((e) => e.type === filterType)
    : mockEvents;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Signal Timeline</h3>

        {/* Filter pills */}
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-[var(--text-tertiary)] mr-1" />
          <button
            onClick={() => setFilterType(null)}
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors",
              !filterType
                ? "bg-[var(--accent-primary)] text-white"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            All
          </button>
          {allTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type === filterType ? null : type)}
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors",
                type === filterType
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              {typeLabels[type] ?? type}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border-primary)]" />

        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const color = getSignalColor(event.type);
            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Dot */}
                <div
                  className="absolute left-[-17px] top-1.5 w-3 h-3 rounded-full border-2 border-[var(--bg-primary)]"
                  style={{ backgroundColor: color }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color }}
                    >
                      {typeLabels[event.type] ?? event.type}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-[var(--text-primary)] mb-0.5">
                    {event.title}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
