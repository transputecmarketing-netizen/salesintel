import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getActiveFeeds, type FeedSource } from '@/lib/rss/feeds';

interface DigestItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sourceTier: number;
  category: string;
  snippet: string;
}

interface DigestSection {
  category: string;
  feedCount: number;
  items: DigestItem[];
}

interface CachedDigest {
  sections: DigestSection[];
  generatedAt: number;
}

const DIGEST_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
let digestCache: CachedDigest | null = null;

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
  const match = regex.exec(xml);
  return match?.[1]?.trim() ?? null;
}

function stripHtml(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function fetchFeedItems(feed: FeedSource): Promise<DigestItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SalesIntel/1.0 (Digest)' },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const xml = await res.text();
    const items: DigestItem[] = [];

    // Parse RSS <item> elements
    const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
      const itemXml = match[1] ?? '';
      const title = extractTag(itemXml, 'title');
      const link = extractTag(itemXml, 'link') || extractTag(itemXml, 'guid');
      const pubDate = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'dc:date');
      const description = extractTag(itemXml, 'description');

      if (title) {
        items.push({
          title: stripHtml(title),
          link: link ?? '',
          pubDate: pubDate ?? new Date().toISOString(),
          source: feed.name,
          sourceTier: feed.tier,
          category: feed.category,
          snippet: stripHtml(description ?? '').slice(0, 200),
        });
      }
    }

    // Parse Atom <entry> elements
    const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null && items.length < 5) {
      const entryXml = match[1] ?? '';
      const title = extractTag(entryXml, 'title');
      const linkMatch = /<link[^>]+href=["']([^"']+)["']/i.exec(entryXml);
      const updated = extractTag(entryXml, 'updated') || extractTag(entryXml, 'published');
      const summary = extractTag(entryXml, 'summary');

      if (title) {
        items.push({
          title: stripHtml(title),
          link: linkMatch?.[1] ?? '',
          pubDate: updated ?? new Date().toISOString(),
          source: feed.name,
          sourceTier: feed.tier,
          category: feed.category,
          snippet: stripHtml(summary ?? '').slice(0, 200),
        });
      }
    }

    return items;
  } catch {
    return [];
  }
}

async function buildDigest(): Promise<DigestSection[]> {
  // Check cache
  if (digestCache && Date.now() - digestCache.generatedAt < DIGEST_CACHE_TTL_MS) {
    return digestCache.sections;
  }

  const feeds = getActiveFeeds();

  // Group feeds by category
  const feedsByCategory = new Map<string, FeedSource[]>();
  for (const feed of feeds) {
    const existing = feedsByCategory.get(feed.category) ?? [];
    existing.push(feed);
    feedsByCategory.set(feed.category, existing);
  }

  // Fetch top feeds per category (limit to keep digest fast)
  const sections: DigestSection[] = [];

  for (const [category, categoryFeeds] of feedsByCategory) {
    // Prioritize by tier, take top 3 per category
    const topFeeds = categoryFeeds.sort((a, b) => a.tier - b.tier).slice(0, 3);

    const allItems: DigestItem[] = [];
    const results = await Promise.allSettled(topFeeds.map(fetchFeedItems));

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      }
    }

    // Sort by date, take top 5 per category
    const sortedItems = allItems
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 5);

    if (sortedItems.length > 0) {
      sections.push({
        category,
        feedCount: categoryFeeds.length,
        items: sortedItems,
      });
    }
  }

  // Sort sections: wire/sec first, then by item count
  const categoryOrder = ['wire', 'sec', 'government', 'business', 'tech', 'vc'];
  sections.sort((a, b) => {
    const aIdx = categoryOrder.indexOf(a.category);
    const bIdx = categoryOrder.indexOf(b.category);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return b.items.length - a.items.length;
  });

  digestCache = { sections, generatedAt: Date.now() };
  return sections;
}

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sections = await buildDigest();
    const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);

    return NextResponse.json(
      {
        digest: sections,
        totalSections: sections.length,
        totalItems,
        generatedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      }
    );
  } catch (err) {
    console.error('[RSS/Digest] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
