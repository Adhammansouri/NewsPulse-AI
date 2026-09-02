export type NewsLanguage = "ar" | "en";

export type NewsSource = {
  id: string;
  name: string;
  language: NewsLanguage;
};

export type NewsFeedSourceLink = {
  id: string;
  name: string;
  url: string;
};

export type NewsFeedItem = {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  breaking: boolean;
  sources: NewsFeedSourceLink[];
};

export type NewsSourcesData = {
  sources: NewsSource[];
};

export type NewsFeedData = {
  fetchedAt: string;
  items: NewsFeedItem[];
};

export type NewsStoryFormat = "desk" | "bulletin" | "facts" | "context" | "social";
export type NewsSummaryFormat = NewsStoryFormat | "briefing";

export type NewsSummarizeRequest = {
  input?: string;
  itemId?: string;
  briefing?: boolean;
  format?: NewsStoryFormat;
  language?: NewsLanguage;
};

export type NewsSummarySource = {
  name: string;
  url: string;
};

export type NewsSummarizeData = {
  title: string;
  dek: string;
  summary: string;
  bullets: string[];
  sources: NewsSummarySource[];
  language: NewsLanguage;
  format: NewsSummaryFormat;
};
