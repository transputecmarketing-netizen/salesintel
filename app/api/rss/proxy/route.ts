import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface CachedResponse {
  body: string;
  contentType: string;
  fetchedAt: number;
}

const PROXY_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const proxyCache = new Map<string, CachedResponse>();

// Allowed feed URL patterns (prevent open proxy abuse)
const ALLOWED_HOSTS = new Set([
  'reutersagency.com', 'rsshub.app', 'prnewswire.com', 'businesswire.com',
  'globenewswire.com', 'sec.gov', 'federalregister.gov', 'feeds.a.dj.com',
  'feeds.bloomberg.com', 'ft.com', 'fortune.com', 'forbes.com', 'cnbc.com',
  'techcrunch.com', 'theverge.com', 'arstechnica.com', 'wired.com',
  'technologyreview.com', 'venturebeat.com', 'zdnet.com', 'theinformation.com',
  'news.crunchbase.com', 'pitchbook.com', 'aws.amazon.com', 'cloud.google.com',
  'azure.microsoft.com', 'blog.cloudflare.com', 'hnrss.org', 'lobste.rs',
  'reddit.com', 'producthunt.com', 'substack.com', 'medium.com',
]);

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    // Check if the host or any parent domain is in the allowed list
    const parts = host.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
      if (ALLOWED_HOSTS.has(parts.slice(i).join('.'))) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const feedUrl = searchParams.get('feedUrl');

    if (!feedUrl || typeof feedUrl !== 'string') {
      return NextResponse.json(
        { error: 'feedUrl query parameter is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(feedUrl);
    } catch {
      return NextResponse.json(
        { error: 'feedUrl must be a valid URL' },
        { status: 400 }
      );
    }

    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are supported' },
        { status: 400 }
      );
    }

    // Check against allowlist
    if (!isAllowedUrl(feedUrl)) {
      return NextResponse.json(
        { error: 'This feed URL is not in the allowed list' },
        { status: 403 }
      );
    }

    // Check cache
    const cached = proxyCache.get(feedUrl);
    if (cached && Date.now() - cached.fetchedAt < PROXY_CACHE_TTL_MS) {
      return new NextResponse(cached.body, {
        status: 200,
        headers: {
          'Content-Type': cached.contentType,
          'X-Cache': 'HIT',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      });
    }

    // Fetch the feed
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SalesIntel/1.0 (RSS Proxy)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Feed returned HTTP ${response.status}` },
        { status: 502 }
      );
    }

    const body = await response.text();
    const contentType = response.headers.get('Content-Type') ?? 'application/xml';

    // Cache the response
    proxyCache.set(feedUrl, { body, contentType, fetchedAt: Date.now() });

    // Clean old cache entries (keep max 500)
    if (proxyCache.size > 500) {
      const entries = Array.from(proxyCache.entries());
      entries
        .sort((a, b) => a[1].fetchedAt - b[1].fetchedAt)
        .slice(0, proxyCache.size - 400)
        .forEach(([key]) => proxyCache.delete(key));
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'X-Cache': 'MISS',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Feed request timed out' }, { status: 504 });
    }
    console.error('[RSS/Proxy] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
