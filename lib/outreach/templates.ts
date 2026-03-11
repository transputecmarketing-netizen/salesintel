import type { OutreachTemplate } from '@/types/outreach';

export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  // --- Funding Signal Templates ---
  {
    id: 'funding-cold-email',
    name: 'Funding Announcement - Cold',
    channel: 'email',
    subject: 'Congrats on the {{fundingRound}} - quick thought on {{painPoint}}',
    body: `Hi {{firstName}},

Congrats to you and the {{companyName}} team on the {{fundingRound}}. {{fundingAmount}} is a strong signal that {{investorName}} sees real momentum in what you're building.

With fresh capital, teams like yours often prioritize {{painPoint}}. We've helped {{socialProofCompany}} tackle exactly this, resulting in {{socialProofResult}}.

Would a 15-minute call next week make sense to explore if there's a fit?

Best,
{{senderName}}`,
    variant: 'trigger_based',
    signalTypes: ['funding'],
    variables: ['firstName', 'companyName', 'fundingRound', 'fundingAmount', 'investorName', 'painPoint', 'socialProofCompany', 'socialProofResult', 'senderName'],
  },
  {
    id: 'funding-linkedin',
    name: 'Funding Announcement - LinkedIn',
    channel: 'linkedin',
    subject: '',
    body: `Congrats on the {{fundingRound}}, {{firstName}}! With {{companyName}} scaling, I'd love to share how we helped {{socialProofCompany}} with {{painPoint}}. Worth a quick chat?`,
    variant: 'trigger_based',
    signalTypes: ['funding'],
    variables: ['firstName', 'companyName', 'fundingRound', 'socialProofCompany', 'painPoint'],
  },

  // --- Hiring Signal Templates ---
  {
    id: 'hiring-cold-email',
    name: 'Hiring Surge - Cold',
    channel: 'email',
    subject: '{{companyName}} is hiring {{roleCount}} {{department}} roles - we can help',
    body: `Hi {{firstName}},

I noticed {{companyName}} is actively hiring {{roleCount}} {{department}} roles. That level of investment usually means {{painPoint}} is top of mind.

We work with teams going through similar growth at {{socialProofCompany}} and {{socialProofCompany2}}, helping them {{valueProposition}}.

Would you be open to a quick call to see if there's alignment?

{{senderName}}`,
    variant: 'trigger_based',
    signalTypes: ['hiring'],
    variables: ['firstName', 'companyName', 'roleCount', 'department', 'painPoint', 'socialProofCompany', 'socialProofCompany2', 'valueProposition', 'senderName'],
  },

  // --- Leadership Change Templates ---
  {
    id: 'leadership-warm-email',
    name: 'New Executive - Warm',
    channel: 'email',
    subject: 'Welcome to {{companyName}}, {{firstName}}',
    body: `Hi {{firstName}},

Congratulations on your new role as {{title}} at {{companyName}}. Transitions like this are often the perfect time to evaluate {{painPoint}}.

At {{previousCompany}}, you likely dealt with {{previousChallenge}}. At {{companyName}}, with {{companyContext}}, the dynamics are probably different.

I'd love to share a quick perspective on how teams in your position approach {{painPoint}} in the first 90 days. No pitch, just insights.

Worth 15 minutes?

{{senderName}}`,
    variant: 'warm',
    signalTypes: ['leadership'],
    variables: ['firstName', 'companyName', 'title', 'painPoint', 'previousCompany', 'previousChallenge', 'companyContext', 'senderName'],
  },

  // --- Technology Signal Templates ---
  {
    id: 'tech-change-cold-email',
    name: 'Tech Stack Change - Cold',
    channel: 'email',
    subject: 'Noticed {{companyName}} adopted {{technology}} - thought you should know',
    body: `Hi {{firstName}},

I noticed {{companyName}} recently adopted {{technology}}. Teams making that move typically need {{painPoint}} sorted out within the first few months.

We helped {{socialProofCompany}} navigate a similar transition and {{socialProofResult}}.

Happy to share what worked for them if you're interested.

{{senderName}}`,
    variant: 'trigger_based',
    signalTypes: ['technology'],
    variables: ['firstName', 'companyName', 'technology', 'painPoint', 'socialProofCompany', 'socialProofResult', 'senderName'],
  },

  // --- Expansion Signal Templates ---
  {
    id: 'expansion-cold-email',
    name: 'Market Expansion - Cold',
    channel: 'email',
    subject: '{{companyName}} expanding to {{market}} - a few considerations',
    body: `Hi {{firstName}},

I saw that {{companyName}} is expanding into {{market}}. That's an exciting move, and it typically brings {{painPoint}} challenges that aren't obvious until you're in the thick of it.

We've helped companies like {{socialProofCompany}} navigate {{market}} expansion, specifically around {{valueProposition}}.

Would a brief call be useful to share what we've learned?

{{senderName}}`,
    variant: 'trigger_based',
    signalTypes: ['expansion'],
    variables: ['firstName', 'companyName', 'market', 'painPoint', 'socialProofCompany', 'valueProposition', 'senderName'],
  },

  // --- Competitive Signal Templates ---
  {
    id: 'competitive-cold-email',
    name: 'Competitor Move - Cold',
    channel: 'email',
    subject: '{{competitorName}} just {{competitorAction}} - impact on {{companyName}}?',
    body: `Hi {{firstName}},

{{competitorName}} just announced {{competitorAction}}. Given {{companyName}}'s position in {{industry}}, this likely has implications for {{painPoint}}.

We've been tracking this space closely and have insights on how leading teams are responding. {{socialProofCompany}} recently {{socialProofAction}} in response to similar market moves.

Worth a quick discussion?

{{senderName}}`,
    variant: 'trigger_based',
    signalTypes: ['competitive'],
    variables: ['firstName', 'companyName', 'competitorName', 'competitorAction', 'industry', 'painPoint', 'socialProofCompany', 'socialProofAction', 'senderName'],
  },

  // --- Earnings/Financial Templates ---
  {
    id: 'earnings-cold-email',
    name: 'Earnings Report - Cold',
    channel: 'email',
    subject: '{{companyName}} Q{{quarter}} results and {{painPoint}}',
    body: `Hi {{firstName}},

{{companyName}}'s Q{{quarter}} results highlighted {{earningsHighlight}}. {{ceoName}} mentioned {{strategicPriority}} as a key initiative going forward.

We help companies in {{industry}} with exactly this - specifically {{valueProposition}}. {{socialProofCompany}} saw {{socialProofResult}} after working with us.

Would it make sense to connect?

{{senderName}}`,
    variant: 'trigger_based',
    signalTypes: ['earnings', 'financial'],
    variables: ['firstName', 'companyName', 'quarter', 'earningsHighlight', 'ceoName', 'strategicPriority', 'industry', 'valueProposition', 'socialProofCompany', 'socialProofResult', 'senderName'],
  },

  // --- Generic Cold Template ---
  {
    id: 'generic-cold-email',
    name: 'Generic Cold Outreach',
    channel: 'email',
    subject: '{{painPoint}} at {{companyName}}',
    body: `Hi {{firstName}},

I work with {{seniority}}-level leaders at {{industry}} companies who are dealing with {{painPoint}}.

{{companyName}} caught my attention because {{relevanceReason}}. We've helped teams like {{socialProofCompany}} achieve {{socialProofResult}}.

Would you be open to a brief conversation to see if there's a fit?

{{senderName}}`,
    variant: 'cold',
    signalTypes: [],
    variables: ['firstName', 'companyName', 'seniority', 'industry', 'painPoint', 'relevanceReason', 'socialProofCompany', 'socialProofResult', 'senderName'],
  },

  // --- Follow-Up Templates ---
  {
    id: 'follow-up-1',
    name: 'Follow Up #1 - Value Add',
    channel: 'email',
    subject: 'Re: {{previousSubject}}',
    body: `Hi {{firstName}},

Following up on my note about {{painPoint}}. I wanted to share {{resourceType}} that might be useful regardless of whether we connect:

{{resourceLink}}

It covers {{resourceTopic}}, which is directly relevant given {{companyName}}'s {{relevanceReason}}.

Happy to discuss if any of it resonates.

{{senderName}}`,
    variant: 'follow_up',
    signalTypes: [],
    variables: ['firstName', 'previousSubject', 'painPoint', 'resourceType', 'resourceLink', 'resourceTopic', 'companyName', 'relevanceReason', 'senderName'],
  },

  // --- Phone Script Template ---
  {
    id: 'phone-script-trigger',
    name: 'Phone Script - Signal Triggered',
    channel: 'phone_script',
    subject: '',
    body: `OPENING: "Hi {{firstName}}, this is {{senderName}} from [Company]. I'll be brief - I noticed {{signalSummary}} and wanted to share a quick thought."

IF INTERESTED: "Teams going through {{signalContext}} typically face {{painPoint}}. We helped {{socialProofCompany}} with exactly this. Would 15 minutes next week work to dive deeper?"

IF OBJECTION (timing): "Totally understand. When would be a better time to revisit? In the meantime, I can send over {{resourceType}} that might be useful."

IF OBJECTION (not relevant): "Fair enough. Just curious - what is your current approach to {{painPoint}}? [Listen and note for future reference]"

CLOSE: "Thanks for your time, {{firstName}}. I'll {{nextAction}}."`,
    variant: 'trigger_based',
    signalTypes: ['funding', 'hiring', 'expansion', 'leadership', 'technology'],
    variables: ['firstName', 'senderName', 'signalSummary', 'signalContext', 'painPoint', 'socialProofCompany', 'resourceType', 'nextAction'],
  },
];

export function getTemplatesForSignalType(signalType: string): OutreachTemplate[] {
  return OUTREACH_TEMPLATES.filter(
    (t) => t.signalTypes.length === 0 || t.signalTypes.includes(signalType)
  );
}

export function getTemplatesByChannel(channel: OutreachTemplate['channel']): OutreachTemplate[] {
  return OUTREACH_TEMPLATES.filter((t) => t.channel === channel);
}

export function getTemplatesByVariant(variant: OutreachTemplate['variant']): OutreachTemplate[] {
  return OUTREACH_TEMPLATES.filter((t) => t.variant === variant);
}

export function getTemplateById(id: string): OutreachTemplate | undefined {
  return OUTREACH_TEMPLATES.find((t) => t.id === id);
}

export function fillTemplate(
  template: OutreachTemplate,
  values: Record<string, string>
): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  for (const [key, value] of Object.entries(values)) {
    const placeholder = `{{${key}}}`;
    subject = subject.replaceAll(placeholder, value);
    body = body.replaceAll(placeholder, value);
  }

  return { subject, body };
}

export function getMissingVariables(
  template: OutreachTemplate,
  values: Record<string, string>
): string[] {
  return template.variables.filter((v) => !values[v]);
}
