import { cn } from "@/lib/utils";
import { Calendar, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import type { BuyingWindowPrediction } from "@/types/research";

interface BuyingWindowProps {
  prediction: BuyingWindowPrediction;
  className?: string;
}

const urgencyConfig: Record<string, { label: string; color: string; bg: string }> = {
  immediate: { label: "Act Now", color: "text-red-400", bg: "bg-red-500/10" },
  this_week: { label: "This Week", color: "text-orange-400", bg: "bg-orange-500/10" },
  this_month: { label: "This Month", color: "text-amber-400", bg: "bg-amber-500/10" },
  this_quarter: { label: "This Quarter", color: "text-blue-400", bg: "bg-blue-500/10" },
  monitor: { label: "Monitor", color: "text-[var(--text-tertiary)]", bg: "bg-[var(--bg-tertiary)]" },
};

export default function BuyingWindow({ prediction, className }: BuyingWindowProps) {
  const urgency = urgencyConfig[prediction.urgency] ?? urgencyConfig.monitor!;
  const startDate = new Date(prediction.windowStart);
  const endDate = new Date(prediction.windowEnd);
  const optimalDate = new Date(prediction.optimalOutreachDate);
  const now = new Date();

  // Timeline progress
  const totalSpan = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const progress = Math.max(0, Math.min(100, (elapsed / totalSpan) * 100));

  // Optimal outreach position
  const optimalPos = Math.max(0, Math.min(100, ((optimalDate.getTime() - startDate.getTime()) / totalSpan) * 100));

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div
      className={cn(
        "p-5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)]",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Buying Window</h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
            urgency.color,
            urgency.bg
          )}
        >
          <AlertTriangle className="w-3 h-3" />
          {urgency.label}
        </span>
      </div>

      {/* Timeline bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] mb-1.5">
          <span>{formatDate(startDate)}</span>
          <span>{formatDate(endDate)}</span>
        </div>
        <div className="relative h-2 rounded-full bg-[var(--bg-tertiary)] overflow-visible">
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-[var(--accent-primary)] opacity-30"
            style={{ width: `${progress}%` }}
          />
          {/* Optimal outreach marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--bg-primary)] shadow-sm"
            style={{ left: `${optimalPos}%` }}
            title={`Optimal: ${formatDate(optimalDate)}`}
          />
        </div>
        <div className="flex justify-center mt-1.5">
          <span className="text-[10px] text-[var(--accent-primary)] font-medium">
            Optimal: {formatDate(optimalDate)}
          </span>
        </div>
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-[var(--text-tertiary)]">Confidence</span>
        <div className="flex-1 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${prediction.confidence}%` }}
          />
        </div>
        <span className="text-xs font-semibold tabular-nums text-[var(--text-secondary)]">
          {prediction.confidence}%
        </span>
      </div>

      {/* Driver */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
        <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {prediction.primaryDriver}
        </p>
      </div>
    </div>
  );
}
