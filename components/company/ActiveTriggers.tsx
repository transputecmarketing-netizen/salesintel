import { cn } from "@/lib/utils";
import { Zap, AlertCircle } from "lucide-react";

interface Trigger {
  id: string;
  title: string;
  description: string;
  badge: "NEW" | "DETECTED";
  detectedAt: string;
  category: string;
}

interface ActiveTriggersProps {
  className?: string;
}

const mockTriggers: Trigger[] = [
  {
    id: "1",
    title: "VP of Engineering Departed",
    description:
      "Key technical decision-maker left the company, creating an opportunity for new vendor evaluations.",
    badge: "NEW",
    detectedAt: "2025-12-10T14:30:00Z",
    category: "Leadership Change",
  },
  {
    id: "2",
    title: "Series C Funding ($85M)",
    description:
      "New funding round signals expansion budget availability and accelerated growth plans.",
    badge: "DETECTED",
    detectedAt: "2025-12-08T09:15:00Z",
    category: "Funding",
  },
  {
    id: "3",
    title: "Competitor Contract Renewal Window",
    description:
      "Based on public procurement data, their current vendor contract is approaching renewal.",
    badge: "DETECTED",
    detectedAt: "2025-12-05T11:00:00Z",
    category: "Competitive",
  },
];

export default function ActiveTriggers({ className }: ActiveTriggersProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Active Buying Triggers</h3>
        <span className="text-[11px] font-medium text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
          {mockTriggers.length}
        </span>
      </div>

      <div className="space-y-2">
        {mockTriggers.map((trigger) => (
          <div
            key={trigger.id}
            className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                  trigger.badge === "NEW"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                    : "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                )}
              >
                {trigger.badge}
              </span>
              <span className="text-[11px] text-[var(--text-tertiary)]">{trigger.category}</span>
              <span className="text-[11px] text-[var(--text-tertiary)] ml-auto">
                {new Date(trigger.detectedAt).toLocaleDateString()}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              {trigger.title}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {trigger.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
