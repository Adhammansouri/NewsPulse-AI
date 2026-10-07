export type OpenAIDataStatus = "ready" | "not-configured" | "unauthorized" | "unavailable" | "not-found" | "project-required";
export type OpenAISection<T> = { status: OpenAIDataStatus; data: T | null };
export type OpenAIUsageRow = {
  date: string;
  model: string | null;
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
};
export type OpenAICostRow = { date: string; lineItem: string; projectId: string | null; amount: number; currency: string };
export type OpenAISpendLimit = { amount: number; currency: string; enforcement: string };
export type OpenAIRateLimit = {
  model: string;
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsPerDay: number | null;
  imagesPerMinute: number | null;
  audioMegabytesPerMinute: number | null;
  batchTokensPerDay: number | null;
};
export type OpenAIUsageQuery = { start: string; end: string; project?: string };
export type OpenAIUsageData = {
  configured: boolean;
  fetchedAt: string;
  timezone: "UTC";
  range: { start: string; end: string };
  scope: { projectId: string | null };
  defaultProjectId: string | null;
  projects: OpenAISection<Array<{ id: string; name: string }>>;
  usage: Record<string, OpenAISection<OpenAIUsageRow[]>>;
  costs: OpenAISection<OpenAICostRow[]>;
  monthCosts: OpenAISection<OpenAICostRow[]>;
  organizationMonthCosts: OpenAISection<OpenAICostRow[]>;
  organizationLimit: OpenAISection<OpenAISpendLimit>;
  projectLimit: OpenAISection<OpenAISpendLimit>;
  rateLimits: OpenAISection<OpenAIRateLimit[]>;
};
