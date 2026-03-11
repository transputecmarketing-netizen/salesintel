import { cn } from "@/lib/utils";
import { getHealthColor } from "@/lib/utils";

interface SignalHealthBarProps {
  score: number;
  showLabel?: boolean;
}

export default function SignalHealthBar({ score, showLabel = false }: SignalHealthBarProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = getHealthColor(clamped);

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span
          className="text-xs font-medium tabular-nums min-w-[2rem] text-right"
          style={{ color }}
        >
          {clamped}
        </span>
      )}
    </div>
  );
}
