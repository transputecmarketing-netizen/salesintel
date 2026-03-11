import { cn } from "@/lib/utils";
import { MessageCircle, Briefcase, Code, Lightbulb } from "lucide-react";
import type { Contact } from "@/types/contact";

interface CommunicationStyleProps {
  style: Contact["commStyle"];
  className?: string;
}

const styleConfig: Record<
  string,
  { label: string; description: string; icon: React.ElementType; color: string; tips: string[] }
> = {
  formal: {
    label: "Formal",
    description: "Prefers structured, professional communication",
    icon: Briefcase,
    color: "text-blue-400",
    tips: [
      "Use proper titles and formal greetings",
      "Lead with data and business outcomes",
      "Keep messages concise and well-structured",
    ],
  },
  casual: {
    label: "Casual",
    description: "Approachable, conversational tone",
    icon: MessageCircle,
    color: "text-emerald-400",
    tips: [
      "Use a friendly, conversational tone",
      "Share relevant stories or anecdotes",
      "Keep it short and to the point",
    ],
  },
  technical: {
    label: "Technical",
    description: "Detail-oriented, values technical depth",
    icon: Code,
    color: "text-purple-400",
    tips: [
      "Include technical specifics and architecture details",
      "Reference relevant documentation or whitepapers",
      "Avoid high-level marketing language",
    ],
  },
  visionary: {
    label: "Visionary",
    description: "Big-picture thinker, values strategic alignment",
    icon: Lightbulb,
    color: "text-amber-400",
    tips: [
      "Lead with the strategic vision and big picture",
      "Connect to industry trends and future state",
      "Use outcome-focused language",
    ],
  },
};

export default function CommunicationStyle({ style, className }: CommunicationStyleProps) {
  if (!style) return null;

  const config = styleConfig[style];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg",
            "bg-[var(--bg-tertiary)]"
          )}
        >
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Communication Style: {config.label}
          </h3>
          <p className="text-[11px] text-[var(--text-tertiary)]">{config.description}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
          Tips for outreach
        </p>
        {config.tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={cn("text-xs mt-0.5 shrink-0", config.color)}>-</span>
            <span className="text-xs text-[var(--text-secondary)] leading-relaxed">{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
