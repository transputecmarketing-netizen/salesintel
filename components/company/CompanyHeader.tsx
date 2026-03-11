"use client";

import { cn } from "@/lib/utils";
import { formatEmployeeCount } from "@/lib/utils";
import {
  Building2,
  MapPin,
  Users,
  Globe,
  ExternalLink,
  Plus,
  Download,
} from "lucide-react";
import type { Company } from "@/types/company";

interface CompanyHeaderProps {
  company: Company;
  onAddToWatchlist?: () => void;
  onExport?: () => void;
  className?: string;
}

export default function CompanyHeader({
  company,
  onAddToWatchlist,
  onExport,
  className,
}: CompanyHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start gap-4 p-6 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)]",
        className
      )}
    >
      {/* Logo */}
      <div className="shrink-0">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={company.name}
            className="w-16 h-16 rounded-xl object-contain bg-[var(--bg-tertiary)] p-1"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center text-xl font-bold text-[var(--text-tertiary)]">
            {company.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">{company.name}</h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
          {company.industry && (
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              <Building2 className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              {company.industry}
            </span>
          )}
          {(company.hqCity || company.hqCountry) && (
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              <MapPin className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              {[company.hqCity, company.hqState, company.hqCountry].filter(Boolean).join(", ")}
            </span>
          )}
          {company.employeeCount && (
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              <Users className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              {formatEmployeeCount(company.employeeCount)} employees
            </span>
          )}
          {company.domain && (
            <a
              href={`https://${company.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-primary)] hover:underline"
            >
              <Globe className="w-3.5 h-3.5" />
              {company.domain}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {company.description && (
          <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{company.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onAddToWatchlist}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add to Watchlist
        </button>
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-primary)] text-[var(--text-secondary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>
    </div>
  );
}
