import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getActiveFeeds, type FeedSource } from '@/lib/rss/feeds';

interface CachedFeed {
  items: FeedItem[];
  fetchedAt: number;
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sourceTier: number;
  category: string;
  snippet: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const feedCache = new Map<string, CachedFeed>();

async function fetchSingleFeed(feed: FeedSource): Promise<FeedItem[]> {
  const cached = feedCache.get(feed.url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.items;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SalesIntel/1.0 (RSS Aggregator)' },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const xml = await res.text();
    const items = parseRssItems(xml, feed);

    feedCache.set(feed.url, { items, fetchedAt: Date.now() });
    return items;
  } catch {
    // Return cached data if available, even if stale
    return cached?.items ?? [];
  }
}

function parseRssItems(xml: string, feed: FeedSource): FeedItem[] {
  const items: FeedItem[] = [];

  // Simple regex-based RSS parser for <item> elements
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1] ?? '';

    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link') || extractTag(itemXml, 'guid');
    const pubDate = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'dc:date');
    const description = extractTag(itemXml, 'description') || extractTag(itemXml, 'content:encoded');

    if (title) {
      items.push({
        title: stripHtml(title),
        link: link ?? '',
        pubDate: pubDate ?? new Date().toISOString(),
        source: feed.name,
        sourceTier: feed.tier,
        category: feed.category,
        snippet: stripHtml(description ?? '').slice(0, 300),
      });
    }
  }

  // Also handle Atom <entry> elements
  const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1] ?? '';

    const title = extractTag(entryXml, 'title');
    const link = extractAtomLink(entryXml);
    const updated = extractTag(entryXml, 'updated') || extractTag(entryXml, 'published');
    const summary = extractTag(entryXml, 'summary') || extractTag(entryXml, 'content');

    if (title) {
      items.push({
        title: stripHtml(title),
        link: link ?? '',
        pubDate: updated ?? new Date().toISOString(),
        source: feed.name,
        sourceTier: feed.tier,
        category: feed.category,
        snippet: stripHtml(summary ?? '').slice(0, 300),
      });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
  const match = regex.exec(xml);
  return match?.[1]?.trim() ?? null;
}

function extractAtomLink(xml: string): string | null {
  const regex = /<link[^>]+href=["']([^"']+)["']/i;
  const match = regex.exec(xml);
  return match?.[1] ?? null;
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);

    let feeds = getActiveFeeds();

    if (tier) {
      const tierNum = parseInt(tier, 10);
      if (tierNum >= 1 && tierNum <= 4) {
        feeds = feeds.filter((f) => f.tier === tierNum);
      }
    }

    if (category) {
      feeds = feeds.filter((f) => f.category === category);
    }

    // Fetch feeds in parallel with concurrency limit
    const CONCURRENCY = 10;
    const allItems: FeedItem[] = [];

    for (let i = 0; i < feeds.length; i += CONCURRENCY) {
      const batch = feeds.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((feed) => fetchSingleFeed(feed))
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allItems.push(...result.value);
        }
      }
    }

    // Sort by publication date (newest first) and limit
    const sorted = allItems
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, limit);

    return NextResponse.json(
      {
        items: sorted,
        totalItems: sorted.length,
        feedsQueried: feeds.length,
        cachedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (err) {
    console.error('[Signals/Feed] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
