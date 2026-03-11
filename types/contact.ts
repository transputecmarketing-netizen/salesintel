export interface Contact {
  id: string;
  companyId: string;
  email: string | null;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  seniority: 'c_suite' | 'vp' | 'director' | 'manager' | 'individual' | null;
  department: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
  avatarUrl: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  careerHistory: CareerEntry[];
  roleType: 'economic_buyer' | 'technical_evaluator' | 'champion' | 'blocker' | 'influencer' | null;
  commStyle: 'formal' | 'casual' | 'technical' | 'visionary' | null;
  recentActivity: ActivityItem[];
  enrichedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerEntry {
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
}

export interface ActivityItem {
  type: 'linkedin_post' | 'article' | 'talk' | 'podcast' | 'tweet';
  content: string;
  date: string;
  url: string | null;
  engagement?: { likes: number; comments: number; shares: number };
}
