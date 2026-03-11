"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Eye, Trash2, Send } from "lucide-react";
import TierBadge from "@/components/shared/TierBadge";
import SignalHealthBar from "@/components/shared/SignalHealthBar";

interface TargetRow {
  id: string;
  companyName: string;
  logoUrl: string | null;
  tier: 1 | 2 | 3;
  lastSignal: string;
  lastSignalDate: string;
  healthScore: number;
  buyingWindow: string | null;
}

interface TargetTableProps {
  className?: string;
}

const mockTargets: TargetRow[] = [
  {
    id: "1",
    companyName: "Datadog",
    logoUrl: null,
    tier: 1,
    lastSignal: "VP Engineering Departure",
    lastSignalDate: "2025-12-10",
    healthScore: 87,
    buyingWindow: "Dec 15 - Jan 15",
  },
  {
    id: "2",
    companyName: "Notion",
    logoUrl: null,
    tier: 1,
    lastSignal: "Series B Extension ($150M)",
    lastSignalDate: "2025-12-09",
    healthScore: 72,
    buyingWindow: "Jan 5 - Feb 10",
  },
  {
    id: "3",
    companyName: "Figma",
    logoUrl: null,
    tier: 2,
    lastSignal: "API Platform Launch",
    lastSignalDate: "2025-12-08",
    healthScore: 81,
    buyingWindow: "Dec 20 - Jan 30",
  },
  {
    id: "4",
    companyName: "Linear",
    logoUrl: null,
    tier: 2,
    lastSignal: "Engineering Hiring Surge",
    lastSignalDate: "2025-12-07",
    healthScore: 65,
    buyingWindow: null,
  },
  {
    id: "5",
    companyName: "Vercel",
    logoUrl: null,
    tier: 3,
    lastSignal: "New CTO Appointed",
    lastSignalDate: "2025-12-05",
    healthScore: 58,
    buyingWindow: "Feb 1 - Mar 15",
  },
  {
    id: "6",
    companyName: "Supabase",
    logoUrl: null,
    tier: 3,
    lastSignal: "Partnership Announcement",
    lastSignalDate: "2025-12-03",
    healthScore: 45,
    buyingWindow: null,
  },
];

type SortKey = "companyName" | "tier" | "lastSignalDate" | "healthScore";

export default function TargetTable({ className }: TargetTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("healthScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...mockTargets].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "companyName":
        cmp = a.companyName.localeCompare(b.companyName);
        break;
      case "tier":
        cmp = a.tier - b.tier;
        break;
      case "lastSignalDate":
        cmp = new Date(a.lastSignalDate).getTime() - new Date(b.lastSignalDate).getTime();
        break;
      case "healthScore":
        cmp = a.healthScore - b.healthScore;
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-[var(--text-tertiary)]" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[var(--accent-primary)]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[var(--accent-primary)]" />
    );
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] overflow-hidden",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort("companyName")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide hover:text-[var(--text-secondary)]"
                >
                  Company <SortIcon col="companyName" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort("tier")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide hover:text-[var(--text-secondary)]"
                >
                  Tier <SortIcon col="tier" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort("lastSignalDate")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide hover:text-[var(--text-secondary)]"
                >
                  Last Signal <SortIcon col="lastSignalDate" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort("healthScore")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide hover:text-[var(--text-secondary)]"
                >
                  Health <SortIcon col="healthScore" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
                  Buying Window
                </span>
              </th>
              <th className="text-right px-4 py-3">
                <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((target) => (
              <tr
                key={target.id}
                className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-[10px] font-bold text-[var(--text-tertiary)] shrink-0">
                      {target.companyName.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {target.companyName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <TierBadge tier={target.tier} />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm text-[var(--text-primary)]">{target.lastSignal}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      {new Date(target.lastSignalDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 w-32">
                    <SignalHealthBar score={target.healthScore} />
                    <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">
                      {target.healthScore}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {target.buyingWindow ? (
                    <span className="text-sm text-[var(--text-secondary)]">
                      {target.buyingWindow}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-tertiary)]">--</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="relative inline-block">
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === target.id ? null : target.id)
                      }
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-[var(--text-tertiary)]" />
                    </button>
                    {openMenu === target.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg z-10 py-1">
                        <button className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
                          <Eye className="w-3.5 h-3.5" />
                          View Profile
                        </button>
                        <button className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
                          <Send className="w-3.5 h-3.5" />
                          Draft Outreach
                        </button>
                        <button className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-400 hover:bg-[var(--bg-secondary)]">
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
