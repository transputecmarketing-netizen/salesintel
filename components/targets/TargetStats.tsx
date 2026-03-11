import { cn } from "@/lib/utils";
import { Target, Flame, Activity } from "lucide-react";

interface StatCard {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color: string;
}

interface TargetStatsProps {
  totalTargets?: number;
  highIntentToday?: number;
  avgHealth?: number;
  className?: string;
}

export default function TargetStats({
  totalTargets = 47,
  highIntentToday = 8,
  avgHealth = 68,
  className,
}: TargetStatsProps) {
  const stats: StatCard[] = [
    {
      label: "Total Targets",
      value: totalTargets,
      change: "+3 this week",
      icon: Target,
      color: "text-blue-400",
    },
    {
      label: "High Intent Today",
      value: highIntentToday,
      change: "+2 vs yesterday",
      icon: Flame,
      color: "text-orange-400",
    },
    {
      label: "Avg Health Score",
      value: avgHealth,
      change: "+5 pts this month",
      icon: Activity,
      color: "text-emerald-400",
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-3", className)}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                {stat.label}
              </span>
              <Icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {stat.value}
            </p>
            {stat.change && (
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{stat.change}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
