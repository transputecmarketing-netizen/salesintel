import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Users, DollarSign, Building2, Cpu, Swords } from "lucide-react";

interface TrendItem {
  type: string;
  label: string;
  count: number;
  change: number; // positive = up, negative = down, 0 = flat
  icon: React.ElementType;
}

interface AlertTrendsProps {
  className?: string;
}

const mockTrends: TrendItem[] = [
  { type: "hiring", label: "Hiring Surges", count: 14, change: 3, icon: Users },
  { type: "funding", label: "Funding Rounds", count: 7, change: 2, icon: DollarSign },
  { type: "expansion", label: "Expansions", count: 5, change: -1, icon: Building2 },
  { type: "technology", label: "Tech Changes", count: 9, change: 0, icon: Cpu },
  { type: "competitive", label: "Competitive Moves", count: 3, change: 1, icon: Swords },
];

function TrendArrow({ change }: { change: number }) {
  if (change > 0)
    return (
      <span className="flex items-center gap-0.5 text-[11px] font-medium text-emerald-500">
        <TrendingUp className="w-3 h-3" />+{change}
      </span>
    );
  if (change < 0)
    return (
      <span className="flex items-center gap-0.5 text-[11px] font-medium text-red-400">
        <TrendingDown className="w-3 h-3" />{change}
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-[11px] font-medium text-[var(--text-tertiary)]">
      <Minus className="w-3 h-3" />0
    </span>
  );
}

export default function AlertTrends({ className }: AlertTrendsProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
        Alert Trends (7d)
      </h3>
      <div className="space-y-2">
        {mockTrends.map((trend) => {
          const Icon = trend.icon;
          return (
            <div
              key={trend.type}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded bg-[var(--bg-tertiary)]">
                <Icon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-[var(--text-primary)]">{trend.label}</span>
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                {trend.count}
              </span>
              <TrendArrow change={trend.change} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
