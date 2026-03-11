import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface CreditUsageProps {
  used: number;
  limit: number;
  className?: string;
}

export default function CreditUsage({ used, limit, className }: CreditUsageProps) {
  const percentage = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Zap
        className={cn(
          "w-4 h-4 shrink-0",
          isCritical
            ? "text-[var(--signal-critical)]"
            : isWarning
              ? "text-[var(--signal-high)]"
              : "text-[var(--text-tertiary)]"
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">Credits</span>
          <span className="text-xs tabular-nums text-[var(--text-tertiary)]">
            {used.toLocaleString()} / {limit.toLocaleString()}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isCritical
                ? "bg-[var(--signal-critical)]"
                : isWarning
                  ? "bg-[var(--signal-high)]"
                  : "bg-[var(--accent-primary)]"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
