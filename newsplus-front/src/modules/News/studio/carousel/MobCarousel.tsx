// MobDraft-carousel: the painting progress while slides are still drawing, the slides in a snapping row with
// their status, a notice per slide to redraw (as on DeskCarousel), and the caption. Inline styles are the board's.
import type { NewsSummarizeData } from "@newsplus/shared";
import { Button } from "@/ui/Button";
import { cx } from "@/ui/cx";
import { Icon } from "@/ui/Icon";
import { Meter } from "@/ui/Meter";
import { Notice } from "@/ui/Notice";
import { CAROUSEL_COPY, DRAFT_COPY } from "../draft/copy";
import { DraftBlock } from "../draft/DraftBlock";
import { textDir } from "../draft/draftModel";
import { isPainting, phaseLabel, slideProblem, type SlideView } from "./carouselModel";
import { BARE_ART, PosterArt, posterFrame, useSlidePoster } from "./SlideArt";

export function MobCarousel({
  data,
  views,
  painting,
  typeset,
  onRedraw,
}: {
  data: NewsSummarizeData;
  views: SlideView[];
  painting: readonly number[];
  typeset: boolean;
  onRedraw: (index: number) => void;
}) {
  const total = views.length;
  const ready = views.filter((view) => view.phase === "ready").length;
  const drawing = views.some((view) => isPainting(view.phase));
  return (
    <div className={cx("col", typeset && "typeset")} style={{ gap: "12px" }}>
      {drawing && (
        <div className="ai-panel col" style={{ padding: "12px 14px", gap: "8px", boxShadow: "none" }} role="status">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="ai-mark t-ai">{CAROUSEL_COPY.paintingImages}</span>
            <span className="t-meta num">{CAROUSEL_COPY.readyOf(ready, total)}</span>
          </div>
          <Meter value={total > 0 ? (ready / total) * 100 : 0} />
        </div>
      )}
      <div className="scroll-x" style={{ marginInline: "-18px", paddingInline: "18px", gap: "10px", scrollSnapType: "x mandatory" }}>
        {views.map((view) => (
          <MobSlide key={view.slide.index} view={view} total={total} conversationId={data.conversationId} />
        ))}
      </div>
      {views.map((view) => {
        const problem = slideProblem(view);
        if (!problem) return null;
        return (
          <Notice
            key={view.slide.index}
            variant="warn"
            role="status"
            icon={<Icon name="warning" style={{ color: "var(--warn)", marginTop: "2px" }} />}
            textClassName="grow col"
            action={
              <Button variant="quiet" size="sm" disabled={painting.includes(view.slide.index)} onClick={() => onRedraw(view.slide.index)}>
                <Icon name="refresh" size="sm" />
                {CAROUSEL_COPY.redraw}
              </Button>
            }
          >
            <b style={{ fontWeight: 600 }}>{problem.title}</b>
            {problem.text && <span className="t-small">{problem.text}</span>}
          </Notice>
        );
      })}
      <DraftBlock label={DRAFT_COPY.caption} copy={{ key: "caption", text: data.summary, toast: DRAFT_COPY.copiedCaption }}>
        <p className="t-body" style={{ color: "var(--ink)", fontSize: "15px" }} dir={textDir(data.summary)}>
          {data.summary}
        </p>
      </DraftBlock>
    </div>
  );
}

function MobSlide({ view, total, conversationId }: { view: SlideView; total: number; conversationId: string | undefined }) {
  const painting = isPainting(view.phase);
  const poster = useSlidePoster(conversationId, view.slide, !painting);
  return (
    <figure
      className={cx("slide", painting && "is-painting")}
      style={{ width: "250px", flex: "none", scrollSnapAlign: "start", ...posterFrame(poster) }}
    >
      {poster ? (
        <PosterArt poster={poster} label={view.slide.headline} />
      ) : (
        <>
          <span className="slide__art" style={painting ? undefined : BARE_ART} />
          <span className="slide__art" style={{ background: "linear-gradient(180deg, transparent 35%, rgb(5 13 23 / .85))" }} />
        </>
      )}
      <span
        className="row"
        style={{ position: "absolute", top: "12px", insetInline: "12px", justifyContent: "space-between", fontSize: "11px" }}
      >
        <span className="num" style={{ opacity: 0.8 }}>
          {CAROUSEL_COPY.counter(view.n, total)}
        </span>
        <span className="badge" style={{ background: "rgb(255 255 255 / .18)", color: "#fff", height: "20px", fontSize: "11px" }}>
          {phaseLabel(view.phase, true)}
        </span>
      </span>
      {!poster && (
        <p style={{ fontFamily: "var(--f-display)", fontSize: "18px", lineHeight: 1.45, fontWeight: 700 }} dir={textDir(view.slide.headline)}>
          {view.slide.headline}
        </p>
      )}
    </figure>
  );
}
