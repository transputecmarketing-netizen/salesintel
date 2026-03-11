import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
        funding:
          "bg-[rgba(139,92,246,0.12)] text-[var(--badge-funding)] border border-[rgba(139,92,246,0.2)]",
        hiring:
          "bg-[rgba(6,182,212,0.12)] text-[var(--badge-hiring)] border border-[rgba(6,182,212,0.2)]",
        expansion:
          "bg-[rgba(16,185,129,0.12)] text-[var(--badge-expansion)] border border-[rgba(16,185,129,0.2)]",
        leadership:
          "bg-[rgba(245,158,11,0.12)] text-[var(--badge-leadership)] border border-[rgba(245,158,11,0.2)]",
        technology:
          "bg-[rgba(59,130,246,0.12)] text-[var(--badge-technology)] border border-[rgba(59,130,246,0.2)]",
        competitive:
          "bg-[rgba(239,68,68,0.12)] text-[var(--badge-competitive)] border border-[rgba(239,68,68,0.2)]",
        financial:
          "bg-[rgba(236,72,153,0.12)] text-[var(--badge-financial)] border border-[rgba(236,72,153,0.2)]",
        tender:
          "bg-[rgba(20,184,166,0.12)] text-[var(--badge-tender)] border border-[rgba(20,184,166,0.2)]",
        critical:
          "bg-[rgba(239,68,68,0.12)] text-[var(--signal-critical)] border border-[rgba(239,68,68,0.2)]",
        high:
          "bg-[rgba(245,158,11,0.12)] text-[var(--signal-high)] border border-[rgba(245,158,11,0.2)]",
        medium:
          "bg-[rgba(59,130,246,0.12)] text-[var(--signal-medium)] border border-[rgba(59,130,246,0.2)]",
        low:
          "bg-[rgba(107,114,128,0.12)] text-[var(--signal-low)] border border-[rgba(107,114,128,0.2)]",
        positive:
          "bg-[rgba(16,185,129,0.12)] text-[var(--signal-positive)] border border-[rgba(16,185,129,0.2)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
