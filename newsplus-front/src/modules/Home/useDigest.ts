// «اللي فاتك» data (S13 §3). The visit rule is decided once, when the home opens, from the previous visit
// (lastVisit.ts). The digest replaces the home's top while it loads or has stories; an error, an empty digest or
// going offline gives the regular home back.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { NewsFeedItem } from "@newsplus/shared";
import { getNewsDigest } from "@/services/breakingDigestService";
import type { DeskHandoffState } from "@/services/deskHandoff";
import { useCopyFeedback } from "@/modules/News/breaking/useCopyFeedback";
import { pinForBriefing } from "@/modules/News/wire/briefingPins";
import {
  digestLiveLine,
  digestMeta,
  digestRows,
  digestSince,
  digestTitle,
  DIGEST_STALE_MS,
  mobDigestMeta,
} from "./digest";

export function useDigest({
  lastVisit,
  online,
  items,
}: {
  lastVisit: number | null;
  online: boolean;
  items: readonly NewsFeedItem[];
}) {
  const navigate = useNavigate();
  const [opened] = useState(() => new Date());
  const [since] = useState(() => digestSince(lastVisit, opened));
  const sinceIso = since === null ? null : new Date(since).toISOString();

  const query = useQuery({
    queryKey: ["news-digest", sinceIso],
    queryFn: () => getNewsDigest({ since: sinceIso as string }),
    enabled: sinceIso !== null && online,
    staleTime: DIGEST_STALE_MS,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const { copied, copy } = useCopyFeedback<"summary">();

  const data = query.data ?? null;
  const shown = since !== null && online && !query.isError && !(data && data.items.length === 0);

  return {
    /** The visit rule holds and the digest is loading or has stories: NewDigest / MobNewDigest. */
    shown,
    loading: shown && !data,
    title: since === null ? "" : digestTitle(since, opened),
    meta: data ? digestMeta(data) : "",
    mobMeta: data ? mobDigestMeta(data) : "",
    /** Replaces the home's «… منذ آخر زيارة» while the digest shows. */
    live: data ? digestLiveLine(data) : null,
    rows: data ? digestRows(data, items) : [],
    /** «حدّث». */
    refresh: () => void query.refetch(),
    refreshing: query.isFetching && Boolean(data),
    /** «انسخ الملخص». */
    copied: copied === "summary",
    copySummary: () => {
      if (data) void copy("summary", data.summaryText);
    },
    /** «حوّله لموجز صباحي»: the digest's stories go first in the briefing, which the newsroom starts on arrival. */
    toBriefing: () => {
      if (!data) return;
      for (const entry of data.items) pinForBriefing(entry.itemId);
      navigate("/news", { state: { briefing: true } satisfies DeskHandoffState });
    },
  };
}

export type Digest = ReturnType<typeof useDigest>;
