import { cn } from "@/lib/utils";
import { Linkedin, Twitter, Mail, Phone, MapPin, Building2 } from "lucide-react";
import type { Contact } from "@/types/contact";

interface ContactHeaderProps {
  contact: Contact;
  companyName?: string;
  className?: string;
}

export default function ContactHeader({ contact, companyName, className }: ContactHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start gap-4 p-6 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)]",
        className
      )}
    >
      {/* Avatar */}
      {contact.avatarUrl ? (
        <img
          src={contact.avatarUrl}
          alt={contact.fullName}
          className="w-16 h-16 rounded-full object-cover border-2 border-[var(--border-primary)]"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xl font-bold text-[var(--text-tertiary)] border-2 border-[var(--border-primary)]">
          {contact.fullName
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-0.5">{contact.fullName}</h1>
        {contact.title && (
          <p className="text-sm text-[var(--text-secondary)] mb-2">{contact.title}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
          {companyName && (
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              <Building2 className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              {companyName}
            </span>
          )}
          {contact.location && (
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              <MapPin className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              {contact.location}
            </span>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-primary)] hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              {contact.email}
            </a>
          )}
          {contact.phone && (
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              <Phone className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              {contact.phone}
            </span>
          )}
        </div>

        {/* Social links */}
        <div className="flex items-center gap-2">
          {contact.linkedinUrl && (
            <a
              href={contact.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-blue-500/10 transition-colors"
            >
              <Linkedin className="w-4 h-4 text-[var(--text-tertiary)] hover:text-blue-500" />
            </a>
          )}
          {contact.twitterHandle && (
            <a
              href={`https://twitter.com/${contact.twitterHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-sky-500/10 transition-colors"
            >
              <Twitter className="w-4 h-4 text-[var(--text-tertiary)] hover:text-sky-500" />
            </a>
          )}
        </div>
      </div>

      {/* Role badge */}
      {contact.roleType && (
        <span className="shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)]">
          {contact.roleType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      )}
    </div>
  );
}
