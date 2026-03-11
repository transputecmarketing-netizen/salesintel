import { cn } from "@/lib/utils";
import {
  Linkedin,
  FileText,
  Mic,
  Headphones,
  Twitter,
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  Share2,
} from "lucide-react";
import type { ActivityItem } from "@/types/contact";

interface RecentActivityProps {
  activities?: ActivityItem[];
  className?: string;
}

const mockActivities: ActivityItem[] = [
  {
    type: "linkedin_post",
    content:
      "Excited to announce we've expanded our engineering team by 40%. The future of B2B intelligence is here.",
    date: "2025-12-09",
    url: "https://linkedin.com/posts/example",
    engagement: { likes: 234, comments: 45, shares: 12 },
  },
  {
    type: "article",
    content: "How We Scaled Our Platform to Handle 10x Traffic in 6 Months",
    date: "2025-12-05",
    url: "https://blog.example.com/scaling",
    engagement: { likes: 156, comments: 23, shares: 45 },
  },
  {
    type: "talk",
    content: "Keynote at SaaStr Annual: The Next Wave of Developer Tools",
    date: "2025-11-28",
    url: null,
  },
  {
    type: "podcast",
    content: "Guest on 'Scale or Die' discussing infrastructure automation",
    date: "2025-11-15",
    url: "https://podcast.example.com/ep42",
  },
  {
    type: "tweet",
    content:
      "Hot take: The best developer tools are the ones you forget exist because they just work.",
    date: "2025-11-10",
    url: "https://twitter.com/example/status/123",
    engagement: { likes: 89, comments: 15, shares: 8 },
  },
];

const typeIcons: Record<string, React.ElementType> = {
  linkedin_post: Linkedin,
  article: FileText,
  talk: Mic,
  podcast: Headphones,
  tweet: Twitter,
};

const typeLabels: Record<string, string> = {
  linkedin_post: "LinkedIn",
  article: "Article",
  talk: "Talk",
  podcast: "Podcast",
  tweet: "Tweet",
};

export default function RecentActivity({ activities, className }: RecentActivityProps) {
  const items = activities?.length ? activities : mockActivities;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Activity</h3>

      <div className="space-y-2">
        {items.map((item, i) => {
          const Icon = typeIcons[item.type] ?? FileText;
          return (
            <div
              key={i}
              className="p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded bg-[var(--bg-tertiary)] shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
                      {typeLabels[item.type] ?? item.type}
                    </span>
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed line-clamp-2">
                    {item.content}
                  </p>

                  {item.engagement && (
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {item.engagement.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {item.engagement.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        {item.engagement.shares}
                      </span>
                    </div>
                  )}
                </div>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
