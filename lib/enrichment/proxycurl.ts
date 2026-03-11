export interface ProxycurlProfileResult {
  fullName: string;
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  occupation: string;
  profilePicUrl: string | null;
  backgroundCoverUrl: string | null;
  publicIdentifier: string;
  country: string | null;
  city: string | null;
  state: string | null;
  connections: number | null;
  followerCount: number | null;
  experiences: ProxycurlExperience[];
  education: ProxycurlEducation[];
  certifications: ProxycurlCertification[];
  skills: string[];
  languages: string[];
  recentActivity: ProxycurlActivity[];
}

export interface ProxycurlExperience {
  company: string;
  companyLinkedinUrl: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
}

export interface ProxycurlEducation {
  school: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface ProxycurlCertification {
  name: string;
  authority: string | null;
  displaySource: string | null;
}

export interface ProxycurlActivity {
  title: string;
  link: string | null;
  activityStatus: string | null;
}

const PROXYCURL_BASE_URL = 'https://nubela.co/proxycurl/api';

function getApiKey(): string {
  const key = process.env.PROXYCURL_API_KEY;
  if (!key) throw new Error('PROXYCURL_API_KEY is not configured');
  return key;
}

async function proxycurlFetch<T>(path: string, params: Record<string, string>): Promise<T | null> {
  try {
    const url = new URL(`${PROXYCURL_BASE_URL}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 404) return null;

    if (!res.ok) {
      console.error(`[Proxycurl] ${path} returned ${res.status}: ${res.statusText}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error(`[Proxycurl] Request to ${path} failed:`, err);
    return null;
  }
}

interface ProxycurlPersonResponse {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  headline?: string;
  summary?: string;
  occupation?: string;
  profile_pic_url?: string;
  background_cover_image_url?: string;
  public_identifier?: string;
  country_full_name?: string;
  city?: string;
  state?: string;
  connections?: number;
  follower_count?: number;
  experiences?: Array<{
    company?: string;
    company_linkedin_profile_url?: string;
    title?: string;
    description?: string;
    location?: string;
    starts_at?: { day?: number; month?: number; year?: number } | null;
    ends_at?: { day?: number; month?: number; year?: number } | null;
  }>;
  education?: Array<{
    school?: string;
    degree_name?: string;
    field_of_study?: string;
    starts_at?: { day?: number; month?: number; year?: number } | null;
    ends_at?: { day?: number; month?: number; year?: number } | null;
  }>;
  certifications?: Array<{
    name?: string;
    authority?: string;
    display_source?: string;
  }>;
  skills?: string[];
  languages?: string[];
  activities?: Array<{
    title?: string;
    link?: string;
    activity_status?: string;
  }>;
}

function formatProxycurlDate(d: { day?: number; month?: number; year?: number } | null | undefined): string | null {
  if (!d || !d.year) return null;
  const year = d.year;
  const month = d.month ? String(d.month).padStart(2, '0') : '01';
  const day = d.day ? String(d.day).padStart(2, '0') : '01';
  return `${year}-${month}-${day}`;
}

export async function enrichLinkedInProfile(linkedinUrl: string): Promise<ProxycurlProfileResult | null> {
  const data = await proxycurlFetch<ProxycurlPersonResponse>('/v2/linkedin', {
    url: linkedinUrl,
    fallback_to_cache: 'on-error',
    use_cache: 'if-present',
    skills: 'include',
    inferred_salary: 'false',
    personal_email: 'false',
    personal_contact_number: 'false',
    twitter_profile_id: 'false',
    facebook_profile_id: 'false',
    github_profile_id: 'false',
    extra: 'include',
  });

  if (!data) return null;

  const experiences: ProxycurlExperience[] = (data.experiences ?? []).map((exp) => ({
    company: exp.company ?? '',
    companyLinkedinUrl: exp.company_linkedin_profile_url ?? null,
    title: exp.title ?? '',
    description: exp.description ?? null,
    location: exp.location ?? null,
    startDate: formatProxycurlDate(exp.starts_at),
    endDate: formatProxycurlDate(exp.ends_at),
    isCurrent: !exp.ends_at,
  }));

  const education: ProxycurlEducation[] = (data.education ?? []).map((edu) => ({
    school: edu.school ?? '',
    degree: edu.degree_name ?? null,
    fieldOfStudy: edu.field_of_study ?? null,
    startDate: formatProxycurlDate(edu.starts_at),
    endDate: formatProxycurlDate(edu.ends_at),
  }));

  const certifications: ProxycurlCertification[] = (data.certifications ?? []).map((cert) => ({
    name: cert.name ?? '',
    authority: cert.authority ?? null,
    displaySource: cert.display_source ?? null,
  }));

  const recentActivity: ProxycurlActivity[] = (data.activities ?? []).map((act) => ({
    title: act.title ?? '',
    link: act.link ?? null,
    activityStatus: act.activity_status ?? null,
  }));

  return {
    fullName: data.full_name ?? `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim(),
    firstName: data.first_name ?? '',
    lastName: data.last_name ?? '',
    headline: data.headline ?? '',
    summary: data.summary ?? '',
    occupation: data.occupation ?? '',
    profilePicUrl: data.profile_pic_url ?? null,
    backgroundCoverUrl: data.background_cover_image_url ?? null,
    publicIdentifier: data.public_identifier ?? '',
    country: data.country_full_name ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    connections: data.connections ?? null,
    followerCount: data.follower_count ?? null,
    experiences,
    education,
    certifications,
    skills: data.skills ?? [],
    languages: data.languages ?? [],
    recentActivity,
  };
}

export interface ProxycurlCompanyResult {
  name: string;
  description: string;
  website: string | null;
  industry: string | null;
  companySize: number | null;
  companySizeRange: string | null;
  headquarter: { city: string | null; state: string | null; country: string | null };
  foundedYear: number | null;
  specialities: string[];
  followerCount: number | null;
}

interface ProxycurlCompanyResponse {
  name?: string;
  description?: string;
  website?: string;
  industry?: string;
  company_size?: number;
  company_size_on_linkedin?: number;
  hq?: { city?: string; state?: string; country?: string };
  founded_year?: number;
  specialities?: string[];
  follower_count?: number;
}

export async function enrichLinkedInCompany(linkedinUrl: string): Promise<ProxycurlCompanyResult | null> {
  const data = await proxycurlFetch<ProxycurlCompanyResponse>('/linkedin/company', {
    url: linkedinUrl,
    use_cache: 'if-present',
  });

  if (!data) return null;

  const size = data.company_size_on_linkedin ?? data.company_size ?? null;
  let sizeRange: string | null = null;
  if (size !== null) {
    if (size <= 10) sizeRange = '1-10';
    else if (size <= 50) sizeRange = '11-50';
    else if (size <= 200) sizeRange = '51-200';
    else if (size <= 500) sizeRange = '201-500';
    else if (size <= 1000) sizeRange = '501-1000';
    else if (size <= 5000) sizeRange = '1001-5000';
    else if (size <= 10000) sizeRange = '5001-10000';
    else sizeRange = '10000+';
  }

  return {
    name: data.name ?? '',
    description: data.description ?? '',
    website: data.website ?? null,
    industry: data.industry ?? null,
    companySize: size,
    companySizeRange: sizeRange,
    headquarter: {
      city: data.hq?.city ?? null,
      state: data.hq?.state ?? null,
      country: data.hq?.country ?? null,
    },
    foundedYear: data.founded_year ?? null,
    specialities: data.specialities ?? [],
    followerCount: data.follower_count ?? null,
  };
}
