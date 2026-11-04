// Data of the home «مكتب اليوم» (S07), shared by DeskHome and MobHome. The queries reuse the keys and
// requests of the screens that own the data, so they share one cache entry: the wire's unfiltered feed
// (useNewsFeed) and drafts list (useWire), and the team memory (MorePage / the archive).
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { useNow } from "@/hooks/useNow";
import { useSession } from "@/hooks/useSession";
import { readDrafts } from "@/modules/Generate/generateDesk";
import { readDailyStats } from "@/services/dailyStats";
import { listEditorialConversations, listEditorialMemory } from "@/services/editorialService";
import {
  breakingStory,
  dateLine,
  greeting,
  liveLine,
  memoryCard,
  resumeItems,
  todayStats,
  topRows,
  TOP_ROWS_DESK,
  TOP_ROWS_MOB,
} from "./homeModel";
import { useLastVisit } from "./lastVisit";

export function useHome({ mobile }: { mobile: boolean }) {
  const session = useSession();
  const now = useNow();
  const lastVisit = useLastVisit();
  const [latestDraft] = useState(() => readDrafts()[0] ?? null);

  const feed = useNewsFeed();
  const conversations = useQuery({
    queryKey: ["editorial-conversations", ""],
    queryFn: () => listEditorialConversations(""),
  });
  const memory = useQuery({
    queryKey: ["editorial-memory"],
    queryFn: () => listEditorialMemory("approved"),
  });

  const items = useMemo(() => feed.data?.items ?? [], [feed.data]);
  const feedNow = Math.max(now.getTime(), feed.dataUpdatedAt);
  const breaking = useMemo(() => breakingStory(items, feedNow), [items, feedNow]);
  const rows = useMemo(
    () => topRows(items, feedNow, breaking?.id ?? null, mobile ? TOP_ROWS_MOB : TOP_ROWS_DESK),
    [items, feedNow, breaking, mobile],
  );
  const convs = conversations.data?.items;
  const resume = useMemo(() => resumeItems(convs ?? [], latestDraft, now), [convs, latestDraft, now]);

  return {
    date: dateLine(now, !mobile),
    greeting: greeting(now, session?.user.displayName ?? ""),
    live: liveLine(items, lastVisit),
    /** First load of the wire or the drafts: DeskHome-loading / MobHome-loading (the compose stays usable). */
    loading: feed.isPending || conversations.isPending,
    breaking,
    rows,
    resume,
    /** Needs the conversations; hidden when they could not be read. */
    stats: convs ? todayStats(convs, readDailyStats(now), now) : null,
    memory: memoryCard(memory.data?.rules ?? []),
  };
}

export type Home = ReturnType<typeof useHome>;
