"use client";

import { cn } from "@/lib/utils";
import { FileText, ArrowRight, Clock } from "lucide-react";

interface Report {
  id: string;
  companyName: string;
  companyLogo: string | null;
  type: "standard" | "deep";
  createdAt: string;
  signalCount: number;
  healthScore: number;
}

interface RecentReportsProps {
  className?: string;
}

const mockReports: Report[] = [
  {
    id: "1",
    companyName: "Datadog",
    companyLogo: null,
    type: "deep",
    createdAt: "2025-12-10T14:30:00Z",
    signalCount: 8,
    healthScore: 87,
  },
  {
    id: "2",
    companyName: "Notion",
    companyLogo: null,
    type: "standard",
    createdAt: "2025-12-09T10:15:00Z",
    signalCount: 5,
    healthScore: 72,
  },
  {
    id: "3",
    companyName: "Figma",
    companyLogo: null,
    type: "deep",
    createdAt: "2025-12-08T16:45:00Z",
    signalCount: 6,
    healthScore: 81,
  },
  {
    id: "4",
    companyName: "Linear",
    companyLogo: null,
    type: "standard",
    createdAt: "2025-12-07T09:00:00Z",
    signalCount: 3,
    healthScore: 65,
  },
];

export default function RecentReports({ className }: RecentReportsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Reports</h3>
        <button className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {mockReports.map((report) => (
          <div
            key={report.id}
            className="flex-shrink-0 w-56 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)] transition-colors cursor-pointer group"
          >
            {/* Company */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--text-tertiary)]">
                {report.companyName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {report.companyName}
                </p>
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wide",
                    report.type === "deep" ? "text-purple-400" : "text-[var(--text-tertiary)]"
                  )}
                >
                  {report.type} report
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-tertiary)]">
                {report.signalCount} signals
              </span>
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                Health: {report.healthScore}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
              <Clock className="w-3 h-3" />
              {new Date(report.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
