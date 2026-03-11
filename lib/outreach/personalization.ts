import type { Contact } from '@/types/contact';
import type { Company } from '@/types/company';
import type { Signal } from '@/types/signal';

export interface PersonalizationContext {
  contact: Contact;
  company: Company;
  signals: Signal[];
  senderContext?: {
    name: string;
    company: string;
    role: string;
  };
}

export interface PersonalizationResult {
  toneAdjustment: ToneProfile;
  iceBreakers: string[];
  careerReferences: string[];
  signalHooks: string[];
  commonGround: string[];
  avoidTopics: string[];
  recommendedApproach: string;
  personalityInsights: string;
}

export interface ToneProfile {
  formality: 'formal' | 'professional' | 'casual';
  technicalDepth: 'high' | 'medium' | 'low';
  urgency: 'high' | 'medium' | 'low';
  emotionalAppeal: 'data_driven' | 'story_driven' | 'balanced';
  length: 'concise' | 'moderate' | 'detailed';
}

function inferToneFromCommStyle(commStyle: Contact['commStyle']): ToneProfile {
  switch (commStyle) {
    case 'formal':
      return {
        formality: 'formal',
        technicalDepth: 'medium',
        urgency: 'low',
        emotionalAppeal: 'data_driven',
        length: 'moderate',
      };
    case 'casual':
      return {
        formality: 'casual',
        technicalDepth: 'low',
        urgency: 'medium',
        emotionalAppeal: 'story_driven',
        length: 'concise',
      };
    case 'technical':
      return {
        formality: 'professional',
        technicalDepth: 'high',
        urgency: 'low',
        emotionalAppeal: 'data_driven',
        length: 'detailed',
      };
    case 'visionary':
      return {
        formality: 'professional',
        technicalDepth: 'medium',
        urgency: 'medium',
        emotionalAppeal: 'story_driven',
        length: 'moderate',
      };
    default:
      return inferToneFromRole(null);
  }
}

function inferToneFromRole(seniority: Contact['seniority']): ToneProfile {
  switch (seniority) {
    case 'c_suite':
      return {
        formality: 'professional',
        technicalDepth: 'low',
        urgency: 'high',
        emotionalAppeal: 'data_driven',
        length: 'concise',
      };
    case 'vp':
      return {
        formality: 'professional',
        technicalDepth: 'medium',
        urgency: 'medium',
        emotionalAppeal: 'balanced',
        length: 'moderate',
      };
    case 'director':
    case 'manager':
      return {
        formality: 'professional',
        technicalDepth: 'medium',
        urgency: 'medium',
        emotionalAppeal: 'balanced',
        length: 'moderate',
      };
    case 'individual':
      return {
        formality: 'casual',
        technicalDepth: 'high',
        urgency: 'low',
        emotionalAppeal: 'data_driven',
        length: 'detailed',
      };
    default:
      return {
        formality: 'professional',
        technicalDepth: 'medium',
        urgency: 'medium',
        emotionalAppeal: 'balanced',
        length: 'moderate',
      };
  }
}

function generateCareerReferences(contact: Contact): string[] {
  const refs: string[] = [];

  if (contact.careerHistory.length === 0) return refs;

  // Reference current role tenure
  const currentRole = contact.careerHistory.find((c) => !c.endDate);
  if (currentRole) {
    const startDate = new Date(currentRole.startDate);
    const months = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months <= 6) {
      refs.push(`Recently joined as ${currentRole.title} (${months} months ago) - likely in evaluation mode`);
    } else if (months >= 24) {
      refs.push(`${Math.floor(months / 12)}+ years as ${currentRole.title} - established leader with deep context`);
    }
  }

  // Reference previous notable roles
  const previousRoles = contact.careerHistory.filter((c) => c.endDate).slice(0, 2);
  for (const role of previousRoles) {
    refs.push(`Previously ${role.title} at ${role.company} - brings perspective from ${role.company}`);
  }

  // Career trajectory
  if (contact.careerHistory.length >= 3) {
    const titles = contact.careerHistory.map((c) => c.title.toLowerCase());
    const isRising = titles.some((t) => t.includes('vp') || t.includes('director') || t.includes('head'));
    if (isRising) {
      refs.push('Rising career trajectory - likely ambitious and receptive to strategic improvements');
    }
  }

  return refs;
}

