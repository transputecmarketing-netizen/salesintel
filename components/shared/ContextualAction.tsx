"use client";

import { cn } from "@/lib/utils";
import { Mail, Phone, Search, Eye, Send, type LucideIcon } from "lucide-react";
import type { SignalType } from "@/types/signal";

interface ContextualActionProps {
  signalType: SignalType;
  onClick?: () => void;
  className?: string;
}

interface ActionConfig {
  label: string;
  icon: LucideIcon;
}

const actionMap: Record<string, ActionConfig> = {
  funding: { label: "Draft Outreach", icon: Mail },
  hiring: { label: "Draft Outreach", icon: Mail },
  expansion: { label: "Draft Outreach", icon: Mail },
  leadership: { label: "Send Intro", icon: Send },
  technology: { label: "Research Deeper", icon: Search },
  competitive: { label: "View Analysis", icon: Eye },
  financial: { label: "Draft Outreach", icon: Mail },
  tender: { label: "Draft Proposal", icon: Mail },
  product_launch: { label: "Research Deeper", icon: Search },
  partnership: { label: "Draft Outreach", icon: Mail },
  earnings: { label: "View Analysis", icon: Eye },
  social: { label: "Engage", icon: Send },
};

const defaultAction: ActionConfig = { label: "Take Action", icon: Mail };

export default function ContextualAction({ signalType, onClick, className }: ContextualActionProps) {
  const action = actionMap[signalType] ?? defaultAction;
  const Icon = action.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
        "bg-[var(--accent-primary)] text-white",
        "hover:opacity-90 active:scale-[0.98] transition-all",
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {action.label}
    </button>
  );
}
