// «تطور القصة» data, polled while on screen (the wire refreshes every 2 minutes, so a new snapshot can only arrive
// that often): the full timeline on the timeline tab; elsewhere the counts only (`analyze: false`, which never
// spends the AI budget), or the full one when it is already in the cache. Plus, for «حدّث المسودة», the editor's
// own newest draft of the story.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { EditorialConversationSummary, TimelineData } from "@newsplus/shared";
import { features } from "@/config/features";
import { listEditorialConversationsBy } from "@/services/editorialService";
import { getStoryTimeline } from "./timelineApi";

const TIMELINE_REFRESH_MS = 2 * 60_000;

export function storyTimelineKey(itemId: string, analyze: boolean) {
  return ["story-timeline", itemId, analyze ? "full" : "counts"] as const;
}

/** `full`: the timeline tab (tags, conflicts, agreed facts). Otherwise the counts, never calling the model. */
export function useStoryTimeline(itemId: string | null | undefined, full: boolean) {
  const queryClient = useQueryClient();
  const id = itemId ?? "";
  const enabled = features.timeline && Boolean(itemId);
  const fullQuery = useQuery({
    queryKey: storyTimelineKey(id, true),
    queryFn: ({ signal }) => getStoryTimeline(id, { analyze: true, signal }),
    enabled: enabled && full,
    staleTime: TIMELINE_REFRESH_MS / 2,
    refetchInterval: TIMELINE_REFRESH_MS,
    retry: false,
  });
  const countsQuery = useQuery({
    queryKey: storyTimelineKey(id, false),
    queryFn: ({ signal }) => getStoryTimeline(id, { analyze: false, signal }),
    enabled: enabled && !full,
    staleTime: TIMELINE_REFRESH_MS / 2,
    refetchInterval: TIMELINE_REFRESH_MS,
    retry: false,
  });
  const cachedFull = queryClient.getQueryData<TimelineData>(storyTimelineKey(id, true));
  const query = full ? fullQuery : countsQuery;
  return {
    data: full ? fullQuery.data : (countsQuery.data ?? cachedFull),
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

/** The editor's newest draft of this story (`scope=mine`), or null. */
export function useMyStoryDraft(itemId: string | null | undefined, enabled: boolean): EditorialConversationSummary | null {
  const query = useQuery({
    queryKey: ["editorial-conversations", "mine", "timeline"],
    queryFn: ({ signal }) => listEditorialConversationsBy({ scope: "mine" }, signal),
    enabled: features.timeline && enabled && Boolean(itemId),
  });
  const drafts = (query.data?.items ?? []).filter((conversation) => conversation.itemId === itemId);
  return drafts.reduce<EditorialConversationSummary | null>(
    (newest, conversation) => (!newest || conversation.updatedAt > newest.updatedAt ? conversation : newest),
    null,
  );
}
