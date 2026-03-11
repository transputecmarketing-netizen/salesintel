import { cn } from "@/lib/utils";
import { Check, Loader2, Circle, AlertCircle, Clock } from "lucide-react";
import type { ResearchStep as IResearchStep } from "@/types/research";

interface ResearchStepProps {
  step: IResearchStep;
  className?: string;
}

const statusConfig: Record<
  string,
  { icon: React.ElementType; color: string; animate?: boolean }
> = {
  pending: { icon: Circle, color: "text-[var(--text-tertiary)]" },
  running: { icon: Loader2, color: "text-[var(--accent-primary)]", animate: true },
  completed: { icon: Check, color: "text-emerald-400" },
  failed: { icon: AlertCircle, color: "text-red-400" },
};

export default function ResearchStepComponent({ step, className }: ResearchStepProps) {
  const config = statusConfig[step.status] ?? statusConfig.pending!;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-lg transition-colors",
        step.status === "running" && "bg-[var(--accent-primary)]/5",
        step.status === "completed" && "opacity-80",
        className
      )}
    >
      {/* Status icon */}
      <div className="shrink-0 mt-0.5">
        <Icon
          className={cn("w-4 h-4", config.color, config.animate && "animate-spin")}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-sm font-medium",
              step.status === "running"
                ? "text-[var(--text-primary)]"
                : step.status === "completed"
                  ? "text-[var(--text-secondary)]"
                  : "text-[var(--text-tertiary)]"
            )}
          >
            {step.label}
          </span>
          {step.duration !== null && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] tabular-nums">
              <Clock className="w-3 h-3" />
              {step.duration < 1000
                ? `${step.duration}ms`
                : `${(step.duration / 1000).toFixed(1)}s`}
            </span>
          )}
        </div>
        {step.resultPreview && (
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-1">
            {step.resultPreview}
          </p>
        )}
        {step.error && (
          <p className="text-xs text-red-400 mt-0.5">{step.error}</p>
        )}
      </div>
    </div>
  );
}
