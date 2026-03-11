// lib/ai/prompts/extract-entities.ts - Entity extraction prompt
// Extracts structured entities (companies, people, products, etc.) from unstructured text.

export interface ExtractEntitiesInput {
  text: string;
  source: string;
  publishedAt?: string;
  contextHint?: string;
  entityTypes?: EntityType[];
}

export type EntityType =
  | 'company'
  | 'person'
  | 'product'
  | 'technology'
  | 'financial_metric'
  | 'location'
  | 'event'
  | 'job_title'
  | 'organization';

export interface ExtractedEntity {
  text: string;
  type: EntityType;
  normalizedName: string;
  confidence: number;
  context: string;
  attributes: Record<string, string>;
  relationships: Array<{
    relatedEntity: string;
    relationType: string;
  }>;
}

export interface ExtractEntitiesOutput {
  entities: ExtractedEntity[];
  primaryCompany: string | null;
  primaryEvent: string | null;
  entityCount: number;
}

export function buildExtractEntitiesPrompt(input: ExtractEntitiesInput): string {
  const requestedTypes = input.entityTypes ?? [
    'company',
    'person',
    'product',
    'technology',
    'financial_metric',
    'location',
    'event',
    'job_title',
    'organization',
  ];

  return `You are a named entity recognition (NER) engine optimized for B2B sales intelligence. Extract all relevant entities from the provided text, normalize them, and identify relationships between them.

SOURCE: ${input.source}
${input.publishedAt ? `PUBLISHED: ${input.publishedAt}` : ''}
${input.contextHint ? `CONTEXT HINT: ${input.contextHint}` : ''}

TEXT TO ANALYZE:
---
${input.text.slice(0, 5000)}
---

ENTITY TYPES TO EXTRACT: ${requestedTypes.join(', ')}

EXTRACTION RULES:

1. COMPANY:
   - Extract full legal name when available (e.g., "Salesforce, Inc." not "Salesforce")
   - Normalize to most commonly used business name (e.g., "Alphabet" -> "Google" if context is about Google)
   - Include parent/subsidiary relationships
   - Attributes: ticker, industry, founded_year (if mentioned)
   - Distinguish between: public companies, private companies, non-profits, government agencies

2. PERSON:
   - Extract full name (first + last minimum)
   - Normalize to "First Last" format (no honorifics unless relevant)
   - Attributes: title, company, role_type (executive, board, analyst, etc.)
   - Do NOT extract generic role references without names ("the CEO said" without naming them)

3. PRODUCT:
   - Extract specific product names, platforms, and services
   - Normalize to official product name (e.g., "AWS Lambda" not "Amazon's serverless thing")
   - Attributes: vendor, category, version (if mentioned)
   - Include both the product and its parent company

4. TECHNOLOGY:
   - Extract technology categories, frameworks, protocols, standards
   - Normalize to standard industry terminology
   - Attributes: category (language, framework, protocol, standard, methodology)
   - Examples: "Kubernetes", "React", "GPT-4", "zero trust architecture"

5. FINANCIAL_METRIC:
   - Extract specific numbers with context (revenue, funding amounts, valuations, growth rates)
   - Normalize to consistent units (always use USD, millions/billions notation)
   - Attributes: metric_type, period, currency, direction (up/down/flat)
   - Examples: "$50M Series B", "revenue grew 30% YoY to $1.2B"

6. LOCATION:
   - Extract cities, states, countries, regions
   - Normalize to "City, State/Country" format
   - Attributes: location_type (hq, office, market, region)
   - Include context: headquarters, new office, expansion market

7. EVENT:
   - Extract conferences, product launches, announcements, incidents
   - Normalize to event name with date
   - Attributes: event_type, date, significance
   - Examples: "AWS re:Invent 2024", "Series B funding round"

8. JOB_TITLE:
   - Extract specific titles and roles mentioned
   - Normalize to standard title format
   - Attributes: level (c_suite, vp, director, manager, ic), department
   - Link to person entity when possible

9. ORGANIZATION:
   - Non-company organizations: regulators, industry bodies, universities, research labs
   - Attributes: org_type (regulatory, academic, industry_body, ngo)

RELATIONSHIP EXTRACTION:
For each entity, identify relationships to other extracted entities:
- Company-Person: "employs", "appointed", "departed_from", "founded_by"
- Company-Company: "acquired", "partnered_with", "competes_with", "invested_in", "subsidiary_of"
- Company-Product: "launched", "uses", "integrates_with"
- Company-Location: "headquartered_in", "expanded_to", "closed_in"
- Person-Product: "leads", "created"
- Company-Financial: "raised", "reported", "valued_at"

CONFIDENCE SCORING:
- 1.0: Entity is explicitly named and unambiguous
- 0.8-0.9: Entity is clearly referenced but requires minor inference
- 0.6-0.7: Entity is implied or partially referenced
- 0.4-0.5: Uncertain extraction, may be incorrect
- Below 0.4: Do not include

IMPORTANT:
- Do NOT hallucinate entities that aren't in the text
- Do NOT extract overly generic terms as entities (e.g., "technology", "the market")
- DO extract acronyms and resolve them (e.g., "AI" -> normalizedName: "Artificial Intelligence")
- If the same entity appears multiple times, consolidate into one entry with the highest confidence

Respond in JSON format:
{
  "entities": [
    {
      "text": "<exact text from source>",
      "type": "<entity type>",
      "normalizedName": "<standardized name>",
      "confidence": <number 0-1>,
      "context": "<sentence or phrase where entity appears>",
      "attributes": { "<key>": "<value>" },
      "relationships": [
        { "relatedEntity": "<normalized name of related entity>", "relationType": "<relationship type>" }
      ]
    }
  ],
  "primaryCompany": "<normalized name of the main company discussed, or null>",
  "primaryEvent": "<normalized description of the main event, or null>",
  "entityCount": <total number of entities>
}`;
}
