import { cn } from "@/lib/utils";
import ScoreGauge from "@/components/shared/ScoreGauge";
import { TrendingUp } from "lucide-react";
import type { CompanyScores } from "@/types/company";

interface PropensityScoreProps {
  scores: CompanyScores;
  className?: string;
}

const mockFactors: { label: string; impact: number }[] = [
  { label: "Recent funding round", impact: 28 },
  { label: "Hiring surge in engineering", impact: 22 },
  { label: "Technology stack overlap", impact: 18 },
  { label: "Industry vertical fit", impact: 15 },
  { label: "Expansion signals detected", impact: 12 },
];

export default function PropensityScore({ scores, className }: PropensityScoreProps) {
  const factors = Object.entries(scores.propensityFactors).length
    ? Object.entries(scores.propensityFactors).map(([label, impact]) => ({ label, impact }))
    : mockFactors;

  const sortedFactors = [...factors].sort((a, b) => b.impact - a.impact).slice(0, 5);
  const maxImpact = Math.max(...sortedFactors.map((f) => f.impact), 1);

  return (
    <div
      className={cn(
        "p-5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)]",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Propensity to Buy</h3>
      </div>

      <div className="flex items-start gap-6">
        <ScoreGauge score={scores.propensityScore} label="Score" size="md" />

        <div className="flex-1 space-y-2">
          <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
            Contributing Factors
          </p>
          {sortedFactors.map((factor) => (
            <div key={factor.label} className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">
                {factor.label}
              </span>
              <div className="w-20 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500"
                  style={{ width: `${(factor.impact / maxImpact) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-[var(--text-tertiary)] w-6 text-right">
                +{factor.impact}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
