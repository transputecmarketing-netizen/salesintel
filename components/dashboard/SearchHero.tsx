"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Building2, Mail, Loader2 } from "lucide-react";

interface SearchHeroProps {
  onSearch?: (companyName: string, email: string) => void;
  className?: string;
}

export default function SearchHero({ onSearch, className }: SearchHeroProps) {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName && !email) return;
    setSearching(true);
    onSearch?.(companyName, email);
    // Reset after a delay for demo
    setTimeout(() => setSearching(false), 2000);
  };

  return (
    <div className={cn("text-center", className)}>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
        Research any company{" "}
        <span className="text-[var(--accent-primary)]">in seconds</span>
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
        Enter a company name or decision-maker email to get AI-powered buying signals, contact intelligence, and outreach recommendations.
      </p>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-2 p-2 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-lg shadow-black/5">
          {/* Company name input */}
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)]">
            <Building2 className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name..."
              className="flex-1 text-sm text-[var(--text-primary)] bg-transparent outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </div>

          {/* Divider */}
          <div className="hidden sm:flex items-center">
            <span className="text-xs text-[var(--text-tertiary)]">or</span>
          </div>

          {/* Email input */}
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)]">
            <Mail className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Decision-maker email..."
              className="flex-1 text-sm text-[var(--text-primary)] bg-transparent outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </div>

          {/* Search button */}
          <button
            type="submit"
            disabled={searching || (!companyName && !email)}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold",
              "bg-[var(--accent-primary)] text-white",
              "hover:opacity-90 active:scale-[0.98] transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "min-w-[120px]"
            )}
          >
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Research
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
