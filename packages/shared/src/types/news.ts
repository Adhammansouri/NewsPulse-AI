import type {
  EditorialConversationScope,
  EditorialPublishPlatform,
  EditorialWorkflowStatus,
  TeamMemberRef,
} from "./workflow.js";

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
  /**
   * S14: the editor's standing choices for this story (a source conflict settled: «اعتمد ٢٫٩٪», or «اذكر الرقمين
   * بالإسناد»), injected into the prompt as editor constraints. At most 6, each at most 300 characters.
   */
  constraints?: string[];
};

/** S14 `GET /news/items/:id/timeline` — what each snapshot of the story added. */
export type TimelineTag = "first" | "number" | "quote" | "reaction" | "update";

/** One snapshot of the story: a source joined it, or a source's headline / excerpt changed. */
export type TimelineEntry = {
  sourceId: string;
  /** ISO time the source published (or changed) it. */
  at: string;
  headline: string;
  tag: TimelineTag;
  /** Arrived in the last few minutes (the teal dot). */
  isNew: boolean;
};

/** Two or more sources disagree on a figure; `safeWording` is what the editor writes until one is chosen. */
export type SourceConflict = {
  field: string;
  values: { sourceId: string; value: string }[];
  safeWording: string;
};

export type TimelineData = {
  /** Oldest first. */
  entries: TimelineEntry[];
  conflicts: SourceConflict[];
  /** «اللي متفق عليه»: a fact and how many sources carry it. */
  agreed: { text: string; sourceCount: number }[];
  /** How many sources carry the story («مؤكد من ٤ مصادر»). */
  confirmedBy: number;
};

/** S13 `POST /news/breaking`: three short breaking-news outputs for one feed item. */
export type NewsBreakingRequest = {
  itemId: string;
};

export type NewsBreakingData = {
  /** X post: starts with «عاجل |», at most 280 characters (hashtags included). */
  post: string;
  /** News ticker: one line starting with «عاجل:». */
  ticker: string;
  /** Follower push alert: at most 80 characters. */
  alert: string;
  /** How long the editor took to write the three outputs. */
  ms: number;
};

/** S13 `POST /news/digest`: «اللي فاتك» since the editor's previous visit (cached 10 minutes per `since` hour). */
export type NewsDigestRequest = {
  /** ISO 8601 time of the previous visit. */
  since: string;
};

export type NewsDigestItem = {
  itemId: string;
  title: string;
  /** Short label: «الأهم اقتصادياً», «الأكثر تحديثاً», «متوقع يتفاعل عليه الجمهور». */
  reason: string;
};

export type NewsDigestData = {
  /** The top three stories (fewer when fewer arrived), most important first. */
  items: NewsDigestItem[];
  /** Plain-text summary of those stories, ready to paste. */
  summaryText: string;
  /** Headlines published since the `since` hour that the digest was written from. */
  sourceCount: number;
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
  /** S15 workflow column. Rows created before S15 are migrated to `draft`. */
  status: EditorialWorkflowStatus;
  /** Defaults to the creator. */
  assigneeId: string;
  publishedPlatforms: EditorialPublishPlatform[];
  /** Always 0 until comments exist. */
  commentCount: number;
  /** The assignee as a team member — set by the list and update endpoints; absent when the user is unknown. */
  assignee?: TeamMemberRef;
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
  /**
   * Totals per workflow status for the same `q` + `scope` (ignoring `status` and the 50-item page).
   * Present only when the request passed `scope` or `status`.
   */
  counts?: Record<EditorialWorkflowStatus, number>;
};

/** `GET /editorial/conversations` query. Without `scope`/`status` the result is the pre-S15 list. */
export type EditorialConversationListQuery = {
  q?: string;
  scope?: EditorialConversationScope;
  status?: EditorialWorkflowStatus;
};

/** `PATCH /editorial/conversations/:id` — any team member; at least one field. Responds with the summary. */
export type EditorialConversationUpdateRequest = {
  status?: EditorialWorkflowStatus;
  assigneeId?: string;
  publishedPlatforms?: EditorialPublishPlatform[];
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
  /** `pending` only undoes an approval (S10 «تراجع»); the API refuses it for rejected / disabled rules. */
  status?: EditorialMemoryStatus;
  instruction?: string;
};
