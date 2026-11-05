// The story's tabs «الخبر | تطور القصة · {n} | المصادر» — NewTimeline (desktop: `seg[role=tablist]` + «مؤكد من …»)
// and MobNewTimeline (`seg seg--block`). Inline styles are the boards' own.
import type { ReactNode } from "react";
import { Icon } from "@/ui/Icon";
import { TIMELINE_COPY } from "./copy";
import type { StoryTab } from "./timelineModel";

const TABS: readonly StoryTab[] = ["story", "timeline", "sources"];

function tabLabel(tab: StoryTab, count: number | null, mobile: boolean): string {
  if (tab === "story") return TIMELINE_COPY.tabStory;
  if (tab === "sources") return TIMELINE_COPY.tabSources;
  return !mobile && count !== null && count > 0 ? TIMELINE_COPY.tabTimelineCount(count) : TIMELINE_COPY.tabTimeline;
}

/** `badge badge--ok`: «مؤكد من ٤ مصادر» (desktop) / «٤ مصادر» (mobile m-bar). */
export function ConfirmedBadge({ count, mobile }: { count: number; mobile: boolean }) {
  if (count < 1) return null;
  return (
    <span className="badge badge--ok">
      <Icon name="check" size="sm" />
      {mobile ? TIMELINE_COPY.confirmedByMob(count) : TIMELINE_COPY.confirmedBy(count)}
    </span>
  );
}

/** NewTimeline's top row: the tabs, then the confirmation badge at the far end. */
export function DeskStoryTabs({
  tab,
  onTab,
  count,
  confirmedBy,
}: {
  tab: StoryTab;
  onTab: (tab: StoryTab) => void;
  /** Timeline entries, once loaded. */
  count: number | null;
  confirmedBy: number;
}) {
  return (
    <div className="row" style={{ padding: "14px 30px 0", gap: "6px" }}>
      <div className="seg" role="tablist">
        {TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-pressed={tab === value}
            aria-selected={tab === value}
            onClick={() => onTab(value)}
          >
            {tabLabel(value, count, false)}
          </button>
        ))}
      </div>
      <span className="grow" />
      <ConfirmedBadge count={confirmedBy} mobile={false} />
    </div>
  );
}

/** MobNewTimeline: `seg seg--block`, first in the screen's scroll. */
export function MobStoryTabs({ tab, onTab }: { tab: StoryTab; onTab: (tab: StoryTab) => void }) {
  return (
    <div className="seg seg--block">
      {TABS.map((value) => (
        <button key={value} type="button" aria-pressed={tab === value} onClick={() => onTab(value)}>
          {tabLabel(value, null, true)}
        </button>
      ))}
    </div>
  );
}

/** S05 Main: the story meta's «تطور القصة · ٤ تحديثات» (`chip chip--sm chip--ai`), which opens the timeline tab. */
export function TimelineChip({ count, onOpen }: { count: number; onOpen: () => void }): ReactNode {
  if (count < 1) return null;
  return (
    <button className="chip chip--sm chip--ai" type="button" onClick={onOpen}>
      {TIMELINE_COPY.storyChip(count)}
    </button>
  );
}
