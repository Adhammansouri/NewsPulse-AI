// The desktop studio (Main, studio area): the story with its formats and footer (idle), «المحرّر يكتب»
// (Main-generating), or the draft (S06: DeskDraft; the carousel is DeskCarousel). Inline styles are the board's own.
import type { NewsFeedItem } from "@newsplus/shared";
import type { SourceLanguages } from "../wire/filters";
import { DeskStoryArea } from "../timeline/DeskStoryArea";
import { usePendingRevision } from "../timeline/usePendingRevision";
import { deskSteps, footerHint, formatCopy } from "./formats";
import { DeskCarousel } from "./carousel/DeskCarousel";
import { DeskDraft } from "./draft/DeskDraft";
import { DuplicateWorkNotice } from "./DuplicateWorkNotice";
import { FormatDeck } from "./FormatDeck";
import { StoryPanel } from "./StoryPanel";
import { StudioEmpty, StudioLoading } from "./StudioStates";
import { StudioError } from "./StudioError";
import { StudioFooter } from "./StudioFooter";
import { StudioGenerating } from "./StudioGenerating";
import { storyModel } from "./storyModel";
import type { EditorialDesk } from "./useEditorialDesk";
import { useStudioPresence } from "./useStudioPresence";

/** Space under the failed-generation notice: the board's gap above «ماذا ننشر؟». */
const NOTICE_STYLE = { marginBottom: "24px" } as const;
/** The duplicate-work notice (S15 §4) between the story and the deck: the same 24px gap as above «ماذا ننشر؟». */
const DECK_NOTICE_STYLE = { marginTop: "24px" } as const;

export function DeskStudio({
  desk,
  selected,
  languages,
  wireLoading,
}: {
  desk: EditorialDesk;
  selected: NewsFeedItem | null;
  languages: SourceLanguages;
  /** The headlines' first load (Main-loading). */
  wireLoading: boolean;
}) {
  const story = selected ? storyModel(selected, languages, false) : null;
  useStudioPresence(desk, selected);
  /** S14 «حدّث المسودة»: the revision waits here while the timeline gives way to the draft. */
  const updateDraft = usePendingRevision(desk);

  if (desk.showEditorial) {
    if (desk.resultFormat === "carousel" && desk.summary) return <DeskCarousel desk={desk} storyTitle={story?.title ?? null} />;
    return <DeskDraft desk={desk} />;
  }

  if (desk.generating && desk.runFormat) {
    const copy = formatCopy(desk.runFormat, desk.runSlides);
    return (
      <StudioGenerating
        format={desk.runFormat}
        name={copy.name}
        steps={deskSteps(desk.runFormat, story?.sourceCount ?? 0, desk.runSlides)}
        startedAt={desk.runStartedAt ?? Date.now()}
        storyTitle={story?.title ?? null}
        onCancel={desk.cancelRun}
      />
    );
  }

  if (!story || !selected) return wireLoading ? <StudioLoading /> : <StudioEmpty />;

  const copy = formatCopy(desk.selectedFormat, desk.carouselOptions.slides);
  // S14: the story's tabs (NewTimeline); «الخبر» is this view, with the «تطور القصة» chip in the story's meta.
  return (
    <DeskStoryArea
      desk={desk}
      item={selected}
      title={story.title}
      onUpdateDraft={updateDraft}
      story={(timelineChip) => (
        <>
          <div className="enter" style={{ flex: 1, overflowY: "auto", padding: "26px 34px 20px" }}>
            {desk.generateError && <StudioError error={desk.generateError} onRetry={desk.retry} style={NOTICE_STYLE} />}
            <StoryPanel story={story} timeline={timelineChip} />
            <DuplicateWorkNotice itemId={selected.id} headline={story.title} onOpenDraft={desk.openConversation} style={DECK_NOTICE_STYLE} />
            <FormatDeck selected={desk.selectedFormat} approvedRules={desk.approvedRules} onSelect={desk.selectFormat} />
          </div>
          <StudioFooter
            copy={copy}
            hint={footerHint(copy, story.sourceCount)}
            onArchive={() => desk.setDrawerOpen(true)}
            onGenerate={desk.generateSummary}
          />
        </>
      )}
    />
  );
}
