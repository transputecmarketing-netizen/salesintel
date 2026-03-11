// lib/rss/parser.ts - Feed parsing and normalization for RSS/Atom feeds

/**
 * Normalized feed item, regardless of source format (RSS 2.0, Atom, RSS 1.0).
 */
export interface FeedItem {
  /** Unique identifier for the item (guid or link) */
  id: string;
  /** Article title */
  title: string;
  /** Canonical URL to the article */
  link: string;
  /** Publication timestamp (ISO 8601) */
  publishedAt: string;
  /** Article description or summary (HTML stripped) */
  description: string;
  /** Author name if available */
  author?: string;
  /** Content categories / tags */
  categories: string[];
  /** Source feed name */
  sourceName: string;
  /** Source feed URL */
  sourceUrl: string;
  /** Raw HTML content if available */
  contentHtml?: string;
}

/**
 * Parsed feed metadata.
 */
export interface ParsedFeed {
  title: string;
  link: string;
  description: string;
  language?: string;
  lastBuildDate?: string;
  items: FeedItem[];
}

/**
 * Parse an RSS or Atom XML string into a normalized ParsedFeed.
 */
export function parseFeed(
  xml: string,
  sourceName: string,
  sourceUrl: string
): ParsedFeed {
  const isAtom = xml.includes('<feed') && xml.includes('xmlns="http://www.w3.org/2005/Atom"');
  const isRdf = xml.includes('<rdf:RDF') || xml.includes('xmlns="http://purl.org/rss/1.0/"');

  if (isAtom) {
    return parseAtomFeed(xml, sourceName, sourceUrl);
  } else if (isRdf) {
    return parseRdfFeed(xml, sourceName, sourceUrl);
  } else {
    return parseRssFeed(xml, sourceName, sourceUrl);
  }
}

/**
 * Parse RSS 2.0 format.
 */
function parseRssFeed(
  xml: string,
  sourceName: string,
  sourceUrl: string
): ParsedFeed {
  const channelTitle = extractTag(xml, 'title', getBlock(xml, 'channel') || '') || sourceName;
  const channelLink = extractTag(xml, 'link', getBlock(xml, 'channel') || '') || sourceUrl;
  const channelDesc = extractTag(xml, 'description', getBlock(xml, 'channel') || '') || '';
  const language = extractTag(xml, 'language', getBlock(xml, 'channel') || '');
  const lastBuildDate = extractTag(xml, 'lastBuildDate', getBlock(xml, 'channel') || '');

  const items = extractAllBlocks(xml, 'item').map((itemXml): FeedItem => {
    const title = extractTag(itemXml, 'title') || '';
    const link = extractTag(itemXml, 'link') || '';
    const guid = extractTag(itemXml, 'guid') || link || generateId(title, sourceUrl);
    const pubDate = extractTag(itemXml, 'pubDate') || '';
    const description = extractTag(itemXml, 'description') || '';
    const author = extractTag(itemXml, 'author') || extractTag(itemXml, 'dc:creator') || undefined;
    const contentEncoded = extractTag(itemXml, 'content:encoded') || undefined;
    const categories = extractAllTags(itemXml, 'category');

    return {
      id: guid,
      title: stripCdata(title),
      link: stripCdata(link).trim(),
      publishedAt: normalizeDate(stripCdata(pubDate)),
      description: stripHtml(stripCdata(description)).slice(0, 2000),
      author: author ? stripCdata(author) : undefined,
      categories: categories.map(stripCdata),
      sourceName,
      sourceUrl,
      contentHtml: contentEncoded ? stripCdata(contentEncoded) : undefined,
    };
  });

  return {
    title: stripCdata(channelTitle),
    link: stripCdata(channelLink),
    description: stripCdata(channelDesc),
    language: language || undefined,
    lastBuildDate: lastBuildDate ? normalizeDate(stripCdata(lastBuildDate)) : undefined,
    items,
  };
}

/**
 * Parse Atom format.
 */