function generateIceBreakers(contact: Contact, company: Company): string[] {
  const iceBreakers: string[] = [];

  // Recent activity-based
  if (contact.recentActivity.length > 0) {
    const latest = contact.recentActivity[0]!;
    if (latest.type === 'linkedin_post') {
      iceBreakers.push(`Reference their recent LinkedIn post about: "${truncate(latest.content, 60)}"`);
    } else if (latest.type === 'article') {
      iceBreakers.push(`Mention their recent article: "${truncate(latest.content, 60)}"`);
    } else if (latest.type === 'talk' || latest.type === 'podcast') {
      iceBreakers.push(`Reference their ${latest.type}: "${truncate(latest.content, 60)}"`);
    }
  }

  // Education-based (if from a notable school, reference shared alumni network)
  if (contact.bio) {
    iceBreakers.push(`Bio reference: "${truncate(contact.bio, 80)}"`);
  }

  // Company achievement
  if (company.totalFunding && company.totalFunding > 0) {
    iceBreakers.push(`Acknowledge company growth/funding milestones`);
  }

  // Location-based
  if (contact.location) {
    iceBreakers.push(`Location commonality: ${contact.location}`);
  }

  return iceBreakers;
}

function generateSignalHooks(signals: Signal[], contact: Contact): string[] {
  const hooks: string[] = [];

  for (const signal of signals.slice(0, 5)) {
    const roleRelevance = getRoleRelevance(signal.signalType, contact.roleType);

    if (roleRelevance === 'high') {
      hooks.push(`[${signal.signalType.toUpperCase()}] ${signal.title} - Directly relevant to their role as ${contact.roleType ?? 'decision maker'}`);
    } else if (roleRelevance === 'medium') {
      hooks.push(`[${signal.signalType.toUpperCase()}] ${signal.title} - Tangentially relevant, frame around impact`);
    }
  }

  return hooks;
}

function getRoleRelevance(
  signalType: string,
  roleType: Contact['roleType']
): 'high' | 'medium' | 'low' {
  const relevanceMap: Record<string, string[]> = {
    economic_buyer: ['funding', 'financial', 'earnings', 'expansion'],
    technical_evaluator: ['technology', 'hiring', 'product_launch'],
    champion: ['hiring', 'expansion', 'competitive', 'product_launch'],
    blocker: ['competitive', 'financial'],
    influencer: ['leadership', 'partnership', 'social'],
  };

  if (!roleType) return 'medium';
  const highRelevance = relevanceMap[roleType] ?? [];
  if (highRelevance.includes(signalType)) return 'high';
  return 'medium';
}

function findCommonGround(contact: Contact, company: Company): string[] {
  const ground: string[] = [];

  // Industry expertise
  if (company.industry) {
    ground.push(`Shared industry context: ${company.industry}`);
  }

  // Technology overlap
  if (company.techStack.length > 0) {
    const techNames = company.techStack.slice(0, 3).map((t) => t.name).join(', ');
    ground.push(`Technology context: they use ${techNames}`);
  }

  // Department alignment
  if (contact.department) {
    ground.push(`Department focus: ${contact.department}`);
  }

  return ground;
}

