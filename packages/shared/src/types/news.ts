export type NewsLanguage = "ar" | "en";

export const NEWS_TOPICS = [
  "politics",
  "economy",
  "health",
  "sports",
  "tech",
  "science",
  "culture",
  "other",
] as const;

export type NewsTopic = (typeof NEWS_TOPICS)[number];

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
  topic: NewsTopic;
  sources: NewsFeedSourceLink[];
};

export type NewsSourcesData = {
  sources: NewsSource[];
};

export type NewsFeedData = {
  fetchedAt: string;
  items: NewsFeedItem[];
};

export type NewsStoryFormat = "desk" | "bulletin" | "facts" | "context" | "social" | "video" | "carousel";
export type NewsSummaryFormat = NewsStoryFormat | "briefing";

export type CarouselStyle = "cinematic" | "frame";
export type CarouselDensity = "headline" | "banner" | "line";
export type CarouselArc = "dispute" | "statement" | "sequence";
export type CarouselSlideRole =
  | "hook"
  | "counter"
  | "evidence"
  | "stake"
  | "quote"
  | "scope"
  | "means"
  | "condition"
  | "beat"
  | "closer";
export type CarouselSlideStatus = "pending" | "ready" | "mismatch" | "failed";

export type CarouselOptions = {
  slides: number;
  style: CarouselStyle;
  density: CarouselDensity;
  mark: boolean;
};

export type CarouselSlide = {
  index: number;
  role: CarouselSlideRole;
  headline: string;
  banner: string;
  attribution: string;
  scene: string;
  status: CarouselSlideStatus;
  assetId?: string;
  mismatch?: string;
};

export type CarouselPayload = {
  style: CarouselStyle;
  density: CarouselDensity;
  mark: boolean;
  arc: CarouselArc;
  styleLock: string;
  slides: CarouselSlide[];
};

export type NewsSummarizeRequest = {
  input?: string;
  itemId?: string;
  briefing?: boolean;
  /** Briefing only (ignored otherwise): up to 8 pinned feed item ids, placed first in this order. */
  itemIds?: string[];
  format?: NewsStoryFormat;
  language?: NewsLanguage;
  carousel?: CarouselOptions;
};

export type CarouselRenderRequest = {
  conversationId: string;
  versionId: string;
  index: number;
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
  carousel?: CarouselPayload;
  conversationId?: string;
  versionId?: string;
  versionNumber?: number;
};

export type EditorialMemoryStatus = "pending" | "approved" | "rejected" | "disabled";

export type EditorialMemoryCandidate = {
  instruction: string;
  rationale: string;
};

export type EditorialMemoryRule = EditorialMemoryCandidate & {
  id: string;
  status: EditorialMemoryStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  sourceConversationId?: string;
};

export type EditorialMessageRole = "user" | "assistant" | "system";

export type EditorialMessage = {
  id: string;
  conversationId: string;
  role: EditorialMessageRole;
  content: string;
  versionId?: string;
  createdAt: string;
  createdBy: string;
};

export type EditorialVersion = {
  id: string;
  conversationId: string;
  number: number;
  copy: NewsSummarizeData;
  note: string;
  createdAt: string;
  createdBy: string;
};

export type EditorialConversationSummary = {
  id: string;
  title: string;
  format: NewsSummaryFormat;
  language: NewsLanguage;
  itemId?: string;
  sourceLabel?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  versionCount: number;
};

export type EditorialConversationDetail = EditorialConversationSummary & {
  sourcePacket: string;
  currentVersionId: string;
  copy: NewsSummarizeData;
  versions: EditorialVersion[];
  messages: EditorialMessage[];
  pendingMemory: EditorialMemoryRule[];
};

export type EditorialConversationListData = {
  items: EditorialConversationSummary[];
};

export type EditorialReviseRequest = {
  instruction: string;
};

export type EditorialRestoreRequest = {
  versionId: string;
};

export type EditorialReviseData = {
  copy: NewsSummarizeData;
  conversation: EditorialConversationDetail;
  note: string;
  memoryCandidate?: EditorialMemoryCandidate;
};

export type EditorialMemoryListData = {
  rules: EditorialMemoryRule[];
};

export type EditorialMemoryUpdateRequest = {
  status?: Exclude<EditorialMemoryStatus, "pending">;
  instruction?: string;
};
