import { cn } from "@/lib/utils";

interface TierBadgeProps {
  tier: 1 | 2 | 3;
}

const tierConfig: Record<number, { label: string; bg: string; text: string; border: string }> = {
  1: {
    label: "Strategic",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/30",
  },
  2: {
    label: "Target",
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/30",
  },
  3: {
    label: "Monitor",
    bg: "bg-gray-500/10",
    text: "text-gray-400",
    border: "border-gray-500/30",
  },
};

export default function TierBadge({ tier }: TierBadgeProps) {
  const config = tierConfig[tier] ?? tierConfig[3]!;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border",
        config.bg,
        config.text,
        config.border
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "currentColor" }} />
      {config.label}
    </span>
  );
}
