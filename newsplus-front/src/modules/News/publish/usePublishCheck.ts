// S12 «فحص قبل النشر» for the draft on screen: `POST /editorial/conversations/:id/check` per version and platform
// (the API caches both; only a new version calls the model). A fix sends its instruction to the existing revise
// endpoint → a new version → its own check. While the next check loads, the previous rows stay (aria-busy) and
// their fixes are disabled.
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PublishCheck } from "@newsplus/shared";
import { checkEditorialPublish } from "@/services/publishCheckService";
import type { EditorialDesk } from "../studio/useEditorialDesk";
import { checkSummary, fixAllInstruction, fixableChecks, mainIssue, type Platform } from "./publishModel";

export function usePublishCheck(desk: EditorialDesk, platform: Platform) {
  const conversationId = desk.conversationId;
  const versionId = desk.detail?.currentVersionId ?? desk.summary?.versionId ?? null;
  const query = useQuery({
    queryKey: ["publish-check", conversationId, versionId, platform],
    queryFn: ({ signal }) => checkEditorialPublish(conversationId as string, { platform }, signal),
    enabled: Boolean(conversationId && versionId),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: false,
  });

  const checks = query.data?.checks ?? [];
  /** The rows on screen belong to another version or platform (the next check is loading). */
  const stale = query.isPlaceholderData;
  const canFix = !desk.busy && !stale && !query.isFetching;

  return {
    checks,
    /** First load: no rows yet. */
    loading: query.isPending && query.fetchStatus !== "idle",
    busy: query.isFetching || desk.revising,
    error: query.data ? null : query.error,
    retry: () => void query.refetch(),
    stale,
    summary: checkSummary(checks),
    mainIssue: mainIssue(checks),
    hasFixes: fixableChecks(checks).length > 0,
    allOk: checks.length > 0 && !stale && checks.every((check) => check.status === "ok"),
    canFix,
    fix(check: PublishCheck) {
      if (canFix && check.fix) desk.revise(check.fix.instruction);
    },
    fixAll() {
      const instruction = fixAllInstruction(checks);
      if (canFix && instruction) desk.revise(instruction);
    },
  };
}

export type PublishCheckState = ReturnType<typeof usePublishCheck>;
