import { cn } from "@/lib/utils";
import { Waves, ArrowRight, AlertTriangle } from "lucide-react";

interface AffectedCompany {
  name: string;
  relationship: string;
  impact: "high" | "medium" | "low";
  prediction: string;
}

interface CascadeAlertProps {
  triggerEvent?: string;
  className?: string;
}

const mockTrigger = "Datadog Series C Funding ($85M)";

const mockAffected: AffectedCompany[] = [
  {
    name: "CloudWatch Analytics",
    relationship: "Direct competitor",
    impact: "high",
    prediction: "Likely to accelerate their own fundraising or M&A activity within 90 days.",
  },
  {
    name: "Observability.io",
    relationship: "Technology partner",
    impact: "medium",
    prediction: "May see increased integration requests and partnership expansion.",
  },
  {
    name: "MetricStream",
    relationship: "Adjacent market",
    impact: "low",
    prediction: "Could face competitive pressure in the enterprise monitoring segment.",
  },
];

const impactColors: Record<string, { text: string; bg: string; border: string }> = {
  high: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/25" },
  medium: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25" },
  low: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/25" },
};

export default function CascadeAlert({ triggerEvent, className }: CascadeAlertProps) {
  const trigger = triggerEvent || mockTrigger;

  return (
    <div
      className={cn(
        "p-5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)]",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Waves className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Cascade Effect</h3>
      </div>

      {/* Trigger event */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 mb-4">
        <AlertTriangle className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
        <div>
          <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium">
            Trigger Event
          </p>
          <p className="text-sm font-medium text-[var(--text-primary)]">{trigger}</p>
        </div>
      </div>

      {/* Ripple lines */}
      <div className="flex items-center gap-2 mb-3 px-2">
        <div className="flex-1 h-px bg-gradient-to-r from-[var(--accent-primary)]/40 to-transparent" />
        <span className="text-[10px] text-[var(--text-tertiary)]">Predicted ripple effects</span>
        <div className="flex-1 h-px bg-gradient-to-l from-[var(--accent-primary)]/40 to-transparent" />
      </div>

      {/* Affected companies */}
      <div className="space-y-2">
        {mockAffected.map((company) => {
          const colors = impactColors[company.impact] ?? impactColors.low!;
          return (
            <div
              key={company.name}
              className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
            >
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {company.name}
                  </span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase border",
                      colors.text,
                      colors.bg,
                      colors.border
                    )}
                  >
                    {company.impact}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-tertiary)] mb-0.5">
                  {company.relationship}
                </p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {company.prediction}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
