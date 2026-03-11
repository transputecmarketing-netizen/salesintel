// lib/rss/feeds.ts - Feed registry for SalesIntel business intelligence platform
// 100+ curated RSS/Atom feeds organized by tier and category

export interface FeedSource {
  name: string;
  url: string;
  category: string;
  tier: 1 | 2 | 3 | 4;
  filter?: string;
  active: boolean;
}

export const FEED_REGISTRY: FeedSource[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 1: Wire Services & Primary Sources
  // Highest reliability, real-time breaking news, foundational signals
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Wire Services ---
  { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best', category: 'wire', tier: 1, active: true },
  { name: 'AP News Business', url: 'https://rsshub.app/apnews/topics/business', category: 'wire', tier: 1, active: true },
  { name: 'PR Newswire', url: 'https://www.prnewswire.com/rss/technology-latest-news.rss', category: 'wire', tier: 1, active: true },
  { name: 'Business Wire', url: 'https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeEFpRWg==', category: 'wire', tier: 1, active: true },
  { name: 'GlobeNewswire', url: 'https://www.globenewswire.com/RssFeed/subjectcode/01-NTK/feedTitle/GlobeNewswire%20-%20News%20Releases', category: 'wire', tier: 1, active: true },

  // --- SEC / Government ---
  { name: 'SEC EDGAR Full-Text', url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&dateb=&owner=include&count=40&search_text=&action=getcurrent&output=atom', category: 'sec', tier: 1, active: true },
  { name: 'SEC EDGAR 10-K Filings', url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=10-K&dateb=&owner=include&count=40&search_text=&action=getcurrent&output=atom', category: 'sec', tier: 1, active: true },
  { name: 'SEC EDGAR 10-Q Filings', url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=10-Q&dateb=&owner=include&count=20&search_text=&action=getcurrent&output=atom', category: 'sec', tier: 1, active: true },
  { name: 'Federal Register Technology', url: 'https://www.federalregister.gov/api/v1/documents.rss?conditions%5Btopic_ids%5D%5B%5D=technology', category: 'government', tier: 1, active: true },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 2: Major Business Press
  // Authoritative reporting, timely analysis, high editorial standards
  // ═══════════════════════════════════════════════════════════════════════════

  // --- General Business ---
  { name: 'Wall Street Journal Tech', url: 'https://feeds.a.dj.com/rss/RSSWSJD.xml', category: 'business', tier: 2, active: true },
  { name: 'Bloomberg Technology', url: 'https://feeds.bloomberg.com/technology/news.rss', category: 'business', tier: 2, active: true },
  { name: 'Financial Times Technology', url: 'https://www.ft.com/technology?format=rss', category: 'business', tier: 2, active: true },
  { name: 'Fortune Tech', url: 'https://fortune.com/feed/fortune-feeds/?id=3230629', category: 'business', tier: 2, active: true },
  { name: 'Forbes Tech', url: 'https://www.forbes.com/innovation/feed2', category: 'business', tier: 2, active: true },
  { name: 'CNBC Technology', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910', category: 'business', tier: 2, active: true },

  // --- Tech Press ---
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'tech', tier: 2, active: true },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'tech', tier: 2, active: true },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'tech', tier: 2, active: true },
  { name: 'Wired Business', url: 'https://www.wired.com/feed/category/business/latest/rss', category: 'business', tier: 2, active: true },
  { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', category: 'tech', tier: 2, active: true },
  { name: 'VentureBeat', url: 'https://venturebeat.com/feed/', category: 'tech', tier: 2, active: true },
  { name: 'ZDNet', url: 'https://www.zdnet.com/news/rss.xml', category: 'tech', tier: 2, active: true },
  { name: 'The Information', url: 'https://www.theinformation.com/feed', category: 'tech', tier: 2, active: true },
  { name: 'Protocol', url: 'https://www.protocol.com/feeds/feed.rss', category: 'tech', tier: 2, active: false },

  // --- VC/Startup ---
  { name: 'Crunchbase News', url: 'https://news.crunchbase.com/feed/', category: 'vc', tier: 2, active: true },
  { name: 'PitchBook News', url: 'https://pitchbook.com/news/feed', category: 'vc', tier: 2, active: true },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 3: Specialized / Industry Vertical
  // Deep domain expertise, niche signals, vertical-specific intelligence
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Cloud Infrastructure ---
  { name: 'AWS News Blog', url: 'https://aws.amazon.com/blogs/aws/feed/', category: 'cloud', tier: 3, active: true },
  { name: 'Google Cloud Blog', url: 'https://cloud.google.com/blog/rss', category: 'cloud', tier: 3, active: true },
  { name: 'Azure Blog', url: 'https://azure.microsoft.com/en-us/blog/feed/', category: 'cloud', tier: 3, active: true },
  { name: 'CloudFlare Blog', url: 'https://blog.cloudflare.com/rss/', category: 'cloud', tier: 3, active: true },
  { name: 'InfoQ Cloud', url: 'https://feed.infoq.com/cloud-computing/', category: 'cloud', tier: 3, active: true },
  { name: 'The New Stack', url: 'https://thenewstack.io/feed/', category: 'cloud', tier: 3, active: true },
  { name: 'Container Journal', url: 'https://containerjournal.com/feed/', category: 'cloud', tier: 3, active: true },
  { name: 'DevOps.com', url: 'https://devops.com/feed/', category: 'cloud', tier: 3, active: true },
  { name: 'HashiCorp Blog', url: 'https://www.hashicorp.com/blog/feed.xml', category: 'cloud', tier: 3, active: true },
  { name: 'Datadog Blog', url: 'https://www.datadoghq.com/blog/feed/', category: 'cloud', tier: 3, active: true },

  // --- Cybersecurity ---
  { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', category: 'cybersecurity', tier: 3, active: true },
  { name: 'Dark Reading', url: 'https://www.darkreading.com/rss.xml', category: 'cybersecurity', tier: 3, active: true },
  { name: 'Threatpost', url: 'https://threatpost.com/feed/', category: 'cybersecurity', tier: 3, active: true },
  { name: 'SecurityWeek', url: 'https://www.securityweek.com/feed/', category: 'cybersecurity', tier: 3, active: true },
  { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', category: 'cybersecurity', tier: 3, active: true },
  { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', category: 'cybersecurity', tier: 3, active: true },
  { name: 'SC Magazine', url: 'https://www.scmagazine.com/feed', category: 'cybersecurity', tier: 3, active: true },
  { name: 'CSO Online', url: 'https://www.csoonline.com/feed/', category: 'cybersecurity', tier: 3, active: true },
  { name: 'CISA Alerts', url: 'https://www.cisa.gov/uscert/ncas/alerts.xml', category: 'cybersecurity', tier: 3, active: true },
  { name: 'Schneier on Security', url: 'https://www.schneier.com/feed/', category: 'cybersecurity', tier: 3, active: true },

  // --- Fintech ---
  { name: 'Finextra', url: 'https://www.finextra.com/rss/headlines.aspx', category: 'fintech', tier: 3, active: true },
  { name: 'American Banker', url: 'https://www.americanbanker.com/feed', category: 'fintech', tier: 3, active: true },
  { name: 'PaymentsSource', url: 'https://www.paymentssource.com/feed', category: 'fintech', tier: 3, active: true },
  { name: 'Finovate', url: 'https://finovate.com/feed/', category: 'fintech', tier: 3, active: true },
  { name: 'Bank Innovation', url: 'https://bankinnovation.net/feed/', category: 'fintech', tier: 3, active: true },
  { name: 'The Financial Brand', url: 'https://thefinancialbrand.com/feed/', category: 'fintech', tier: 3, active: true },
  { name: 'Tearsheet', url: 'https://tearsheet.co/feed/', category: 'fintech', tier: 3, active: true },

  // --- Healthcare IT ---
  { name: 'Healthcare IT News', url: 'https://www.healthcareitnews.com/feed', category: 'healthcare_it', tier: 3, active: true },
  { name: 'Health Data Management', url: 'https://www.healthdatamanagement.com/feed', category: 'healthcare_it', tier: 3, active: true },
  { name: 'MobiHealthNews', url: 'https://www.mobihealthnews.com/feed', category: 'healthcare_it', tier: 3, active: true },
  { name: 'HIMSS News', url: 'https://www.himss.org/news/feed', category: 'healthcare_it', tier: 3, active: true },
  { name: 'FierceHealthcare', url: 'https://www.fiercehealthcare.com/rss/xml', category: 'healthcare_it', tier: 3, active: true },
  { name: 'Becker Hospital Review IT', url: 'https://www.beckershospitalreview.com/healthcare-information-technology.feed', category: 'healthcare_it', tier: 3, active: true },
  { name: 'Digital Health', url: 'https://www.digitalhealth.net/feed/', category: 'healthcare_it', tier: 3, active: true },

  // --- AI/ML ---
  { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss/', category: 'ai_ml', tier: 3, active: true },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', category: 'ai_ml', tier: 3, active: true },
  { name: 'Anthropic Blog', url: 'https://www.anthropic.com/blog/rss', category: 'ai_ml', tier: 3, active: true },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml', category: 'ai_ml', tier: 3, active: true },
  { name: 'AI News', url: 'https://www.artificialintelligence-news.com/feed/', category: 'ai_ml', tier: 3, active: true },
  { name: 'Import AI Newsletter', url: 'https://importai.substack.com/feed', category: 'ai_ml', tier: 3, active: true },
  { name: 'The Gradient', url: 'https://thegradient.pub/rss/', category: 'ai_ml', tier: 3, active: true },
  { name: 'Towards Data Science', url: 'https://towardsdatascience.com/feed', category: 'ai_ml', tier: 3, active: true },
  { name: 'Machine Learning Mastery', url: 'https://machinelearningmastery.com/feed/', category: 'ai_ml', tier: 3, active: true },
  { name: 'NVIDIA AI Blog', url: 'https://blogs.nvidia.com/feed/', category: 'ai_ml', tier: 3, filter: 'ai OR deep learning OR GPU', active: true },

  // --- SaaS ---
  { name: 'SaaStr', url: 'https://www.saastr.com/feed/', category: 'saas', tier: 3, active: true },
  { name: 'SaaS Weekly', url: 'https://saasweekly.com/feed/', category: 'saas', tier: 3, active: true },
  { name: 'ChartMogul Blog', url: 'https://chartmogul.com/blog/feed/', category: 'saas', tier: 3, active: true },
  { name: 'Tomasz Tunguz', url: 'https://tomtunguz.com/feed/', category: 'saas', tier: 3, active: true },
  { name: 'Jason Lemkin', url: 'https://jasonlemkin.com/feed/', category: 'saas', tier: 3, active: true },
  { name: 'OpenView Partners', url: 'https://openviewpartners.com/blog/feed/', category: 'saas', tier: 3, active: true },
  { name: 'ProfitWell Blog', url: 'https://www.profitwell.com/recur/feed', category: 'saas', tier: 3, active: true },

  // --- Enterprise Tech ---
  { name: 'CIO.com', url: 'https://www.cio.com/feed/', category: 'enterprise', tier: 3, active: true },
  { name: 'Computerworld', url: 'https://www.computerworld.com/feed/', category: 'enterprise', tier: 3, active: true },
  { name: 'InfoWorld', url: 'https://www.infoworld.com/feed/', category: 'enterprise', tier: 3, active: true },
  { name: 'eWeek', url: 'https://www.eweek.com/feed/', category: 'enterprise', tier: 3, active: true },
  { name: 'Enterprise Apps Today', url: 'https://www.enterpriseappstoday.com/feed', category: 'enterprise', tier: 3, active: true },
  { name: 'Diginomica', url: 'https://diginomica.com/feed', category: 'enterprise', tier: 3, active: true },
  { name: 'TechTarget CIO', url: 'https://www.techtarget.com/searchcio/rss/ContentSyndication.xml', category: 'enterprise', tier: 3, active: true },
  { name: 'Constellation Research Blog', url: 'https://www.constellationr.com/blog/feed', category: 'enterprise', tier: 3, active: true },

  // --- Hiring / Job Market Signals ---
  { name: 'Hacker News Hiring', url: 'https://hnrss.org/show?q=hiring', category: 'hiring', tier: 3, filter: 'hiring OR recruiting', active: true },
  { name: 'We Work Remotely', url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss', category: 'hiring', tier: 3, active: true },
  { name: 'Key Values Jobs', url: 'https://www.keyvalues.com/feed', category: 'hiring', tier: 3, active: true },
  { name: 'LinkedIn Talent Blog', url: 'https://www.linkedin.com/blog/talent/feed', category: 'hiring', tier: 3, active: true },
  { name: 'Indeed Hiring Lab', url: 'https://www.hiringlab.org/feed/', category: 'hiring', tier: 3, active: true },
  { name: 'Glassdoor Blog', url: 'https://www.glassdoor.com/blog/feed/', category: 'hiring', tier: 3, active: true },

  // --- Data / Analytics ---
  { name: 'Data Engineering Weekly', url: 'https://www.dataengineeringweekly.com/feed', category: 'data', tier: 3, active: true },
  { name: 'Snowflake Blog', url: 'https://www.snowflake.com/blog/feed/', category: 'data', tier: 3, active: true },
  { name: 'Databricks Blog', url: 'https://www.databricks.com/blog/feed', category: 'data', tier: 3, active: true },
  { name: 'dbt Blog', url: 'https://www.getdbt.com/blog/feed.xml', category: 'data', tier: 3, active: true },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 4: Aggregators, Blogs & Community
  // Early signals, community sentiment, opinion leaders
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Aggregators ---
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'aggregator', tier: 4, active: true },
  { name: 'Hacker News Best', url: 'https://hnrss.org/best', category: 'aggregator', tier: 4, active: true },
  { name: 'Lobsters', url: 'https://lobste.rs/rss', category: 'aggregator', tier: 4, active: true },
  { name: 'Slashdot', url: 'https://rss.slashdot.org/Slashdot/slashdotMain', category: 'aggregator', tier: 4, active: true },
  { name: 'Reddit r/technology', url: 'https://www.reddit.com/r/technology/.rss', category: 'aggregator', tier: 4, active: true },
  { name: 'Reddit r/SaaS', url: 'https://www.reddit.com/r/SaaS/.rss', category: 'aggregator', tier: 4, active: true },
  { name: 'Reddit r/startups', url: 'https://www.reddit.com/r/startups/.rss', category: 'aggregator', tier: 4, active: true },
  { name: 'Product Hunt', url: 'https://www.producthunt.com/feed', category: 'aggregator', tier: 4, active: true },

  // --- Analyst / Opinion Blogs ---
  { name: 'Benedict Evans', url: 'https://www.ben-evans.com/benedictevans?format=rss', category: 'blog', tier: 4, active: true },
  { name: 'Stratechery', url: 'https://stratechery.com/feed/', category: 'blog', tier: 4, active: true },
  { name: 'A16Z Blog', url: 'https://a16z.com/feed/', category: 'blog', tier: 4, active: true },
  { name: 'First Round Review', url: 'https://review.firstround.com/feed.xml', category: 'blog', tier: 4, active: true },
  { name: 'Sequoia Capital Blog', url: 'https://www.sequoiacap.com/feed/', category: 'blog', tier: 4, active: true },
  { name: 'Bessemer Cloud Index', url: 'https://www.bvp.com/bvp-nasdaq-emerging-cloud-index/feed', category: 'blog', tier: 4, active: true },
  { name: 'Paul Graham Essays', url: 'https://www.aaronsw.com/2002/feeds/pgessays.rss', category: 'blog', tier: 4, active: true },
  { name: 'Both Sides of the Table', url: 'https://bothsidesofthetable.com/feed', category: 'blog', tier: 4, active: true },
  { name: 'Lenny Newsletter', url: 'https://www.lennysnewsletter.com/feed', category: 'blog', tier: 4, active: true },
  { name: 'The Pragmatic Engineer', url: 'https://newsletter.pragmaticengineer.com/feed', category: 'blog', tier: 4, active: true },
  { name: 'Software Lead Weekly', url: 'https://softwareleadweekly.com/feed', category: 'blog', tier: 4, active: true },
  { name: 'CB Insights Research', url: 'https://www.cbinsights.com/research/feed/', category: 'blog', tier: 4, active: true },
  { name: 'Mattermark Daily', url: 'https://mattermark.com/feed/', category: 'blog', tier: 4, active: false },
  { name: 'Above the Crowd', url: 'https://abovethecrowd.com/feed/', category: 'blog', tier: 4, active: true },
  { name: 'Semicolon & Sons', url: 'https://www.semicolonandsons.com/feed.xml', category: 'blog', tier: 4, active: true },
];

/**
 * Get all feeds belonging to a specific tier.
 */
export function getFeedsByTier(tier: number): FeedSource[] {
  return FEED_REGISTRY.filter((feed) => feed.tier === tier);
}

/**
 * Get all feeds belonging to a specific category.
 */
export function getFeedsByCategory(category: string): FeedSource[] {
  return FEED_REGISTRY.filter(
    (feed) => feed.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get all active feeds (those not disabled by configuration).
 */
export function getActiveFeeds(): FeedSource[] {
  return FEED_REGISTRY.filter((feed) => feed.active);
}

/**
 * Get active feeds for a given tier.
 */
export function getActiveFeedsByTier(tier: number): FeedSource[] {
  return FEED_REGISTRY.filter((feed) => feed.tier === tier && feed.active);
}

/**
 * Get a summary count of feeds by tier and category.
 */
export function getFeedStats(): {
  total: number;
  active: number;
  byTier: Record<number, number>;
  byCategory: Record<string, number>;
} {
  const byTier: Record<number, number> = {};
  const byCategory: Record<string, number> = {};

  for (const feed of FEED_REGISTRY) {
    byTier[feed.tier] = (byTier[feed.tier] || 0) + 1;
    byCategory[feed.category] = (byCategory[feed.category] || 0) + 1;
  }

  return {
    total: FEED_REGISTRY.length,
    active: FEED_REGISTRY.filter((f) => f.active).length,
    byTier,
    byCategory,
  };
}