function identifyAvoidTopics(contact: Contact, signals: Signal[]): string[] {
  const avoid: string[] = [];

  // If there are layoff/restructuring signals, avoid congratulatory tone
  const hasNegativeSignals = signals.some(
    (s) => s.signalType === 'competitive' && s.severity === 'critical'
  );
  if (hasNegativeSignals) {
    avoid.push('Avoid congratulatory language - company may be facing challenges');
  }

  // If contact recently changed roles, avoid referencing old company negatively
  const firstEntry = contact.careerHistory[0];
  const recentChange = contact.careerHistory.length >= 2 &&
    firstEntry?.endDate &&
    (Date.now() - new Date(firstEntry.endDate).getTime()) < 90 * 24 * 60 * 60 * 1000;
  if (recentChange) {
    avoid.push('Recent role change - avoid referencing previous employer in comparative context');
  }

  // Blocker role type
  if (contact.roleType === 'blocker') {
    avoid.push('Likely skeptical - avoid hyperbolic claims, focus on risk mitigation');
  }

  return avoid;
}

function generateApproachRecommendation(contact: Contact, signals: Signal[]): string {
  const parts: string[] = [];

  // Role-based approach
  switch (contact.roleType) {
    case 'economic_buyer':
      parts.push('Lead with ROI and business outcomes.');
      break;
    case 'technical_evaluator':
      parts.push('Lead with technical capabilities and integration ease.');
      break;
    case 'champion':
      parts.push('Empower them with materials they can share internally.');
      break;
    case 'blocker':
      parts.push('Address risks and objections proactively. Focus on security and compliance.');
      break;
    case 'influencer':
      parts.push('Provide thought leadership content. Build relationship before pitching.');
      break;
    default:
      parts.push('Use a balanced approach mixing business value and technical merit.');
  }

  // Signal-based timing
  const hasUrgentSignal = signals.some((s) => s.severity === 'critical' || s.severity === 'high');
  if (hasUrgentSignal) {
    parts.push('Timing is favorable - reference the urgent signal directly.');
  }

  // Seniority-based
  if (contact.seniority === 'c_suite') {
    parts.push('Keep it brief. Lead with strategic value, not features.');
  }

  return parts.join(' ');
}

function generatePersonalityInsights(contact: Contact): string {
  const insights: string[] = [];

  if (contact.commStyle === 'formal') {
    insights.push('Prefers structured, data-backed communication.');
  } else if (contact.commStyle === 'casual') {
    insights.push('Open to conversational tone. Can use humor sparingly.');
  } else if (contact.commStyle === 'technical') {
    insights.push('Values technical depth. Include specifics and avoid vague claims.');
  } else if (contact.commStyle === 'visionary') {
    insights.push('Thinks big picture. Frame around market trends and future state.');
  }

  if (contact.recentActivity.length > 3) {
    insights.push('Active on social media - may respond to engagement before direct outreach.');
  }

  if (contact.seniority === 'c_suite' && contact.careerHistory.length > 5) {
    insights.push('Seasoned executive - will see through generic pitches immediately.');
  }

  return insights.join(' ') || 'Insufficient data for personality insights.';
}

function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function personalize(ctx: PersonalizationContext): PersonalizationResult {
  const { contact, company, signals } = ctx;

  const toneAdjustment = contact.commStyle
    ? inferToneFromCommStyle(contact.commStyle)
    : inferToneFromRole(contact.seniority);

  return {
    toneAdjustment,
    iceBreakers: generateIceBreakers(contact, company),
    careerReferences: generateCareerReferences(contact),
    signalHooks: generateSignalHooks(signals, contact),
    commonGround: findCommonGround(contact, company),
    avoidTopics: identifyAvoidTopics(contact, signals),
    recommendedApproach: generateApproachRecommendation(contact, signals),
    personalityInsights: generatePersonalityInsights(contact),
  };
}

export function adjustToneForChannel(
  tone: ToneProfile,
  channel: 'email' | 'linkedin' | 'phone_script'
): ToneProfile {
  switch (channel) {
    case 'linkedin':
      return { ...tone, formality: 'casual', length: 'concise' };
    case 'phone_script':
      return { ...tone, formality: 'casual', length: 'concise', urgency: 'high' };
    default:
      return tone;
  }
}
