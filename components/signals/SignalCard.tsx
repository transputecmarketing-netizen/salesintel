"use client";

import { cn } from "@/lib/utils";
import { getSignalColor, getSeverityColor } from "@/lib/utils";
import { X } from "lucide-react";
import type { Signal } from "@/types/signal";
import SignalBadge from "./SignalBadge";
import TimeAgo from "@/components/shared/TimeAgo";
import SignalHealthBar from "@/components/shared/SignalHealthBar";
import ContextualAction from "@/components/shared/ContextualAction";

interface SignalCardProps {
  signal: Signal;
  onDismiss?: (id: string) => void;
  onAction?: (id: string) => void;
}

export default function SignalCard({ signal, onDismiss, onAction }: SignalCardProps) {
  const borderColor = getSignalColor(signal.signalType);
  const severityColor = getSeverityColor(signal.severity);

  return (
    <div
      className={cn(
        "relative rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]",
        "hover:border-[var(--border-hover)] transition-colors",
        "overflow-hidden"
      )}
    >
      {/* Left border accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
        style={{ backgroundColor: borderColor }}
      />

      <div className="pl-5 pr-4 py-4">
        {/* Top row: badge, severity, time */}
        <div className="flex items-center gap-2 mb-2">
          <SignalBadge type={signal.signalType} />
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: severityColor }}
            title={signal.severity}
          />
          <TimeAgo date={signal.detectedAt} />
        </div>

        {/* Company row */}
        {signal.company && (
          <div className="flex items-center gap-2 mb-2">
            {signal.company.logoUrl ? (
              <img
                src={signal.company.logoUrl}
                alt=""
                className="w-5 h-5 rounded object-contain bg-[var(--bg-tertiary)]"
              />
            ) : (
              <div className="w-5 h-5 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-[10px] font-bold text-[var(--text-tertiary)]">
                {signal.company.name.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {signal.company.name}
            </span>
            {signal.company.industry && (
              <span className="text-[11px] text-[var(--text-tertiary)]">
                {signal.company.industry}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 leading-snug">
          {signal.title}
        </h3>

        {/* AI Summary */}
        {signal.summary && (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-3">
            {signal.summary}
          </p>
        )}

        {/* Source + intent score */}
        <div className="flex items-center gap-3 mb-3">
          {signal.sourceName && (
            <span className="text-[11px] text-[var(--text-tertiary)] shrink-0">
              {signal.sourceName}
            </span>
          )}
          <div className="flex-1 max-w-[120px]">
            <SignalHealthBar score={signal.intentScore} />
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums shrink-0">
            Intent: {signal.intentScore}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onDismiss?.(signal.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Dismiss
          </button>

          <ContextualAction
            signalType={signal.signalType}
            onClick={() => onAction?.(signal.id)}
          />
        </div>
      </div>
    </div>
  );
}
