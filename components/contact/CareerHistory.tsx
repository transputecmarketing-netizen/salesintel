import { cn } from "@/lib/utils";
import { Briefcase } from "lucide-react";
import type { CareerEntry } from "@/types/contact";

interface CareerHistoryProps {
  entries?: CareerEntry[];
  className?: string;
}

const mockEntries: CareerEntry[] = [
  { company: "Datadog", title: "Chief Technology Officer", startDate: "2023-03", endDate: null },
  { company: "Stripe", title: "VP Engineering", startDate: "2020-01", endDate: "2023-02" },
  { company: "Google", title: "Senior Staff Engineer", startDate: "2016-06", endDate: "2019-12" },
  { company: "Meta", title: "Software Engineer", startDate: "2013-09", endDate: "2016-05" },
];

function formatPeriod(start: string, end: string | null): string {
  const fmt = (d: string) =>
    new Date(d + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return `${fmt(start)} - ${end ? fmt(end) : "Present"}`;
}

function durationYears(start: string, end: string | null): string {
  const s = new Date(start + "-01");
  const e = end ? new Date(end + "-01") : new Date();
  const years = Math.round((e.getTime() - s.getTime()) / (365.25 * 24 * 60 * 60 * 1000) * 10) / 10;
  return years >= 1 ? `${years.toFixed(1)}y` : `${Math.round(years * 12)}mo`;
}

export default function CareerHistory({ entries, className }: CareerHistoryProps) {
  const career = entries?.length ? entries : mockEntries;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-[var(--accent-primary)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Career History</h3>
      </div>

      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border-primary)]" />

        <div className="space-y-4">
          {career.map((entry, i) => (
            <div key={i} className="relative">
              {/* Dot */}
              <div
                className={cn(
                  "absolute left-[-17px] top-1 w-3 h-3 rounded-full border-2 border-[var(--bg-primary)]",
                  i === 0 ? "bg-[var(--accent-primary)]" : "bg-[var(--border-primary)]"
                )}
              />

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    {entry.title}
                  </h4>
                  <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">
                    {durationYears(entry.startDate, entry.endDate)}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{entry.company}</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  {formatPeriod(entry.startDate, entry.endDate)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
