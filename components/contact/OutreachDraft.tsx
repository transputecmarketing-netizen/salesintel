"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Edit3, Send, Copy, Check, RotateCcw } from "lucide-react";

interface OutreachDraftProps {
  subject?: string;
  body?: string;
  contactName?: string;
  signalReference?: string;
  onSend?: (subject: string, body: string) => void;
  className?: string;
}

const mockSubject = "Re: Your Kubernetes Migration -- Thought This Might Help";
const mockBody = `Hi Marcus,

I came across your recent blog post about migrating 200+ microservices to Kubernetes -- impressive work, especially managing that at scale.

Given the complexity of your migration, I thought you might find value in how we've helped companies like Figma and Notion solve the observability challenges that typically emerge during containerization transitions. Specifically:

- Real-time service mesh visibility across all 200+ services
- Automated anomaly detection tuned for K8s environments
- Cost optimization insights as your cluster footprint grows

Would it make sense to set up a 15-minute call to explore whether we could accelerate your migration timeline?

Best regards`;

export default function OutreachDraft({
  subject,
  body,
  contactName = "Marcus",
  signalReference,
  onSend,
  className,
}: OutreachDraftProps) {
  const [editMode, setEditMode] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(subject || mockSubject);
  const [currentBody, setCurrentBody] = useState(body || mockBody);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${currentSubject}\n\n${currentBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCurrentSubject(subject || mockSubject);
    setCurrentBody(body || mockBody);
    setEditMode(false);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">AI Outreach Draft</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditMode(!editMode)}
            className={cn(
              "p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors",
              editMode && "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            )}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Signal reference */}
      {signalReference && (
        <div className="px-4 py-2 bg-[var(--accent-primary)]/5 border-b border-[var(--border-primary)]">
          <span className="text-[11px] text-[var(--accent-primary)]">
            Based on: {signalReference}
          </span>
        </div>
      )}

      {/* Subject */}
      <div className="px-4 py-2 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-tertiary)] shrink-0">Subject:</span>
          {editMode ? (
            <input
              value={currentSubject}
              onChange={(e) => setCurrentSubject(e.target.value)}
              className="flex-1 text-sm text-[var(--text-primary)] bg-transparent outline-none"
            />
          ) : (
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {currentSubject}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        {editMode ? (
          <textarea
            value={currentBody}
            onChange={(e) => setCurrentBody(e.target.value)}
            rows={12}
            className="w-full text-sm text-[var(--text-secondary)] bg-transparent outline-none resize-none leading-relaxed"
          />
        ) : (
          <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
            {currentBody}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
        <button
          onClick={() => onSend?.(currentSubject, currentBody)}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </div>
    </div>
  );
}
