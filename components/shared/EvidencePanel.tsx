"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ExternalLink, FileText, Briefcase, MessageSquare, Newspaper, ScrollText } from "lucide-react";
import type { EvidenceItem } from "@/types/signal";

interface EvidencePanelProps {
  evidence: EvidenceItem[];
  className?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  article: Newspaper,
  filing: ScrollText,
  job_posting: Briefcase,
  social_post: MessageSquare,
  press_release: FileText,
};

const typeLabels: Record<string, string> = {
  article: "Article",
  filing: "Filing",
  job_posting: "Job Posting",
  social_post: "Social Post",
  press_release: "Press Release",
};

export default function EvidencePanel({ evidence, className }: EvidencePanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!evidence.length) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden",
        className
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--text-tertiary)]" />
          Evidence ({evidence.length} source{evidence.length !== 1 ? "s" : ""})
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="border-t border-[var(--border-primary)] divide-y divide-[var(--border-primary)]">
          {evidence.map((item, i) => {
            const Icon = typeIcons[item.type] ?? FileText;
            return (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded bg-[var(--bg-tertiary)] shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                      {typeLabels[item.type] ?? item.type}
                    </span>
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{item.content}</p>
                </div>
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
