import type { Signal, SignalSeverity } from '@/types/signal';

export interface DigestConfig {
  userId: string;
  email: string;
  timezone: string;
  includeSignalTypes: string[];
  minSeverity: SignalSeverity;
  maxSignalsPerCompany: number;
  maxTotalSignals: number;
}

export interface DigestContent {
  userId: string;
  generatedAt: string;
  period: { start: string; end: string };
  headline: string;
  summary: string;
  sections: DigestSection[];
  stats: DigestStats;
  actionItems: DigestActionItem[];
}

export interface DigestSection {
  title: string;
  companyName: string;
  companySlug: string;
  signals: DigestSignalSummary[];
  priority: 'urgent' | 'important' | 'informational';
}

export interface DigestSignalSummary {
  id: string;
  title: string;
  type: string;
  severity: SignalSeverity;
  whyItMatters: string;
  recommendedAction: string;
  detectedAt: string;
}

export interface DigestStats {
  totalNewSignals: number;
  criticalCount: number;
  highCount: number;
  companiesAffected: number;
  topSignalType: string;
  convergenceAlerts: number;
}

export interface DigestActionItem {
  priority: 'urgent' | 'high' | 'medium';
  action: string;
  companyName: string;
  reason: string;
  signalIds: string[];
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

/**
 * Generate a morning digest from signals detected in the last period.
 */
export function generateDigest(
  signals: Signal[],
  config: DigestConfig
): DigestContent {
  const now = new Date();
  const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Filter signals by config
  const filtered = filterSignals(signals, config);

  // Group by company
  const byCompany = groupByCompany(filtered);

  // Build sections
  const sections: DigestSection[] = [];
  for (const [companyKey, companySignals] of byCompany.entries()) {
    const company = companySignals[0]?.company;
    const limited = companySignals.slice(0, config.maxSignalsPerCompany);
    const maxSeverity = getMaxSeverity(limited);

    sections.push({
      title: company?.name ?? companyKey,
      companyName: company?.name ?? companyKey,
      companySlug: company?.slug ?? companyKey,
      signals: limited.map((s) => ({
        id: s.id,
        title: s.title,
        type: s.signalType,
        severity: s.severity,
        whyItMatters: s.whyItMatters ?? '',
        recommendedAction: s.recommendedAction ?? 'monitor',
        detectedAt: s.detectedAt,
      })),
      priority: maxSeverity === 'critical' ? 'urgent' : maxSeverity === 'high' ? 'important' : 'informational',
    });
  }

  // Sort sections: urgent first, then important, then informational
  const priorityOrder: Record<string, number> = { urgent: 0, important: 1, informational: 2 };
  sections.sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));

  // Limit total signals across all sections
  let totalIncluded = 0;
  const limitedSections: DigestSection[] = [];
  for (const section of sections) {
    if (totalIncluded >= config.maxTotalSignals) break;
    const remaining = config.maxTotalSignals - totalIncluded;
    const limitedSignals = section.signals.slice(0, remaining);
    limitedSections.push({ ...section, signals: limitedSignals });
    totalIncluded += limitedSignals.length;
  }

  // Compute stats
  const stats = computeStats(filtered);

  // Generate action items
  const actionItems = generateActionItems(filtered);

  // Generate headline and summary
  const headline = generateHeadline(stats, limitedSections);
  const summary = generateSummary(stats, limitedSections);

  return {
    userId: config.userId,
    generatedAt: now.toISOString(),
    period: {
      start: periodStart.toISOString(),
      end: now.toISOString(),
    },
    headline,
    summary,
    sections: limitedSections,
    stats,
    actionItems,
  };
}

function filterSignals(signals: Signal[], config: DigestConfig): Signal[] {
  const minOrder = SEVERITY_ORDER[config.minSeverity] ?? 0;

  return signals.filter((s) => {
    if ((SEVERITY_ORDER[s.severity] ?? 0) < minOrder) return false;
    if (config.includeSignalTypes.length > 0 && !config.includeSignalTypes.includes(s.signalType)) return false;
    return true;
  });
}

function groupByCompany(signals: Signal[]): Map<string, Signal[]> {
  const groups = new Map<string, Signal[]>();

  for (const signal of signals) {
    const key = signal.companyId;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(signal);
  }

  // Sort each group by severity (critical first)
  for (const [, group] of groups) {
    group.sort((a, b) => (SEVERITY_ORDER[b.severity] ?? 0) - (SEVERITY_ORDER[a.severity] ?? 0));
  }

  return groups;
}

function getMaxSeverity(signals: Signal[]): SignalSeverity {
  let max: SignalSeverity = 'info';
  for (const s of signals) {
    if ((SEVERITY_ORDER[s.severity] ?? 0) > (SEVERITY_ORDER[max] ?? 0)) {
      max = s.severity;
    }
  }
  return max;
}

function computeStats(signals: Signal[]): DigestStats {
  const typeCounts: Record<string, number> = {};
  const companies = new Set<string>();
  let criticalCount = 0;
  let highCount = 0;
  let convergenceAlerts = 0;

  for (const signal of signals) {
    typeCounts[signal.signalType] = (typeCounts[signal.signalType] || 0) + 1;
    companies.add(signal.companyId);

    if (signal.severity === 'critical') criticalCount++;
    if (signal.severity === 'high') highCount++;
  }

  // Detect convergence (multiple signal types for same company)
  const companySignalTypes = new Map<string, Set<string>>();
  for (const signal of signals) {
    if (!companySignalTypes.has(signal.companyId)) {
      companySignalTypes.set(signal.companyId, new Set());
    }
    companySignalTypes.get(signal.companyId)!.add(signal.signalType);
  }
  for (const [, types] of companySignalTypes) {
    if (types.size >= 3) convergenceAlerts++;
  }

  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    totalNewSignals: signals.length,
    criticalCount,
    highCount,
    companiesAffected: companies.size,
    topSignalType: topType?.[0] ?? 'none',
    convergenceAlerts,
  };
}

