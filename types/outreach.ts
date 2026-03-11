export interface OutreachTemplate {
  id: string;
  name: string;
  channel: 'email' | 'linkedin' | 'phone_script';
  subject: string;
  body: string;
  variant: 'cold' | 'warm' | 'referral' | 'trigger_based' | 'follow_up';
  signalTypes: string[];
  variables: string[];
}

export interface OutreachDraftRecord {
  id: string;
  userId: string;
  companyId: string | null;
  contactId: string | null;
  signalId: string | null;
  channel: string;
  subject: string | null;
  body: string;
  variant: string | null;
  status: 'draft' | 'sent' | 'replied' | 'no_response' | 'meeting_booked';
  sentAt: string | null;
  repliedAt: string | null;
  createdAt: string;
}
