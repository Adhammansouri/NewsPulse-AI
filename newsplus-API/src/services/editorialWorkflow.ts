import type { EditorialPublishPlatform, EditorialWorkflowStatus } from "@newsplus/shared";

// Runtime copies of the shared S15 unions (the built API only imports types from @newsplus/shared,
// as with services/newsTopics.ts). `satisfies` keeps them in step with packages/shared/src/types/workflow.ts.
export const WORKFLOW_STATUSES = ["draft", "review", "ready", "published"] as const satisfies readonly EditorialWorkflowStatus[];
export const PUBLISH_PLATFORMS = [
  "x",
  "instagram",
  "facebook",
  "telegram",
  "tiktok",
] as const satisfies readonly EditorialPublishPlatform[];

export const DEFAULT_WORKFLOW_STATUS: EditorialWorkflowStatus = "draft";

export function isWorkflowStatus(value: unknown): value is EditorialWorkflowStatus {
  return typeof value === "string" && (WORKFLOW_STATUSES as readonly string[]).includes(value);
}

export function isPublishPlatform(value: unknown): value is EditorialPublishPlatform {
  return typeof value === "string" && (PUBLISH_PLATFORMS as readonly string[]).includes(value);
}

/** Board column names (NewBoard `kcol` labels), used in the system message of a move. */
const COLUMN_NAME: Record<EditorialWorkflowStatus, string> = {
  draft: "مسودة",
  review: "مراجعة",
  ready: "جاهز",
  published: "اتنشر",
};

/** The thread's system line when a draft changes column: «نقلتها سارة لمراجعة» (S15 §1). */
export function moveMessage(actorName: string, status: EditorialWorkflowStatus): string {
  return `نقلتها ${actorName} ل${COLUMN_NAME[status]}`;
}
