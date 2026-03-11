import { cn } from "@/lib/utils";
import ScoreGauge from "@/components/shared/ScoreGauge";
import type { CompanyScores } from "@/types/company";

interface AccountHealthGaugeProps {
  scores: CompanyScores;
  className?: string;
}

interface SubScoreBarProps {
  label: string;
  value: number;
  color: string;
}

function SubScoreBar({ label, value, color }: SubScoreBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-[var(--text-tertiary)] w-16 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-semibold tabular-nums text-[var(--text-secondary)] w-7 text-right">
        {value}
      </span>
    </div>
  );
}

export default function AccountHealthGauge({ scores, className }: AccountHealthGaugeProps) {
  return (
    <div
      className={cn(
        "p-5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)]",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Account Health</h3>

      <div className="flex items-center gap-6">
        <ScoreGauge score={scores.healthScore} label="Overall" size="lg" />

        <div className="flex-1 space-y-2.5">
          <SubScoreBar label="Fit" value={scores.healthFitComponent} color="var(--badge-funding)" />
          <SubScoreBar
            label="Velocity"
            value={scores.healthVelocityComponent}
            color="var(--badge-hiring)"
          />
          <SubScoreBar
            label="Intent"
            value={scores.healthIntentComponent}
            color="var(--badge-expansion)"
          />
          <SubScoreBar
            label="Readiness"
            value={scores.healthReadinessComponent}
            color="var(--badge-leadership)"
          />
        </div>
      </div>
    </div>
  );
}
