import { cn } from "@/lib/utils";
import { Globe, ArrowRight } from "lucide-react";

interface Competitor {
  name: string;
  overlap: number;
  relationship: "direct" | "indirect" | "adjacent";
}

interface CompetitiveConstellationProps {
  className?: string;
}

const mockCompetitors: Competitor[] = [
  { name: "Competitor A", overlap: 85, relationship: "direct" },
  { name: "Competitor B", overlap: 62, relationship: "direct" },
  { name: "Competitor C", overlap: 45, relationship: "indirect" },
  { name: "Adjacent Co D", overlap: 30, relationship: "adjacent" },
  { name: "Adjacent Co E", overlap: 22, relationship: "adjacent" },
];

const relationshipColors: Record<string, string> = {
  direct: "text-red-400 bg-red-500/10 border-red-500/25",
  indirect: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  adjacent: "text-blue-400 bg-blue-500/10 border-blue-500/25",
};

export default function CompetitiveConstellation({ className }: CompetitiveConstellationProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-[var(--accent-primary)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Competitive Landscape
        </h3>
      </div>

      {/* Placeholder for D3 force graph */}
      <div className="relative h-48 rounded-xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden">
        {/* Decorative nodes */}
        <div className="absolute w-12 h-12 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <span className="text-[10px] font-bold text-[var(--accent-primary)]">YOU</span>
        </div>
        <div className="absolute w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 top-6 right-16" />
        <div className="absolute w-6 h-6 rounded-full bg-red-500/10 border border-red-500/30 bottom-8 left-12" />
        <div className="absolute w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 top-10 left-20" />
        <div className="absolute w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30 bottom-10 right-20" />
        <div className="absolute w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30 top-14 right-8" />

        <span className="text-xs text-[var(--text-tertiary)] z-10 bg-[var(--bg-secondary)] px-2">
          Interactive graph coming soon
        </span>
      </div>

      {/* Competitor list */}
      <div className="space-y-1.5">
        {mockCompetitors.map((comp) => (
          <div
            key={comp.name}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
          >
            <div className="w-7 h-7 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-[10px] font-bold text-[var(--text-tertiary)]">
              {comp.name.charAt(0)}
            </div>
            <span className="text-sm text-[var(--text-primary)] flex-1">{comp.name}</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                relationshipColors[comp.relationship]
              )}
            >
              {comp.relationship}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-16 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--text-tertiary)]"
                  style={{ width: `${comp.overlap}%` }}
                />
              </div>
              <span className="text-[11px] tabular-nums text-[var(--text-tertiary)] w-8 text-right">
                {comp.overlap}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
