import { cn } from "@/lib/utils";
import { Sparkles, ExternalLink } from "lucide-react";

interface WhyNowNarrativeProps {
  narrative?: string;
  className?: string;
}

const mockNarrative = `**Datadog** is entering a critical buying window driven by a convergence of three significant signals detected over the past 14 days.

First, their [$85M Series C funding](# "Source: TechCrunch, Dec 8") provides immediate budget availability for new technology investments. The funding announcement specifically mentioned "platform modernization" and "scaling infrastructure" as key priorities.

Second, the [departure of their VP of Engineering](# "Source: LinkedIn, Dec 10") creates a window where new technology decisions are likely to be revisited. Historical patterns show that leadership changes in technical roles correlate with a **73% increase** in vendor evaluation activity within 60 days.

Third, their [active migration to Kubernetes](# "Source: Company Blog, Nov 28") signals a fundamental infrastructure shift that typically requires complementary tooling in observability, security, and CI/CD -- areas where our solution directly applies.

The combination of **available budget**, **decision-maker transition**, and **active infrastructure change** creates an optimal outreach window. Companies exhibiting this specific signal convergence pattern have a **4.2x higher** conversion rate compared to single-signal triggers.

*Recommended action: Initiate contact within the next 7-10 days, before new technical leadership finalizes their vendor evaluation shortlist.*`;

export default function WhyNowNarrative({ narrative, className }: WhyNowNarrativeProps) {
  const content = narrative || mockNarrative;

  // Simple markdown-like rendering for bold and links
  const renderContent = (text: string) => {
    return text.split("\n\n").map((paragraph, i) => {
      // Process inline formatting
      let processed = paragraph;
      // Bold
      processed = processed.replace(
        /\*\*(.+?)\*\*/g,
        '<strong class="font-semibold text-[var(--text-primary)]">$1</strong>'
      );
      // Italic
      processed = processed.replace(
        /\*(.+?)\*/g,
        '<em class="italic text-[var(--accent-primary)]">$1</em>'
      );
      // Links with tooltips
      processed = processed.replace(
        /\[(.+?)\]\((.+?)\s*(?:"(.+?)")?\)/g,
        '<a href="$2" title="$3" class="text-[var(--accent-primary)] underline underline-offset-2 decoration-[var(--accent-primary)]/40 hover:decoration-[var(--accent-primary)] transition-colors">$1</a>'
      );

      return (
        <p
          key={i}
          className="text-sm text-[var(--text-secondary)] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      );
    });
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--border-primary)]",
        className
      )}
    >
      {/* Premium gradient top bar */}
      <div className="h-1 bg-gradient-to-r from-[var(--accent-primary)] via-purple-500 to-[var(--accent-primary)]" />

      <div className="p-6 bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10">
            <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Why Now?</h3>
            <p className="text-[11px] text-[var(--text-tertiary)]">AI-synthesized intelligence brief</p>
          </div>
        </div>

        <div className="space-y-3">{renderContent(content)}</div>

        <div className="mt-4 pt-4 border-t border-[var(--border-primary)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-tertiary)]">
            Generated from 12 sources across 3 signal types
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            SalesIntel AI
          </span>
        </div>
      </div>
    </div>
  );
}
