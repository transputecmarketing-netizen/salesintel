"use client";

import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";
import type { Signal } from "@/types/signal";
import SignalCard from "./SignalCard";
import EmptyState from "@/components/shared/EmptyState";

interface SignalFeedProps {
  signals: Signal[];
  loading?: boolean;
  onDismiss?: (id: string) => void;
  onAction?: (id: string) => void;
  className?: string;
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-16 rounded-full bg-[var(--bg-tertiary)]" />
        <div className="h-2 w-2 rounded-full bg-[var(--bg-tertiary)]" />
        <div className="h-3 w-12 rounded bg-[var(--bg-tertiary)]" />
      </div>
      <div className="h-4 w-3/4 rounded bg-[var(--bg-tertiary)] mb-2" />
      <div className="h-3 w-full rounded bg-[var(--bg-tertiary)] mb-1" />
      <div className="h-3 w-5/6 rounded bg-[var(--bg-tertiary)] mb-4" />
      <div className="flex justify-between">
        <div className="h-7 w-20 rounded bg-[var(--bg-tertiary)]" />
        <div className="h-7 w-28 rounded bg-[var(--bg-tertiary)]" />
      </div>
    </div>
  );
}

export default function SignalFeed({
  signals,
  loading = false,
  onDismiss,
  onAction,
  className,
}: SignalFeedProps) {
  if (loading) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!signals.length) {
    return (
      <EmptyState
        icon={Inbox}
        headline="No signals yet"
        description="Signals will appear here as we detect buying intent and key events from your watchlist."
        className={className}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {signals.map((signal) => (
        <SignalCard
          key={signal.id}
          signal={signal}
          onDismiss={onDismiss}
          onAction={onAction}
        />
      ))}
    </div>
  );
}
