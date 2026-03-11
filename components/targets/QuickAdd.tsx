"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { X, Building2, Globe, Search, Plus, Loader2 } from "lucide-react";

interface QuickAddProps {
  open: boolean;
  onClose: () => void;
  onAdd?: (companyName: string, domain: string, tier: 1 | 2 | 3) => void;
  className?: string;
}

export default function QuickAdd({ open, onClose, onAdd, className }: QuickAddProps) {
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [tier, setTier] = useState<1 | 2 | 3>(2);
  const [adding, setAdding] = useState(false);

  if (!open) return null;

  const handleAdd = () => {
    if (!companyName) return;
    setAdding(true);
    onAdd?.(companyName, domain, tier);
    setTimeout(() => {
      setAdding(false);
      setCompanyName("");
      setDomain("");
      setTier(2);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div
        className={cn(
          "relative w-full max-w-md rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-2xl",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-primary)]">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Add to Watchlist</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Company Name */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Company Name
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] focus-within:border-[var(--accent-primary)] transition-colors">
              <Building2 className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Stripe"
                className="flex-1 text-sm text-[var(--text-primary)] bg-transparent outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </div>
          </div>

          {/* Domain */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Domain (optional)
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] focus-within:border-[var(--accent-primary)] transition-colors">
              <Globe className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., stripe.com"
                className="flex-1 text-sm text-[var(--text-primary)] bg-transparent outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </div>
          </div>

          {/* Tier */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Tier
            </label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((t) => {
                const labels = { 1: "Strategic", 2: "Target", 3: "Monitor" } as const;
                const colors = {
                  1: "border-amber-500 bg-amber-500/10 text-amber-500",
                  2: "border-blue-500 bg-blue-500/10 text-blue-500",
                  3: "border-gray-500 bg-gray-500/10 text-gray-400",
                } as const;
                return (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                      tier === t
                        ? colors[t]
                        : "border-[var(--border-primary)] text-[var(--text-tertiary)] bg-[var(--bg-secondary)]"
                    )}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border-primary)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!companyName || adding}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Target
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
