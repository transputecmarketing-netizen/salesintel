"use client";

import { cn } from "@/lib/utils";
import { Filter, X } from "lucide-react";
import type { SignalType, SignalSeverity, SignalFilters as ISignalFilters } from "@/types/signal";

interface SignalFiltersProps {
  filters: ISignalFilters;
  onChange: (filters: ISignalFilters) => void;
  className?: string;
}

const signalTypes: { value: SignalType; label: string }[] = [
  { value: "funding", label: "Funding" },
  { value: "hiring", label: "Hiring" },
  { value: "expansion", label: "Expansion" },
  { value: "leadership", label: "Leadership" },
  { value: "technology", label: "Technology" },
  { value: "competitive", label: "Competitive" },
  { value: "financial", label: "Financial" },
  { value: "tender", label: "Tender" },
  { value: "product_launch", label: "Product Launch" },
  { value: "partnership", label: "Partnership" },
  { value: "earnings", label: "Earnings" },
  { value: "social", label: "Social" },
];

const severities: { value: SignalSeverity; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "info", label: "Info" },
];

const dateRanges = [
  { label: "Today", days: 1 },
  { label: "This Week", days: 7 },
  { label: "This Month", days: 30 },
  { label: "This Quarter", days: 90 },
];

export default function SignalFilters({ filters, onChange, className }: SignalFiltersProps) {
  const activeCount =
    (filters.types?.length ?? 0) +
    (filters.severities?.length ?? 0) +
    (filters.dateRange ? 1 : 0);

  const toggleType = (type: SignalType) => {
    const current = filters.types ?? [];
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onChange({ ...filters, types: next.length ? next : undefined });
  };

  const toggleSeverity = (sev: SignalSeverity) => {
    const current = filters.severities ?? [];
    const next = current.includes(sev)
      ? current.filter((s) => s !== sev)
      : [...current, sev];
    onChange({ ...filters, severities: next.length ? next : undefined });
  };

  const setDateRange = (days: number) => {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - days * 86400000).toISOString();
    onChange({ ...filters, dateRange: { start, end } });
  };

  const clearAll = () => {
    onChange({});
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Filter header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
          <Filter className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-primary)] text-white text-[11px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Signal type pills */}
      <div>
        <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1.5">
          Signal Type
        </p>
        <div className="flex flex-wrap gap-1.5">
          {signalTypes.map(({ value, label }) => {
            const active = filters.types?.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggleType(value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                  active
                    ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--border-hover)]"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Severity pills */}
      <div>
        <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1.5">
          Severity
        </p>
        <div className="flex flex-wrap gap-1.5">
          {severities.map(({ value, label }) => {
            const active = filters.severities?.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggleSeverity(value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                  active
                    ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--border-hover)]"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date range */}
      <div>
        <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1.5">
          Date Range
        </p>
        <div className="flex flex-wrap gap-1.5">
          {dateRanges.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => setDateRange(days)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--border-hover)]"
              )}
            >
              {label}
            </button>
          ))}
          {filters.dateRange && (
            <button
              onClick={() => onChange({ ...filters, dateRange: undefined })}
              className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
