// The desktop studio (Main, studio area): the story with its formats and footer (idle), «المحرّر يكتب»
// (Main-generating), or the draft (still the legacy view until S06). Inline styles are the board's own.
import type { NewsFeedItem } from "@newsplus/shared";
import type { SourceLanguages } from "../wire/filters";
import { deskSteps, footerHint, formatCopy } from "./formats";
import { FormatDeck } from "./FormatDeck";
import { LegacyStudio } from "./LegacyStudio";
import { StoryPanel } from "./StoryPanel";
import { StudioEmpty, StudioLoading } from "./StudioStates";
import { StudioError } from "./StudioError";
import { StudioFooter } from "./StudioFooter";
import { StudioGenerating } from "./StudioGenerating";
import { storyModel } from "./storyModel";
import type { EditorialDesk } from "./useEditorialDesk";

/** Space under the failed-generation notice: the board's gap above «ماذا ننشر؟». */
const NOTICE_STYLE = { marginBottom: "24px" } as const;

export function DeskStudio({
  desk,
  selected,
  languages,
  wireLoading,
  onBack,
}: {
  desk: EditorialDesk;
  selected: NewsFeedItem | null;
  languages: SourceLanguages;
  /** The headlines' first load (Main-loading). */
  wireLoading: boolean;
  onBack: () => void;
}) {
  const story = selected ? storyModel(selected, languages, false) : null;

  if (desk.showEditorial) return <LegacyStudio desk={desk} selected={selected} mobile={false} onBack={onBack} />;

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

  if (!story) return wireLoading ? <StudioLoading /> : <StudioEmpty />;

  const copy = formatCopy(desk.selectedFormat, desk.carouselOptions.slides);
  return (
    <>
      <div className="enter" style={{ flex: 1, overflowY: "auto", padding: "26px 34px 20px" }}>
        {desk.generateError && <StudioError error={desk.generateError} onRetry={desk.retry} style={NOTICE_STYLE} />}
        <StoryPanel story={story} />
        <FormatDeck selected={desk.selectedFormat} approvedRules={desk.approvedRules} onSelect={desk.selectFormat} />
      </div>
      <StudioFooter
        copy={copy}
        hint={footerHint(copy, story.sourceCount)}
        onArchive={() => desk.setDrawerOpen(true)}
        onGenerate={desk.generateSummary}
      />
    </>
  );
}
