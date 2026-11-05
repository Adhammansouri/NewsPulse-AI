// The desktop studio's story with its S14 tabs (NewTimeline): «الخبر» is the S05 story view (its meta row gets the
// «تطور القصة · ٤ تحديثات» chip, which opens the timeline), «تطور القصة» is DeskTimeline, «المصادر» the source links.
import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { NewsFeedItem } from "@newsplus/shared";
import { features } from "@/config/features";
import { getNewsSources } from "@/services/newsService";
import type { EditorialDesk } from "../studio/useEditorialDesk";
import { DeskTimeline, type DraftUpdate } from "./DeskTimeline";
import { SourcesPanel } from "./SourcesPanel";
import { DeskStoryTabs, TimelineChip } from "./StoryTabs";
import { entryAfter, sourceLookup, sourceRows, updateInstruction } from "./timelineModel";
import { useMyStoryDraft, useStoryTimeline } from "./useStoryTimeline";
import { useStoryTab } from "./useStoryTab";

const SOURCES_AREA = { padding: "18px 30px", overflowY: "auto", minHeight: 0 } as const;

export function DeskStoryArea({
  desk,
  item,
  title,
  onUpdateDraft,
  story,
}: {
  desk: EditorialDesk;
  item: NewsFeedItem;
  title: string;
  /** «حدّث المسودة»: open the draft and send the revision (usePendingRevision). */
  onUpdateDraft: (conversationId: string, instruction: string) => void;
  /** The S05 story view; `chip` goes in the story's meta row. */
  story: (chip: ReactNode) => ReactNode;
}) {
  const [tab, setTab] = useStoryTab(item.id);
  const timeline = useStoryTimeline(item.id, tab === "timeline");
  const sourcesQuery = useQuery({ queryKey: ["news-sources"], queryFn: getNewsSources, enabled: features.timeline });
  const lookup = useMemo(() => sourceLookup(item, sourcesQuery.data?.sources ?? []), [item, sourcesQuery.data]);
  const draft = useMyStoryDraft(item.id, tab === "timeline");

  if (!features.timeline) return <>{story(null)}</>;

  const data = timeline.data;
  const bar = (
    <DeskStoryTabs tab={tab} onTab={setTab} count={data ? data.entries.length : null} confirmedBy={data?.confirmedBy ?? item.sources.length} />
  );

  if (tab === "story") {
    return (
      <>
        {bar}
        {story(data ? <TimelineChip count={data.entries.length} onOpen={() => setTab("timeline")} /> : null)}
      </>
    );
  }

  if (tab === "sources") {
    return (
      <>
        {bar}
        <div className="grow" style={SOURCES_AREA}>
          <SourcesPanel rows={sourceRows(item, data?.entries ?? [], lookup)} mobile={false} />
        </div>
      </>
    );
  }

  const newer = data && draft ? entryAfter(data.entries, draft.updatedAt) : null;
  const draftUpdate: DraftUpdate | null =
    draft && newer
      ? {
          source: lookup(newer.sourceId).name,
          draftAt: draft.updatedAt,
          onUpdate: () => onUpdateDraft(draft.id, updateInstruction(newer, lookup(newer.sourceId).name)),
        }
      : null;
  return (
    <>
      {bar}
      <DeskTimeline
        itemId={item.id}
        title={title}
        data={data}
        error={timeline.error}
        onRetry={timeline.refetch}
        lookup={lookup}
        draftUpdate={draftUpdate}
        onWrite={desk.generateSummary}
      />
    </>
  );
}
