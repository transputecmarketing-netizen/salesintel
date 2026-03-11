"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Send,
  Sparkles,
  Bold,
  Italic,
  Link,
  List,
  Undo,
  Redo,
  Paperclip,
} from "lucide-react";

interface OutreachComposerProps {
  initialSubject?: string;
  initialBody?: string;
  recipientName?: string;
  recipientEmail?: string;
  onSend?: (subject: string, body: string) => void;
  className?: string;
}

export default function OutreachComposer({
  initialSubject = "",
  initialBody = "",
  recipientName = "Marcus Johnson",
  recipientEmail = "marcus@datadog.com",
  onSend,
  className,
}: OutreachComposerProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] overflow-hidden",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <button className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors">
          <Bold className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </button>
        <button className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors">
          <Italic className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </button>
        <button className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors">
          <Link className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </button>
        <button className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors">
          <List className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </button>
        <div className="w-px h-4 bg-[var(--border-primary)] mx-1" />
        <button className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors">
          <Undo className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </button>
        <button className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors">
          <Redo className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </button>
        <div className="flex-1" />
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/15 transition-colors">
          <Sparkles className="w-3 h-3" />
          AI Enhance
        </button>
      </div>

      {/* To field */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-primary)]">
        <span className="text-xs text-[var(--text-tertiary)] shrink-0">To:</span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
            {recipientName}
            <span className="text-[var(--text-tertiary)]">&lt;{recipientEmail}&gt;</span>
          </span>
        </div>
      </div>

      {/* Subject */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-primary)]">
        <span className="text-xs text-[var(--text-tertiary)] shrink-0">Subject:</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject..."
          className="flex-1 text-sm text-[var(--text-primary)] bg-transparent outline-none placeholder:text-[var(--text-tertiary)]"
        />
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={14}
          placeholder="Write your message..."
          className="w-full text-sm text-[var(--text-secondary)] bg-transparent outline-none resize-none leading-relaxed placeholder:text-[var(--text-tertiary)]"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <button className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
          <Paperclip className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {body.length > 0 ? `${body.split(/\s+/).filter(Boolean).length} words` : ""}
          </span>
          <button
            onClick={() => onSend?.(subject, body)}
            disabled={!subject || !body}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
