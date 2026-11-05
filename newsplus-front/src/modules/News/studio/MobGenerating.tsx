// MobGenerating: `m-bar` (back, the format, «يكتب…»), the AI panel («المحرّر يكتب الآن», the time estimate,
// pulse line, three steps), the draft's skeleton, and the `m-cta` that lets the editor keep browsing
// («تصفّح العناوين») or cancel. Leaving keeps the request going (draftRuns.ts). Inline styles are the board's own.
import type { MouseEvent } from "react";
import { AiPanel } from "@/ui/AiPanel";
import { AiSteps } from "@/ui/AiSteps";
import { Icon } from "@/ui/Icon";
import { PulseLine } from "@/ui/PulseLine";
import { MobDraftSkeleton } from "./DraftSkeleton";
import { STUDIO_COPY } from "./formats";
import { M_CTA_STYLE } from "./MobStory";
import { useAiSteps } from "./useAiSteps";

function plainClick(event: MouseEvent<HTMLAnchorElement>, run: () => void) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  event.preventDefault();
  run();
}

export function MobGenerating({
  name,
  steps,
  startedAt,
  estimate,
  backHref,
  listHref,
  onBack,
  onBrowse,
  onCancel,
}: {
  name: string;
  steps: readonly [string, string, string];
  startedAt: number;
  /** «حوالي N ثوانٍ» (seconds); hidden until a run has been timed. */
  estimate: number | null;
  backHref: string;
  listHref: string;
  /** Back to the story; the request keeps going. */
  onBack: () => void;
  /** «تصفّح العناوين»: back to the headlines; the request keeps going. */
  onBrowse: () => void;
  onCancel: () => void;
}) {
  const aiSteps = useAiSteps(steps, startedAt);
  return (
    <>
      <header className="m-bar">
        <a className="icon-btn" href={backHref} aria-label={STUDIO_COPY.back} onClick={(event) => plainClick(event, onBack)}>
          <Icon name="arrow-back" />
        </a>
        <span className="m-bar__title">{name}</span>
        <span className="badge badge--ai">{STUDIO_COPY.writing}</span>
      </header>
      <main className="m-scroll col" style={{ padding: "20px 16px", gap: "16px" }}>
        <AiPanel as="section" glow className="col" style={{ padding: "22px 20px", gap: "18px" }} aria-live="polite">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="ai-mark t-ai" style={{ fontSize: "14px" }}>
              {STUDIO_COPY.writingNow}
            </span>
            {estimate !== null && <span className="t-meta num">{STUDIO_COPY.about(estimate)}</span>}
          </div>
          <PulseLine preset="320x44" />
          <AiSteps steps={aiSteps} />
        </AiPanel>
        <MobDraftSkeleton />
      </main>
      <div className="m-cta" style={M_CTA_STYLE}>
        <p className="m-cta__hint">{STUDIO_COPY.keepBrowsing}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <a className="btn btn--quiet" href={listHref} onClick={(event) => plainClick(event, onBrowse)}>
            {STUDIO_COPY.browseHeadlines}
          </a>
          <button className="btn btn--ghost" type="button" style={{ color: "var(--breaking)" }} onClick={onCancel}>
            {STUDIO_COPY.cancel}
          </button>
        </div>
      </div>
    </>
  );
}
