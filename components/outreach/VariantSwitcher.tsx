"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Snowflake, Flame, Zap } from "lucide-react";

type Variant = "cold" | "warm" | "trigger";

interface VariantContent {
  subject: string;
  preview: string;
}

interface VariantSwitcherProps {
  onVariantChange?: (variant: Variant, content: VariantContent) => void;
  className?: string;
}

const variants: {
  id: Variant;
  label: string;
  icon: React.ElementType;
  color: string;
  activeColor: string;
  content: VariantContent;
}[] = [
  {
    id: "cold",
    label: "Cold",
    icon: Snowflake,
    color: "text-blue-400",
    activeColor: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    content: {
      subject: "Quick question about your infrastructure stack",
      preview:
        "Hi Marcus, I noticed Datadog is scaling rapidly and thought you might be evaluating solutions for...",
    },
  },
  {
    id: "warm",
    label: "Warm",
    icon: Flame,
    color: "text-orange-400",
    activeColor: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    content: {
      subject: "Following up on your K8s migration post",
      preview:
        "Hi Marcus, Your blog post on migrating 200+ microservices was a great read. We have been solving similar challenges at...",
    },
  },
  {
    id: "trigger",
    label: "Trigger-Based",
    icon: Zap,
    color: "text-purple-400",
    activeColor: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    content: {
      subject: "Re: Your Kubernetes Migration -- Thought This Might Help",
      preview:
        "Hi Marcus, Congrats on the Series C! With the infrastructure modernization you have underway, I thought you would find value in...",
    },
  },
];

export default function VariantSwitcher({ onVariantChange, className }: VariantSwitcherProps) {
  const [active, setActive] = useState<Variant>("trigger");

  const handleSwitch = (variant: Variant) => {
    setActive(variant);
    const found = variants.find((v) => v.id === variant);
    if (found) {
      onVariantChange?.(variant, found.content);
    }
  };

  const activeVariant = variants.find((v) => v.id === active)!;

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
        Message Variant
      </p>

      {/* Tabs */}
      <div className="flex gap-2">
        {variants.map((variant) => {
          const Icon = variant.icon;
          const isActive = active === variant.id;
          return (
            <button
              key={variant.id}
              onClick={() => handleSwitch(variant.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all",
                isActive
                  ? variant.activeColor
                  : "border-[var(--border-primary)] text-[var(--text-tertiary)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)]"
              )}
            >
              <Icon className="w-4 h-4" />
              {variant.label}
            </button>
          );
        })}
      </div>

      {/* Preview */}
      <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <p className="text-xs font-medium text-[var(--text-primary)] mb-1">
          {activeVariant.content.subject}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
          {activeVariant.content.preview}
        </p>
      </div>
    </div>
  );
}
