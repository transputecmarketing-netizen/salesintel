import { cn } from "@/lib/utils";
import { Sun, ArrowRight, Flame, AlertTriangle, TrendingUp } from "lucide-react";

interface ActionItem {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
}

interface MorningBriefingProps {
  userName?: string;
  className?: string;
}

const mockActions: ActionItem[] = [
  {
    id: "1",
    icon: Flame,
    title: "Datadog buying window opens this week",
    description:
      "3 converging signals detected. Optimal outreach: Wednesday. Draft outreach is ready.",
    urgency: "high",
  },
  {
    id: "2",
    icon: AlertTriangle,
    title: "Notion CTO departure -- act fast",
    description:
      "New leadership change creates a 60-day vendor evaluation window. 2 competitors already reaching out.",
    urgency: "high",
  },
  {
    id: "3",
    icon: TrendingUp,
    title: "5 new high-intent signals overnight",
    description:
      "Hiring surges at 3 target accounts. Funding round detected at Figma. Review your signal feed.",
    urgency: "medium",
  },
];

const urgencyDot: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-[var(--text-tertiary)]",
};

export default function MorningBriefing({ userName = "there", className }: MorningBriefingProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className={cn(
        "p-6 rounded-xl border border-[var(--border-primary)] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)]",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Sun className="w-5 h-5 text-amber-400" />
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Good morning, {userName}
        </h2>
      </div>
      <p className="text-xs text-[var(--text-tertiary)] mb-5">{today}</p>

      <div className="space-y-3">
        {mockActions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className="group flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--border-hover)] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-[var(--text-tertiary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={cn("w-1.5 h-1.5 rounded-full shrink-0", urgencyDot[action.urgency])}
                  />
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {action.title}
                  </h4>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                  {action.description}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
