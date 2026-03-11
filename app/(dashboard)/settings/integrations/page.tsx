"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Plug,
  CheckCircle2,
  Circle,
  ExternalLink,
  Settings,
} from "lucide-react";

const integrations = [
  {
    name: "Salesforce",
    category: "CRM",
    description: "Sync contacts, accounts, and opportunities bidirectionally",
    icon: "SF",
    iconColor: "#00A1E0",
    connected: true,
    lastSync: "5 min ago",
  },
  {
    name: "HubSpot",
    category: "CRM",
    description: "Push intelligence directly to HubSpot contacts and deals",
    icon: "HS",
    iconColor: "#FF7A59",
    connected: false,
    lastSync: null,
  },
  {
    name: "Slack",
    category: "Communication",
    description: "Get signal alerts in your team Slack channels",
    icon: "SL",
    iconColor: "#4A154B",
    connected: true,
    lastSync: "Real-time",
  },
  {
    name: "Gmail",
    category: "Email",
    description: "Send AI-drafted outreach directly from your Gmail account",
    icon: "GM",
    iconColor: "#EA4335",
    connected: true,
    lastSync: "Connected",
  },
  {
    name: "Outlook",
    category: "Email",
    description: "Microsoft 365 email integration for outreach",
    icon: "OL",
    iconColor: "#0078D4",
    connected: false,
    lastSync: null,
  },
  {
    name: "LinkedIn Sales Navigator",
    category: "Social",
    description: "Enrich contact data and track social engagement",
    icon: "LI",
    iconColor: "#0A66C2",
    connected: false,
    lastSync: null,
  },
  {
    name: "Gong",
    category: "Revenue Intelligence",
    description: "Correlate call insights with buying signals",
    icon: "GG",
    iconColor: "#7C3AED",
    connected: false,
    lastSync: null,
  },
  {
    name: "Zapier",
    category: "Automation",
    description: "Connect SalesIntel to 5,000+ apps via Zapier workflows",
    icon: "ZP",
    iconColor: "#FF4A00",
    connected: false,
    lastSync: null,
  },
];

export default function IntegrationsPage() {
  const connected = integrations.filter((i) => i.connected);
  const available = integrations.filter((i) => !i.connected);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          Integrations
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Connect your sales stack for seamless intelligence workflow
        </p>
      </div>

      {/* Connected */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Connected ({connected.length})
        </h2>
        <div className="space-y-3">
          {connected.map((integration) => (
            <div
              key={integration.name}
              className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-xs font-bold text-white"
                style={{ backgroundColor: integration.iconColor }}
              >
                {integration.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {integration.name}
                  </p>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--signal-positive)]" />
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    {integration.category}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {integration.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[10px] text-[var(--signal-positive)]">
                  Last sync: {integration.lastSync}
                </span>
                <button className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]">
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Available ({available.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {available.map((integration) => (
            <div
              key={integration.name}
              className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 transition-all hover:border-[var(--border-default)]"
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-xs font-bold text-white"
                  style={{ backgroundColor: integration.iconColor }}
                >
                  {integration.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {integration.name}
                  </p>
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    {integration.category}
                  </span>
                </div>
              </div>
              <p className="mb-3 text-xs text-[var(--text-tertiary)]">
                {integration.description}
              </p>
              <button className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