function parseAtomFeed(
  xml: string,
  sourceName: string,
  sourceUrl: string
): ParsedFeed {
  const feedBlock = getBlock(xml, 'feed') || xml;
  const feedTitle = extractTag(feedBlock, 'title') || sourceName;
  const feedLink = extractAtomLink(feedBlock) || sourceUrl;
  const feedSubtitle = extractTag(feedBlock, 'subtitle') || '';
  const feedUpdated = extractTag(feedBlock, 'updated') || '';

  const items = extractAllBlocks(xml, 'entry').map((entryXml): FeedItem => {
    const title = extractTag(entryXml, 'title') || '';
    const link = extractAtomLink(entryXml) || '';
    const id = extractTag(entryXml, 'id') || link || generateId(title, sourceUrl);
    const published = extractTag(entryXml, 'published') || extractTag(entryXml, 'updated') || '';
    const summary = extractTag(entryXml, 'summary') || '';
    const content = extractTag(entryXml, 'content') || undefined;
    const authorName = extractTag(getBlock(entryXml, 'author') || '', 'name') || undefined;
    const categories = extractAtomCategories(entryXml);

    return {
      id: stripCdata(id),
      title: stripCdata(title),
      link: stripCdata(link).trim(),
      publishedAt: normalizeDate(stripCdata(published)),
      description: stripHtml(stripCdata(summary || content || '')).slice(0, 2000),
      author: authorName ? stripCdata(authorName) : undefined,
      categories,
      sourceName,
      sourceUrl,
      contentHtml: content ? stripCdata(content) : undefined,
    };
  });

  return {
    title: stripCdata(feedTitle),
    link: stripCdata(feedLink),
    description: stripCdata(feedSubtitle),
    lastBuildDate: feedUpdated ? normalizeDate(stripCdata(feedUpdated)) : undefined,
    items,
  };
}

/**
 * Parse RDF/RSS 1.0 format.
 */
function parseRdfFeed(
  xml: string,
  sourceName: string,
  sourceUrl: string
): ParsedFeed {
  const channelBlock = getBlock(xml, 'channel') || '';
  const channelTitle = extractTag(channelBlock, 'title') || sourceName;
  const channelLink = extractTag(channelBlock, 'link') || sourceUrl;
  const channelDesc = extractTag(channelBlock, 'description') || '';

  const items = extractAllBlocks(xml, 'item').map((itemXml): FeedItem => {
    const title = extractTag(itemXml, 'title') || '';
    const link = extractTag(itemXml, 'link') || '';
    const description = extractTag(itemXml, 'description') || '';
    const dcDate = extractTag(itemXml, 'dc:date') || '';
    const dcCreator = extractTag(itemXml, 'dc:creator') || undefined;

    return {
      id: link || generateId(title, sourceUrl),
      title: stripCdata(title),
      link: stripCdata(link).trim(),
      publishedAt: normalizeDate(stripCdata(dcDate)),
      description: stripHtml(stripCdata(description)).slice(0, 2000),
      author: dcCreator ? stripCdata(dcCreator) : undefined,
      categories: [],
      sourceName,
      sourceUrl,
    };
  });

  return {
    title: stripCdata(channelTitle),
    link: stripCdata(channelLink),
    description: stripCdata(channelDesc),
    items,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// XML Extraction Helpers (lightweight, no external dependencies)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract the text content of the first occurrence of a tag.
 */
function extractTag(xml: string, tagName: string, context?: string): string {
  const src = context || xml;
  // Handle self-closing tags
  const selfClosingRegex = new RegExp(`<${tagName}[^>]*/\\s*>`, 'i');
  const selfClosingMatch = src.match(selfClosingRegex);

  // Handle opening/closing tags
  const regex = new RegExp(
    `<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`,
    'i'
  );
  const match = src.match(regex);
  if (match) {
    return match[1]?.trim() ?? '';
  }

  // For self-closing tags, return empty string (tag exists but no content)
  if (selfClosingMatch) {
    return '';
  }

  return '';
}

/**
 * Extract all occurrences of a tag's text content.
 */
function extractAllTags(xml: string, tagName: string): string[] {
  const regex = new RegExp(
    `<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`,
    'gi'
  );
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    if (match[1]) results.push(match[1].trim());
  }
  return results;
}

/**
 * Extract a block of XML between opening and closing tags.
 */
function getBlock(xml: string, tagName: string): string | null {
  const regex = new RegExp(
    `<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`,
    'i'
  );
  const match = xml.match(regex);
  return match ? match[0] : null;
}

/**
 * Extract all blocks for a given tag.
 */
function extractAllBlocks(xml: string, tagName: string): string[] {
  const regex = new RegExp(
    `<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`,
    'gi'
  );
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[0]);
  }
  return results;
}

