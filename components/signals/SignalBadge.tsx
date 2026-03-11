import { cn } from "@/lib/utils";
import { getSignalColor } from "@/lib/utils";
import type { SignalType } from "@/types/signal";

interface SignalBadgeProps {
  type: SignalType;
  className?: string;
}

const typeLabels: Record<SignalType, string> = {
  funding: "Funding",
  hiring: "Hiring",
  expansion: "Expansion",
  leadership: "Leadership",
  technology: "Technology",
  financial: "Financial",
  competitive: "Competitive",
  tender: "Tender",
  product_launch: "Product Launch",
  partnership: "Partnership",
  earnings: "Earnings",
  social: "Social",
};

export default function SignalBadge({ type, className }: SignalBadgeProps) {
  const color = getSignalColor(type);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        className
      )}
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {typeLabels[type] ?? type}
    </span>
  );
}
