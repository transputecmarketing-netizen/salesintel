import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import SignalHealthBar from "@/components/shared/SignalHealthBar";

interface HighIntentCompany {
  id: string;
  name: string;
  logoUrl: string | null;
  intentScore: number;
  signalCount: number;
  topSignal: string;
}

interface HighIntentMatchesProps {
  className?: string;
}

const mockCompanies: HighIntentCompany[] = [
  {
    id: "1",
    name: "Datadog",
    logoUrl: null,
    intentScore: 92,
    signalCount: 5,
    topSignal: "Series F + leadership change + hiring surge",
  },
  {
    id: "2",
    name: "Notion",
    logoUrl: null,
    intentScore: 87,
    signalCount: 3,
    topSignal: "Enterprise expansion + new CTO appointed",
  },
  {
    id: "3",
    name: "Figma",
    logoUrl: null,
    intentScore: 81,
    signalCount: 4,
    topSignal: "API platform launch + developer hiring",
  },
];

export default function HighIntentMatches({ className }: HighIntentMatchesProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-orange-400" />
        <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
          High Intent Today
        </h3>
      </div>

      <div className="space-y-2">
        {mockCompanies.map((company, i) => (
          <div
            key={company.id}
            className="group px-3 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-hover)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-[11px] font-bold text-[var(--text-tertiary)] w-4 text-right">
                #{i + 1}
              </span>
              <div className="w-6 h-6 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-[10px] font-bold text-[var(--text-tertiary)]">
                {company.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)] flex-1 truncate">
                {company.name}
              </span>
              <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                {company.intentScore}
              </span>
            </div>
            <div className="ml-[1.625rem]">
              <SignalHealthBar score={company.intentScore} />
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5 line-clamp-1">
                {company.topSignal}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