function generateActionItems(signals: Signal[]): DigestActionItem[] {
  const items: DigestActionItem[] = [];

  // Urgent: critical severity signals
  const criticalSignals = signals.filter((s) => s.severity === 'critical');
  for (const signal of criticalSignals) {
    items.push({
      priority: 'urgent',
      action: signal.recommendedAction === 'urgent_outreach'
        ? `Reach out to ${signal.company?.name ?? 'company'} immediately`
        : `Review critical signal for ${signal.company?.name ?? 'company'}`,
      companyName: signal.company?.name ?? '',
      reason: signal.whyItMatters ?? signal.title,
      signalIds: [signal.id],
    });
  }

  // High: engagement-recommended signals
  const engageSignals = signals.filter((s) => s.recommendedAction === 'engage' && s.severity !== 'critical');
  for (const signal of engageSignals) {
    items.push({
      priority: 'high',
      action: `Engage with ${signal.company?.name ?? 'company'} - ${signal.title}`,
      companyName: signal.company?.name ?? '',
      reason: signal.whyItMatters ?? '',
      signalIds: [signal.id],
    });
  }

  // Medium: research-recommended signals
  const researchSignals = signals.filter((s) => s.recommendedAction === 'research').slice(0, 5);
  for (const signal of researchSignals) {
    items.push({
      priority: 'medium',
      action: `Research ${signal.company?.name ?? 'company'} - ${signal.signalType} signal`,
      companyName: signal.company?.name ?? '',
      reason: signal.whyItMatters ?? '',
      signalIds: [signal.id],
    });
  }

  return items;
}

function generateHeadline(stats: DigestStats, sections: DigestSection[]): string {
  if (stats.criticalCount > 0) {
    return `${stats.criticalCount} critical signal${stats.criticalCount > 1 ? 's' : ''} detected across ${stats.companiesAffected} companies`;
  }

  if (stats.convergenceAlerts > 0) {
    return `Signal convergence detected for ${stats.convergenceAlerts} ${stats.convergenceAlerts > 1 ? 'companies' : 'company'}`;
  }

  if (stats.totalNewSignals > 0) {
    return `${stats.totalNewSignals} new signal${stats.totalNewSignals > 1 ? 's' : ''} across ${stats.companiesAffected} ${stats.companiesAffected > 1 ? 'companies' : 'company'}`;
  }

  return 'No new signals detected in the last 24 hours';
}

function generateSummary(stats: DigestStats, sections: DigestSection[]): string {
  const parts: string[] = [];

  if (stats.totalNewSignals === 0) {
    return 'Your watchlist companies had no notable activity in the last 24 hours.';
  }

  parts.push(`We detected ${stats.totalNewSignals} new signals across ${stats.companiesAffected} companies.`);

  if (stats.criticalCount > 0) {
    parts.push(`${stats.criticalCount} require immediate attention.`);
  }

  if (stats.convergenceAlerts > 0) {
    parts.push(`${stats.convergenceAlerts} ${stats.convergenceAlerts > 1 ? 'companies show' : 'company shows'} signal convergence, indicating strong buying potential.`);
  }

  const urgentSections = sections.filter((s) => s.priority === 'urgent');
  if (urgentSections.length > 0) {
    parts.push(`Top priority: ${urgentSections.map((s) => s.companyName).join(', ')}.`);
  }

  return parts.join(' ');
}

/**
 * Render digest to HTML for email delivery.
 */
export function renderDigestHtml(digest: DigestContent): string {
  const actionItemsHtml = digest.actionItems
    .map((item) => {
      const color = item.priority === 'urgent' ? '#ef4444' : item.priority === 'high' ? '#f59e0b' : '#6b7280';
      return `<li style="margin-bottom: 8px;"><span style="color: ${color}; font-weight: 600;">[${item.priority.toUpperCase()}]</span> ${item.action} - ${item.reason}</li>`;
    })
    .join('');

  const sectionsHtml = digest.sections
    .map((section) => {
      const signalsHtml = section.signals
        .map((s) => `<li><strong>[${s.type}]</strong> ${s.title} <em>(${s.severity})</em></li>`)
        .join('');

      const borderColor = section.priority === 'urgent' ? '#ef4444' : section.priority === 'important' ? '#f59e0b' : '#e5e7eb';

      return `
        <div style="border-left: 4px solid ${borderColor}; padding-left: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 8px 0;">${section.companyName}</h3>
          <ul style="margin: 0; padding-left: 16px;">${signalsHtml}</ul>
        </div>`;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
      <h1 style="font-size: 20px; margin-bottom: 4px;">SalesIntel Morning Briefing</h1>
      <p style="color: #6b7280; margin-top: 0;">${new Date(digest.generatedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h2 style="font-size: 16px; margin: 0 0 8px 0;">${digest.headline}</h2>
        <p style="margin: 0; color: #4b5563;">${digest.summary}</p>
      </div>

      ${digest.actionItems.length > 0 ? `
        <h2 style="font-size: 16px; margin-bottom: 8px;">Action Items</h2>
        <ul style="padding-left: 16px;">${actionItemsHtml}</ul>
      ` : ''}

      <h2 style="font-size: 16px; margin-bottom: 12px;">Signal Details</h2>
      ${sectionsHtml}

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
        <p>${digest.stats.totalNewSignals} signals | ${digest.stats.companiesAffected} companies | ${digest.stats.convergenceAlerts} convergence alerts</p>
      </div>
    </body>
    </html>`;
}
