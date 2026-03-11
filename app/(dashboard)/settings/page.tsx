"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Settings,
  Radio,
  Plug,
  Users,
  CreditCard,
  ChevronRight,
  User,
  Bell,
  Globe,
  Shield,
} from "lucide-react";

const settingsNav = [
  {
    label: "Signal Preferences",
    description: "Configure which signals to track and alert thresholds",
    href: "/settings/signals",
    icon: Radio,
  },
  {
    label: "Integrations",
    description: "Connect CRM, Slack, email, and other tools",
    href: "/settings/integrations",
    icon: Plug,
  },
  {
    label: "Team",
    description: "Manage team members and permissions",
    href: "/settings/team",
    icon: Users,
  },
  {
    label: "Billing",
    description: "Plan, credits, and usage",
    href: "/settings/billing",
    icon: CreditCard,
  },
];

export default function SettingsPage() {
  const [name, setName] = useState("Alex Johnson");
  const [email, setEmail] = useState("alex@company.com");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Settings
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Manage your account and preferences
        </p>
      </div>

      {/* Quick nav cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {settingsNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 transition-all hover:border-[var(--border-default)] hover:bg-[var(--bg-hover)]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-tertiary)]">
              <item.icon className="h-5 w-5 text-[var(--text-tertiary)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                {item.label}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {item.description}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>

      {/* General Settings Form */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <User className="h-4 w-4 text-[var(--text-tertiary)]" />
          Profile Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-md rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full max-w-md rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full max-w-md rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            >
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="Europe/London">GMT</option>
              <option value="Europe/Berlin">CET</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end border-t border-[var(--border-subtle)] pt-4">
          <button className="rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Bell className="h-4 w-4 text-[var(--text-tertiary)]" />
          Notification Preferences
        </h2>
        <div className="space-y-3">
          {[
            { label: "Email notifications", description: "Daily digest of new signals and alerts", enabled: true },
            { label: "Browser notifications", description: "Real-time alerts for critical signals", enabled: true },
            { label: "Weekly summary report", description: "Weekly email with account health changes", enabled: false },
            { label: "Slack notifications", description: "Send alerts to your connected Slack workspace", enabled: false },
          ].map((pref) => (
            <div
              key={pref.label}
              className="flex items-center justify-between rounded-[var(--radius-sm)] p-3 hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div>
                <p className="text-sm text-[var(--text-primary)]">
                  {pref.label}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {pref.description}
                </p>
              </div>
              <button
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  pref.enabled
                    ? "bg-[var(--accent)]"
                    : "bg-[var(--bg-hover)]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    pref.enabled ? "left-[22px]" : "left-0.5"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--signal-critical)]/20 bg-[var(--bg-secondary)] p-6">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--signal-critical)]">
          <Shield className="h-4 w-4" />
          Danger Zone
        </h2>
        <p className="mb-4 text-xs text-[var(--text-tertiary)]">
          These actions are irreversible. Please proceed with caution.
        </p>
        <div className="flex items-center gap-3">
          <button className="rounded-[var(--radius-md)] border border-[var(--signal-critical)]/30 px-4 py-2 text-xs font-medium text-[var(--signal-critical)] hover:bg-[var(--signal-critical)]/10 transition-colors">
            Delete All Data
          </button>
          <button className="rounded-[var(--radius-md)] border border-[var(--signal-critical)]/30 px-4 py-2 text-xs font-medium text-[var(--signal-critical)] hover:bg-[var(--signal-critical)]/10 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
