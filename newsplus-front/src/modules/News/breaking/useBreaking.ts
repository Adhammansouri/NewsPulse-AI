// Breaking mode data (S13 §2): the three outputs of `POST /news/breaking`, regenerated when a new source joins the
// story while «تحديث تلقائي» is on; the copy buttons; and, behind `features.workflow`, the S15 presence that backs
// «نبّه الفريق إن الخبر اتغطى» and the teammate line of «التغطية لحد دلوقتي».
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { NewsBreakingData, NewsFeedItem } from "@newsplus/shared";
import { features } from "@/config/features";
import { PRESENCE_HEARTBEAT_MS, usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
import { useSession } from "@/hooks/useSession";
import { getBreakingOutputs } from "@/services/breakingDigestService";
import { getEditorialConversation } from "@/services/editorialService";
import { getPresence } from "@/services/presenceService";
import { formatCopy } from "../studio/formats";
import { coverage, firstPublishedAt, splitPost, teammateLine } from "./breakingModel";
import { useCopyFeedback } from "./useCopyFeedback";

export type BreakingOutput = "post" | "ticker" | "alert";

export function useBreaking(item: NewsFeedItem, { mobile }: { mobile: boolean }) {
  const sources = item.sources.length;
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [notifyTeam, setNotifyTeam] = useState(true);
  /** The source count the outputs were written for; it follows the item while «تحديث تلقائي» is on. */
  const [writtenFor, setWrittenFor] = useState(sources);
  if (autoUpdate && sources > writtenFor) setWrittenFor(sources);

  const outputs = useQuery({
    queryKey: ["news-breaking", item.id, writtenFor],
    // No abort signal: a cancelled request would still be billed, and StrictMode's remount would cancel it.
    queryFn: () => getBreakingOutputs({ itemId: item.id }),
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  /**
   * The outputs on screen. They stay while a new source is being written in (and if that update fails); `at`
   * changes when fresh outputs land, which remounts the panels so `arrive` plays again.
   */
  const [shown, setShown] = useState<{ itemId: string; data: NewsBreakingData; at: number } | null>(null);
  if (outputs.isSuccess && (shown?.itemId !== item.id || shown.at !== outputs.dataUpdatedAt)) {
    setShown({ itemId: item.id, data: outputs.data, at: outputs.dataUpdatedAt });
  }
  const current = shown?.itemId === item.id ? shown : null;

  const { copied, copy } = useCopyFeedback<BreakingOutput>();

  const team = features.workflow && !mobile;
  const session = useSession();
  usePresenceHeartbeat({ itemId: item.id, activity: "writing", enabled: team && notifyTeam });
  const presence = useQuery({
    queryKey: ["presence"],
    queryFn: ({ signal }) => getPresence(signal),
    refetchInterval: PRESENCE_HEARTBEAT_MS,
    staleTime: 0,
    retry: false,
    enabled: team,
  });
  const writing = (presence.data?.entries ?? []).filter(
    (entry) => entry.itemId === item.id && entry.activity === "writing" && entry.user.id !== session?.user.id,
  );
  const mate = writing.find((entry) => entry.conversationId) ?? writing[0];
  const mateDraft = useQuery({
    queryKey: ["editorial-conversation", mate?.conversationId],
    queryFn: () => getEditorialConversation(mate?.conversationId as string),
    enabled: team && Boolean(mate?.conversationId),
  });

  const data = current?.data ?? null;
  const firstAt = firstPublishedAt(item);
  return {
    firstAt,
    data,
    post: data ? splitPost(data.post) : null,
    /** First request (or its retry): no outputs yet. */
    loading: !data && (outputs.isPending || outputs.isFetching),
    error: !data && outputs.isError && !outputs.isFetching ? outputs.error : null,
    retry: () => void outputs.refetch(),
    generation: current?.at ?? 0,
    copied,
    copy,
    autoUpdate,
    setAutoUpdate,
    notifyTeam,
    setNotifyTeam,
    coverage: coverage(item, firstAt),
    // formatCopy's slide count only shapes the carousel hint, not the name used here.
    teammate:
      team && mate
        ? teammateLine(mate.user.displayName, mateDraft.data ? formatCopy(mateDraft.data.format, 0).name : null)
        : null,
  };
}

export type Breaking = ReturnType<typeof useBreaking>;
