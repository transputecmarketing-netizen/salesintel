"use client";

import { cn } from "@/lib/utils";
import { Building2, Users, Zap, TrendingUp, Loader2 } from "lucide-react";

interface PartialData {
  company?: { name: string; industry: string; employees: string } | null;
  contactCount?: number;
  signalCount?: number;
  healthScore?: number | null;
}

interface PartialResultsProps {
  data?: PartialData;
  className?: string;
}

const mockData: PartialData = {
  company: { name: "Datadog", industry: "Cloud Monitoring", employees: "850" },
  contactCount: 4,
  signalCount: 8,
  healthScore: null,
};

function DataCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number | null | undefined;
  loading?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        <span className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium">
          {label}
        </span>
      </div>
      {loading || value === null || value === undefined ? (
        <div className="flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 text-[var(--text-tertiary)] animate-spin" />
          <span className="text-xs text-[var(--text-tertiary)]">Computing...</span>
        </div>
      ) : (
        <p className="text-sm font-semibold text-[var(--text-primary)]">{value}</p>
      )}
    </div>
  );
}

export default function PartialResults({ data, className }: PartialResultsProps) {
  const d = data ?? mockData;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
        Partial Results
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <DataCard
          icon={Building2}
          label="Company"
          value={d.company ? `${d.company.name} - ${d.company.industry}` : null}
          loading={!d.company}
        />
        <DataCard
          icon={Users}
          label="Contacts Found"
          value={d.contactCount !== undefined ? d.contactCount : null}
        />
        <DataCard
          icon={Zap}
          label="Signals Detected"
          value={d.signalCount !== undefined ? d.signalCount : null}
        />
        <DataCard
          icon={TrendingUp}
          label="Health Score"
          value={d.healthScore !== undefined && d.healthScore !== null ? d.healthScore : null}
          loading={d.healthScore === null || d.healthScore === undefined}
        />
      </div>
    </div>
  );
}
