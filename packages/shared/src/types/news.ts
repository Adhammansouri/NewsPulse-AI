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

export type NewsStoryFormat = "desk" | "bulletin" | "facts" | "context" | "social" | "video";
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
