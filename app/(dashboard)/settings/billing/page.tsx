"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Zap,
  TrendingUp,
  Clock,
  Download,
} from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    credits: 200,
    features: [
      "200 research credits/month",
      "5 target companies",
      "Basic signal alerts",
      "Email support",
    ],
    current: false,
  },
  {
    name: "Pro",
    price: "$149",
    period: "/month",
    credits: 1000,
    features: [
      "1,000 research credits/month",
      "Unlimited target companies",
      "All signal types + AI synthesis",
      "CRM integrations",
      "Team collaboration (5 seats)",
      "Priority support",
    ],
    current: true,
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    credits: -1,
    features: [
      "Unlimited research credits",
      "Unlimited everything",
      "Custom integrations + API",
      "Dedicated success manager",
      "SSO + SCIM provisioning",
      "Custom AI training",
    ],
    current: false,
  },
];

const usageHistory = [
  { date: "Mar 11", credits: 23, action: "Deep research — Stripe" },
  { date: "Mar 10", credits: 15, action: "Deep research — Figma" },
  { date: "Mar 9", credits: 8, action: "Signal analysis — Datadog" },
  { date: "Mar 8", credits: 12, action: "Deep research — Linear" },
  { date: "Mar 7", credits: 5, action: "Contact enrichment — Notion" },
  { date: "Mar 5", credits: 20, action: "Deep research — Vercel" },
];

const invoices = [
  { date: "Mar 1, 2025", amount: "$149.00", status: "Paid" },
  { date: "Feb 1, 2025", amount: "$149.00", status: "Paid" },
  { date: "Jan 1, 2025", amount: "$149.00", status: "Paid" },
];

export default function BillingPage() {
  const creditsUsed = 847;
  const creditsTotal = 1000;
  const pct = (creditsUsed / creditsTotal) * 100;

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
          Billing &amp; Usage
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Manage your plan, credits, and billing history
        </p>
      </div>

      {/* Credit Usage */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Credit Usage — This Month
          </h2>
          <span className="text-xs text-[var(--text-tertiary)]">
            Resets Apr 1, 2025
          </span>
        </div>
        <div className="mb-2 flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold text-[var(--text-primary)]">
              {creditsUsed}
            </span>
            <span className="text-sm text-[var(--text-tertiary)]">
              {" "}
              / {creditsTotal.toLocaleString()} credits
            </span>
          </div>
          <span
            className={cn(
              "text-xs font-medium",
              pct > 90
                ? "text-[var(--signal-critical)]"
                : pct > 70
                  ? "text-[var(--signal-high)]"
                  : "text-[var(--signal-positive)]"
            )}
          >
            {(100 - pct).toFixed(0)}% remaining
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[var(--bg-hover)]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor:
                pct > 90
                  ? "var(--signal-critical)"
                  : pct > 70
                    ? "var(--signal-high)"
                    : "var(--accent)",
            }}
          />
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
          Plans
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-[var(--radius-lg)] border p-5",
                plan.current
                  ? "border-[var(--accent)] bg-[var(--accent-subtle)] shadow-[var(--shadow-glow)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
              )}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                  Current Plan
                </span>
              )}
              <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-2xl font-bold text-[var(--text-primary)]">
                  {plan.price}
                </span>
                <span className="text-sm text-[var(--text-tertiary)]">
                  {plan.period}
                </span>
              </div>
              <ul className="mb-4 space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
                  >
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[var(--signal-positive)]" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.current ? (
                <button className="w-full rounded-[var(--radius-md)] border border-[var(--accent)] py-2 text-xs font-medium text-[var(--accent)]" disabled>
                  Current Plan
                </button>
              ) : plan.name === "Enterprise" ? (
                <button className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                  Contact Sales
                </button>
              ) : (
                <button className="w-full rounded-[var(--radius-md)] bg-[var(--accent)] py-2 text-xs font-medium text-white hover:bg-[var(--accent-hover)] transition-colors">
                  Upgrade
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Usage */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
          Recent Credit Usage
        </h2>
        <div className="space-y-2">
          {usageHistory.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-[var(--radius-sm)] p-2 text-sm hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-tertiary)]">
                  {item.date}
                </span>
                <span className="text-[var(--text-primary)]">
                  {item.action}
                </span>
              </div>
              <span className="text-xs font-medium text-[var(--signal-high)]">
                -{item.credits} credits
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <CreditCard className="h-4 w-4 text-[var(--text-tertiary)]" />
          Invoices
        </h2>
        <div className="space-y-2">
          {invoices.map((inv, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-[var(--radius-sm)] p-2 hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[var(--text-tertiary)]">{inv.date}</span>
                <span className="text-[var(--text-primary)]">{inv.amount}</span>
                <span className="rounded-full bg-[rgba(16,185,129,0.12)] px-2 py-0.5 text-[10px] font-medium text-[var(--signal-positive)]">
                  {inv.status}
                </span>
              </div>
              <button className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline">
                <Download className="h-3 w-3" />
                PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
