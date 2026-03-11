"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Users,
  Plus,
  MoreHorizontal,
  Mail,
  Shield,
  Crown,
  X,
} from "lucide-react";

const members = [
  {
    name: "Alex Johnson",
    email: "alex@company.com",
    role: "Owner",
    initials: "AJ",
    lastActive: "Now",
    targets: 6,
  },
  {
    name: "Sarah Williams",
    email: "sarah@company.com",
    role: "Admin",
    initials: "SW",
    lastActive: "2h ago",
    targets: 4,
  },
  {
    name: "Michael Chen",
    email: "michael@company.com",
    role: "Member",
    initials: "MC",
    lastActive: "1d ago",
    targets: 8,
  },
  {
    name: "Emily Davis",
    email: "emily@company.com",
    role: "Member",
    initials: "ED",
    lastActive: "3d ago",
    targets: 3,
  },
];

const pendingInvites = [
  { email: "john@company.com", role: "Member", sent: "2 days ago" },
  { email: "lisa@company.com", role: "Admin", sent: "1 week ago" },
];

const roleColors: Record<string, string> = {
  Owner: "var(--signal-high)",
  Admin: "var(--accent)",
  Member: "var(--text-tertiary)",
};

export default function TeamSettingsPage() {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Team Management
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage team members and their access permissions
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-tertiary)]">Team Members</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {members.length}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-tertiary)]">Pending Invites</p>
          <p className="text-2xl font-bold text-[var(--signal-high)]">
            {pendingInvites.length}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-tertiary)]">Seat Limit</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {members.length}/10
          </p>
        </div>
      </div>

      {/* Members */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] overflow-hidden">
        <div className="grid grid-cols-[1fr_0.6fr_0.6fr_0.5fr_0.3fr] gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
          <span>Member</span>
          <span>Role</span>
          <span>Last Active</span>
          <span>Targets</span>
          <span />
        </div>
        {members.map((member) => (
          <div
            key={member.email}
            className="grid grid-cols-[1fr_0.6fr_0.6fr_0.5fr_0.3fr] gap-4 items-center border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] px-5 py-3.5 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[10px] font-bold text-[var(--text-primary)]">
                {member.initials}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {member.name}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {member.email}
                </p>
              </div>
            </div>
            <span
              className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `color-mix(in srgb, ${roleColors[member.role]} 15%, transparent)`,
                color: roleColors[member.role],
              }}
            >
              {member.role === "Owner" && <Crown className="h-2.5 w-2.5" />}
              {member.role === "Admin" && <Shield className="h-2.5 w-2.5" />}
              {member.role}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {member.lastActive}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {member.targets} targets
            </span>
            <button className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-tertiary)] hover:bg-[var(--bg-active)]">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Pending Invitations
          </h2>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.email}
                className="flex items-center justify-between rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)] p-4"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-[var(--text-tertiary)]" />
                  <div>
                    <p className="text-sm text-[var(--text-primary)]">
                      {invite.email}
                    </p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                      Invited {invite.sent} &middot; Role: {invite.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-xs text-[var(--accent)] hover:underline">
                    Resend
                  </button>
                  <button className="text-xs text-[var(--text-tertiary)] hover:text-[var(--signal-critical)]">
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInvite(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 shadow-[var(--shadow-lg)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Invite Team Member
              </h3>
              <button
                onClick={() => setShowInvite(false)}
                className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Email Address
                </label>
                <input
                  placeholder="colleague@company.com"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Role
                </label>
                <select className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
                  <option>Member — Can view and manage own targets</option>
                  <option>Admin — Full access, manage team</option>
                </select>
              </div>
              <button className="w-full rounded-[var(--radius-md)] bg-[var(--accent)] py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors">
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
