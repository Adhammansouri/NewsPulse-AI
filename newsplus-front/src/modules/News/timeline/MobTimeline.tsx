// MobNewTimeline: the story screen's «تطور القصة» and «المصادر» tabs — the m-bar (back, «الخبر», «٤ مصادر»), the
// tabs, the conflict cards, the timeline panel («٤ تحديثات في ١٢ دقيقة» + «مباشر») and «اكتب من القصة كاملة» in
// the `m-cta`. Inline styles are the board's own.
import { useMemo, type MouseEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { NewsFeedItem, TimelineData } from "@newsplus/shared";
import { useAiCooldown } from "@/hooks/useAiCooldown";
import { getNewsSources } from "@/services/newsService";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Skeleton } from "@/ui/Skeleton";
import { SourceMark } from "@/ui/SourceMarks";
import { M_CTA_STYLE } from "../studio/MobStory";
import { STUDIO_COPY } from "../studio/formats";
import { StudioError } from "../studio/StudioError";
import { MobConflictCard } from "./ConflictCard";
import { TIMELINE_COPY } from "./copy";
import { SourcesPanel } from "./SourcesPanel";
import { ConfirmedBadge } from "./StoryTabs";
import { conflictViews, sourceLookup, sourceRows, timelineView, type SourceLookup, type StoryTab } from "./timelineModel";
import { useStoryTimeline } from "./useStoryTimeline";

const ITEM_STYLE = { gridTemplateColumns: "52px 1fr" } as const;
const HEADLINE_STYLE = { marginTop: "4px", fontWeight: 600, fontSize: "14.5px", lineHeight: 1.6 } as const;

/** MobNewTimeline's m-bar: back to the list, «الخبر», and how many sources carry the story. */
export function MobTimelineBar({ backHref, onBack, confirmedBy }: { backHref: string; onBack: () => void; confirmedBy: number }) {
  return (
    <header className="m-bar">
      <a
        className="icon-btn"
        href={backHref}
        aria-label={STUDIO_COPY.back}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          onBack();
        }}
      >
        <Icon name="arrow-back" />
      </a>
      <span className="m-bar__title">{TIMELINE_COPY.tabStory}</span>
      <ConfirmedBadge count={confirmedBy} mobile />
    </header>
  );
}

export function MobTimeline({
  itemId,
  tabs,
  data,
  error,
  onRetry,
  lookup,
  onWrite,
}: {
  itemId: string;
  tabs: ReactNode;
  data: TimelineData | undefined;
  error: unknown;
  onRetry: () => void;
  lookup: SourceLookup;
  onWrite: () => void;
}) {
  const cooldown = useAiCooldown();
  const view = data ? timelineView(data, lookup) : null;
  return (
    <>
      <main className="m-scroll col" style={{ padding: "14px 16px", gap: "14px" }}>
        {tabs}
        {!data && error ? <StudioError error={error} onRetry={onRetry} /> : null}
        {!data && !error && (
          <section className="panel col" style={{ padding: "16px", gap: "12px" }} aria-busy="true">
            <Skeleton height="14px" width="50%" />
            {[0, 1, 2].map((row) => (
              <div key={row} className="col" style={{ gap: "8px", marginTop: "6px" }}>
                <Skeleton height="12px" width="40%" />
                <Skeleton height="14px" width="85%" />
              </div>
            ))}
          </section>
        )}
        {data &&
          conflictViews(data, lookup).map((conflict) => (
            <MobConflictCard key={`${itemId}-${conflict.key}`} itemId={itemId} view={conflict} />
          ))}
        {view && view.rows.length > 0 && (
          <section className="panel col" style={{ padding: "16px", gap: "12px" }} aria-label={TIMELINE_COPY.panelLabel}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <b style={{ fontWeight: 600 }}>{view.metaMob}</b>
              <span className="live">{TIMELINE_COPY.live}</span>
            </div>
            <div className="tl">
              {view.rows.map((row) => (
                <div key={row.key} className={`tl__item ${row.dot}`} style={ITEM_STYLE}>
                  <span className="tl__time">{row.time}</span>
                  <div className="tl__body">
                    <span className="tl__dot" />
                    <div className="row" style={{ gap: "6px" }}>
                      <SourceMark ch={row.source.mark.ch} bg={row.source.mark.bg} />
                      <span className="t-meta" style={{ fontWeight: 600 }}>
                        {row.metaMob}
                      </span>
                    </div>
                    <p style={HEADLINE_STYLE}>{row.headline}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <div className="m-cta" style={M_CTA_STYLE}>
        <Button variant="ai" block size="lg" disabled={cooldown.active} onClick={onWrite}>
          <Icon name="sparkle" size="sm" />
          {TIMELINE_COPY.writeFullStory}
        </Button>
      </div>
    </>
  );
}

/** The story screen on its «تطور القصة» / «المصادر» tab (NewsStoryPage): MobNewTimeline's bar, then the tab. */
export function MobTimelineScreen({
  item,
  tab,
  tabs,
  backHref,
  onBack,
  onWrite,
}: {
  item: NewsFeedItem;
  tab: Exclude<StoryTab, "story">;
  tabs: ReactNode;
  backHref: string;
  onBack: () => void;
  onWrite: () => void;
}) {
  const timeline = useStoryTimeline(item.id, tab === "timeline");
  const sourcesQuery = useQuery({ queryKey: ["news-sources"], queryFn: getNewsSources });
  const lookup = useMemo(() => sourceLookup(item, sourcesQuery.data?.sources ?? []), [item, sourcesQuery.data]);
  return (
    <>
      <MobTimelineBar backHref={backHref} onBack={onBack} confirmedBy={timeline.data?.confirmedBy ?? item.sources.length} />
      {tab === "timeline" ? (
        <MobTimeline
          itemId={item.id}
          tabs={tabs}
          data={timeline.data}
          error={timeline.error}
          onRetry={timeline.refetch}
          lookup={lookup}
          onWrite={onWrite}
        />
      ) : (
        <main className="m-scroll col" style={{ padding: "14px 16px", gap: "14px" }}>
          {tabs}
          <SourcesPanel rows={sourceRows(item, timeline.data?.entries ?? [], lookup)} mobile />
        </main>
      )}
    </>
  );
}
