import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num}`;
}

export function formatEmployeeCount(count: string | number | null): string {
  if (!count) return "Unknown";
  if (typeof count === "string") return count;
  if (count >= 10000) return `${(count / 1000).toFixed(0)}K+`;
  return count.toLocaleString();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return d.toLocaleDateString();
}

export function getSignalColor(type: string): string {
  const colors: Record<string, string> = {
    funding: "var(--badge-funding)",
    hiring: "var(--badge-hiring)",
    expansion: "var(--badge-expansion)",
    leadership: "var(--badge-leadership)",
    technology: "var(--badge-technology)",
    competitive: "var(--badge-competitive)",
    financial: "var(--badge-financial)",
    tender: "var(--badge-tender)",
    product_launch: "var(--badge-technology)",
    partnership: "var(--badge-expansion)",
    earnings: "var(--badge-financial)",
    social: "var(--badge-hiring)",
  };
  return colors[type] || "var(--text-tertiary)";
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: "var(--signal-critical)",
    high: "var(--signal-high)",
    medium: "var(--signal-medium)",
    low: "var(--signal-low)",
    info: "var(--text-tertiary)",
  };
  return colors[severity] || "var(--text-tertiary)";
}

export function getHealthColor(score: number): string {
  if (score >= 61) return "var(--signal-positive)";
  if (score >= 31) return "var(--signal-high)";
  return "var(--signal-critical)";
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "\u2026";
}
