import { cn } from "@/lib/utils";
import { Cpu, Plus, Minus } from "lucide-react";
import type { TechStackItem } from "@/types/company";

interface TechStackViewProps {
  techStack?: TechStackItem[];
  className?: string;
}

const mockStack: TechStackItem[] = [
  { name: "React", category: "Frontend", detectedAt: "2025-06-01" },
  { name: "Next.js", category: "Frontend", detectedAt: "2025-09-15" },
  { name: "TypeScript", category: "Frontend", detectedAt: "2025-06-01" },
  { name: "Node.js", category: "Backend", detectedAt: "2025-06-01" },
  { name: "Python", category: "Backend", detectedAt: "2025-06-01" },
  { name: "PostgreSQL", category: "Database", detectedAt: "2025-06-01" },
  { name: "Redis", category: "Database", detectedAt: "2025-08-20" },
  { name: "Kubernetes", category: "Infrastructure", detectedAt: "2025-11-28" },
  { name: "AWS", category: "Infrastructure", detectedAt: "2025-06-01" },
  { name: "Terraform", category: "Infrastructure", detectedAt: "2025-10-01" },
  { name: "Datadog", category: "Observability", detectedAt: "2025-06-01" },
  { name: "Snowflake", category: "Analytics", detectedAt: "2025-07-15" },
  { name: "dbt", category: "Analytics", detectedAt: "2025-11-10" },
];

const removedTech = ["Docker Swarm", "MySQL"];

export default function TechStackView({ techStack, className }: TechStackViewProps) {
  const stack = techStack?.length ? techStack : mockStack;

  // Group by category
  const grouped = stack.reduce<Record<string, TechStackItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const isRecent = (dateStr: string) => {
    const d = new Date(dateStr);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return d >= threeMonthsAgo;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Cpu className="w-4 h-4 text-[var(--accent-primary)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Technology Stack</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
              {category}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item) => {
                const recent = isRecent(item.detectedAt);
                return (
                  <span
                    key={item.name}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                      recent
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)]"
                    )}
                  >
                    {recent && <Plus className="w-3 h-3" />}
                    {item.name}
                  </span>
                );
              })}
            </div>
          </div>
        ))}

        {/* Removed technologies */}
        {removedTech.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
              Removed
            </p>
            <div className="flex flex-wrap gap-1.5">
              {removedTech.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/25 line-through"
                >
                  <Minus className="w-3 h-3" />
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
