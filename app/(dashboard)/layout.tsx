"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  Zap,
  LayoutDashboard,
  Crosshair,
  Radio,
  Lightbulb,
  Settings,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Command,
  FileText,
  Users,
  Building2,
  TrendingUp,
  X,
} from "lucide-react";

/* ─── Navigation items ─── */
const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/targets", label: "My Targets", icon: Crosshair },
  { href: "/signals", label: "Signals", icon: Radio, badge: 12 },
  { href: "/insights", label: "Insights", icon: Lightbulb },
];

/* ─── Command Palette ─── */
function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const commands = [
    { icon: Building2, label: "Search companies…", category: "Search" },
    { icon: Users, label: "Find contacts…", category: "Search" },
    { icon: Radio, label: "View latest signals", category: "Navigation" },
    { icon: Crosshair, label: "My targets", category: "Navigation" },
    { icon: FileText, label: "Generate brief", category: "Actions" },
    { icon: TrendingUp, label: "Run deep research", category: "Actions" },
    { icon: Settings, label: "Settings", category: "Navigation" },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-[var(--shadow-lg)]">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent py-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
          />
          <kbd className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-[var(--text-tertiary)]">
              No results found.
            </p>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={i}
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            >
              <cmd.icon className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
              <span className="flex-1">{cmd.label}</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">
                {cmd.category}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard Layout ─── */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
      if (e.key === "Escape") setCmdOpen(false);
    },
    []
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const sidebarW = collapsed ? "w-[68px]" : "w-[240px]";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* ──── Sidebar ──── */}
      <aside
        className={cn(
          "flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] transition-all duration-200",
          sidebarW
        )}
      >
        {/* Logo row */}
        <div className="flex h-16 items-center gap-2.5 border-b border-[var(--border-subtle)] px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <Zap className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
              SalesIntel
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--signal-critical)] px-1.5 text-[10px] font-semibold text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}

          <div className="my-3 h-px bg-[var(--border-subtle)]" />

          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/settings")
                ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
        </nav>

        {/* Credits */}
        {!collapsed && (
          <div className="border-t border-[var(--border-subtle)] p-4">
            <div className="rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] p-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-[var(--text-tertiary)]">Credits</span>
                <span className="text-[var(--text-secondary)]">847 / 1,000</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-hover)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: "84.7%" }}
                />
              </div>
              <Link
                href="/settings/billing"
                className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--accent)] hover:underline"
              >
                <CreditCard className="h-3 w-3" />
                Upgrade plan
              </Link>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-10 items-center justify-center border-t border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* ──── Main area ──── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ──── Topbar ──── */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6">
          {/* Search trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search companies, contacts…</span>
            <kbd className="ml-4 rounded border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-1.5 py-0.5 text-[10px]">
              <Command className="mr-0.5 inline h-2.5 w-2.5" />K
            </kbd>
          </button>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <button className="relative rounded-[var(--radius-sm)] p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--signal-critical)]" />
            </button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </div>
        </header>

        {/* ──── Content ──── */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* ──── Command Palette ──── */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
