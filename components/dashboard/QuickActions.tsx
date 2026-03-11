"use client";

import { cn } from "@/lib/utils";
import { Search, Plus, FileText, Send, Zap, Target } from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface QuickActionsProps {
  onAction?: (id: string) => void;
  className?: string;
}

const actions: QuickAction[] = [
  {
    id: "research",
    label: "New Research",
    description: "Research a company",
    icon: Search,
    color: "text-blue-400",
  },
  {
    id: "add-target",
    label: "Add Target",
    description: "Add to watchlist",
    icon: Plus,
    color: "text-emerald-400",
  },
  {
    id: "deep-report",
    label: "Deep Report",
    description: "Full analysis",
    icon: FileText,
    color: "text-purple-400",
  },
  {
    id: "draft-outreach",
    label: "Draft Outreach",
    description: "AI-powered email",
    icon: Send,
    color: "text-amber-400",
  },
  {
    id: "signal-alerts",
    label: "Signal Alerts",
    description: "Review new signals",
    icon: Zap,
    color: "text-red-400",
  },
  {
    id: "targets",
    label: "My Targets",
    description: "View watchlist",
    icon: Target,
    color: "text-sky-400",
  },
];

export default function QuickActions({ onAction, className }: QuickActionsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Quick Actions</h3>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onAction?.(action.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-tertiary)] transition-all group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] group-hover:scale-110 transition-transform">
                <Icon className={cn("w-5 h-5", action.color)} />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-[var(--text-primary)]">{action.label}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
