'use client';

import { useState, useCallback } from 'react';

import type { Contact } from '@/types/contact';

interface ContactEnrichment {
  fullName: string;
  email: string | null;
  linkedinUrl: string | null;
  title: string | null;
  seniority: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  avatarUrl: string | null;
  careerHistory: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string | null;
  }>;
  skills: string[];
}

interface UseContactReturn {
  contact: Contact | null;
  enrichment: ContactEnrichment | null;
  loading: boolean;
  error: string | null;
  enrichByLinkedin: (linkedinUrl: string) => Promise<ContactEnrichment | null>;
  enrichByEmail: (email: string) => Promise<ContactEnrichment | null>;
  generateIcebreaker: (postContent: string, contactId?: string) => Promise<{
    icebreakers: Array<{ text: string; tone: string; relevance: string }>;
  }>;
  generateOutreach: (params: {
    companyId: string;
    contactId?: string;
    signalId?: string;
    variant: 'cold' | 'warm' | 'trigger_based';
    channel?: 'email' | 'linkedin' | 'phone_script';
  }) => Promise<unknown>;
  setContact: (contact: Contact | null) => void;
}

export function useContact(): UseContactReturn {
  const [contact, setContact] = useState<Contact | null>(null);
  const [enrichment, setEnrichment] = useState<ContactEnrichment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrichByLinkedin = useCallback(async (linkedinUrl: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/enrichment/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedinUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setEnrichment(data.enriched);
      return data.enriched as ContactEnrichment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Enrichment failed';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const enrichByEmail = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/enrichment/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setEnrichment(data.enriched);
      return data.enriched as ContactEnrichment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Enrichment failed';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateIcebreaker = useCallback(
    async (postContent: string, contactId?: string) => {
      const res = await fetch('/api/outreach/icebreaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postContent, contactId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      return res.json();
    },
    []
  );

  const generateOutreach = useCallback(
    async (params: {
      companyId: string;
      contactId?: string;
      signalId?: string;
      variant: 'cold' | 'warm' | 'trigger_based';
      channel?: 'email' | 'linkedin' | 'phone_script';
    }) => {
      const res = await fetch('/api/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      return res.json();
    },
    []
  );

  return {
    contact,
    enrichment,
    loading,
    error,
    enrichByLinkedin,
    enrichByEmail,
    generateIcebreaker,
    generateOutreach,
    setContact,
  };
}
