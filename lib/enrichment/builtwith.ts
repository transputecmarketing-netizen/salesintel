export interface DetectedTechnology {
  name: string;
  category: string;
  subCategory: string;
  firstDetected: string | null;
  lastDetected: string | null;
  isPremium: boolean;
}

export interface BuiltWithResult {
  domain: string;
  technologies: DetectedTechnology[];
  spendEstimate: string | null;
  totalTechnologies: number;
}

const BUILTWITH_BASE_URL = 'https://api.builtwith.com/v21/api.json';

function getApiKey(): string {
  const key = process.env.BUILTWITH_API_KEY;
  if (!key) throw new Error('BUILTWITH_API_KEY is not configured');
  return key;
}

interface BuiltWithApiResponse {
  Results?: Array<{
    Result?: {
      Paths?: Array<{
        Technologies?: Array<{
          Name?: string;
          Categories?: string[];
          SubCategories?: string[];
          FirstDetected?: number;
          LastDetected?: number;
          IsPremium?: string;
        }>;
      }>;
      SpendEstimate?: string;
    };
  }>;
}

export async function detectTechStack(domain: string): Promise<BuiltWithResult | null> {
  try {
    const url = new URL(BUILTWITH_BASE_URL);
    url.searchParams.set('KEY', getApiKey());
    url.searchParams.set('LOOKUP', domain);
    url.searchParams.set('NOMETA', 'yes');
    url.searchParams.set('NOATTR', 'yes');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.error(`[BuiltWith] Tech detection returned ${res.status}: ${res.statusText}`);
      return null;
    }

    const data: BuiltWithApiResponse = await res.json();
    const result = data.Results?.[0]?.Result;

    if (!result) return null;

    const technologies: DetectedTechnology[] = [];
    const seen = new Set<string>();

    for (const path of result.Paths ?? []) {
      for (const tech of path.Technologies ?? []) {
        const name = tech.Name ?? '';
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());

        technologies.push({
          name,
          category: tech.Categories?.[0] ?? 'Other',
          subCategory: tech.SubCategories?.[0] ?? '',
          firstDetected: tech.FirstDetected ? new Date(tech.FirstDetected).toISOString() : null,
          lastDetected: tech.LastDetected ? new Date(tech.LastDetected).toISOString() : null,
          isPremium: tech.IsPremium === 'yes',
        });
      }
    }

    return {
      domain,
      technologies,
      spendEstimate: result.SpendEstimate ?? null,
      totalTechnologies: technologies.length,
    };
  } catch (err) {
    console.error('[BuiltWith] Tech detection failed:', err);
    return null;
  }
}

export function categorizeTechStack(
  technologies: DetectedTechnology[]
): Record<string, DetectedTechnology[]> {
  const categories: Record<string, DetectedTechnology[]> = {};

  for (const tech of technologies) {
    const cat = tech.category || 'Other';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(tech);
  }

  return categories;
}

export function findOverlappingTech(
  stack: DetectedTechnology[],
  targetTechnologies: string[]
): DetectedTechnology[] {
  const targetSet = new Set(targetTechnologies.map((t) => t.toLowerCase()));
  return stack.filter((tech) => targetSet.has(tech.name.toLowerCase()));
}

export function findCompetitorTech(
  stack: DetectedTechnology[],
  competitorProducts: Record<string, string[]>
): Array<{ technology: string; competesWithProduct: string }> {
  const results: Array<{ technology: string; competesWithProduct: string }> = [];

  for (const tech of stack) {
    for (const [product, competitors] of Object.entries(competitorProducts)) {
      if (competitors.some((c) => c.toLowerCase() === tech.name.toLowerCase())) {
        results.push({ technology: tech.name, competesWithProduct: product });
      }
    }
  }

  return results;
}