/**
 * Extract href from Atom link element (prefers rel="alternate").
 */
function extractAtomLink(xml: string): string {
  // Try rel="alternate" first
  const altMatch = xml.match(
    /<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i
  );
  if (altMatch?.[1]) return altMatch[1];

  // Try href without rel, or rel="alternate" with href before rel
  const hrefMatch = xml.match(
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["'][^>]*\/?>/i
  );
  if (hrefMatch?.[1]) return hrefMatch[1];

  // Fallback: any link with href
  const anyMatch = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return anyMatch?.[1] ?? '';
}

/**
 * Extract categories from Atom entry (term attribute).
 */
function extractAtomCategories(xml: string): string[] {
  const regex = /<category[^>]*term=["']([^"']+)["'][^>]*\/?>/gi;
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    if (match[1]) results.push(match[1]);
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// Text Processing Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Strip CDATA wrappers from XML content.
 */
function stripCdata(text: string): string {
  return text
    .replace(/^<!\[CDATA\[/, '')
    .replace(/\]\]>$/, '')
    .trim();
}

/**
 * Strip HTML tags from a string, decode common entities.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize various date formats to ISO 8601.
 * Handles: RFC 822, RFC 2822, ISO 8601, and common variants.
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) {
    return new Date().toISOString();
  }

  const cleaned = dateStr.trim();

  // Already ISO 8601
  if (/^\d{4}-\d{2}-\d{2}T/.test(cleaned)) {
    try {
      return new Date(cleaned).toISOString();
    } catch {
      // fall through
    }
  }

  // ISO date only (2024-01-15)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return new Date(cleaned + 'T00:00:00Z').toISOString();
  }

  // RFC 822 / 2822 (common in RSS)
  // e.g., "Mon, 15 Jan 2024 12:00:00 GMT"
  // e.g., "15 Jan 2024 12:00:00 +0000"
  try {
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  } catch {
    // fall through
  }

  // Handle timezone abbreviations that JS doesn't understand
  const tzCleaned = cleaned
    .replace(/\s+(EST|EDT|CST|CDT|MST|MDT|PST|PDT)\s*$/i, ' -0500')
    .replace(/\s+UTC\s*$/i, ' +0000')
    .replace(/\s+GMT\s*$/i, ' +0000');

  try {
    const parsed = new Date(tzCleaned);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  } catch {
    // fall through
  }

  // Last resort: return current time
  console.warn(`[rss/parser] Unable to parse date: "${dateStr}"`);
  return new Date().toISOString();
}

/**
 * Generate a deterministic ID from title and source when no guid is available.
 */
function generateId(title: string, sourceUrl: string): string {
  const input = `${sourceUrl}::${title}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `generated-${Math.abs(hash).toString(36)}`;
}

/**
 * Filter feed items by a simple keyword filter string.
 * Supports OR-separated keywords: "hiring OR recruiting OR jobs"
 */
export function filterItems(items: FeedItem[], filter: string): FeedItem[] {
  if (!filter) return items;

  const keywords = filter
    .split(/\s+OR\s+/i)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  if (keywords.length === 0) return items;

  return items.filter((item) => {
    const searchText = `${item.title} ${item.description} ${item.categories.join(' ')}`.toLowerCase();
    return keywords.some((kw) => searchText.includes(kw));
  });
}

/**
 * Deduplicate feed items by ID or link.
 */
export function deduplicateItems(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.id || item.link;
    if (seen.has(key)) return false;
    seen.add(key);
    // Also deduplicate by normalized link
    if (item.link && !seen.has(item.link)) {
      seen.add(item.link);
    }
    return true;
  });
}

/**
 * Sort feed items by publication date (newest first).
 */
export function sortByDate(items: FeedItem[]): FeedItem[] {
  return [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
