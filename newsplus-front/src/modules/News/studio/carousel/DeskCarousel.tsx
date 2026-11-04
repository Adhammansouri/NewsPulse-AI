// DeskCarousel: the carousel draft on desktop — the selected slide large, the slides with their status, a notice
// for each slide to redraw, the caption, and the slide settings aside. The slides paint through useCarouselPainter
// (`POST /news/carousel/render`), unchanged. Inline styles are the board's own.
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { CarouselOptions, CarouselSlide, NewsSummarizeData } from "@newsplus/shared";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { cx } from "@/ui/cx";
import { Icon } from "@/ui/Icon";
import { Notice } from "@/ui/Notice";
import { Segmented } from "@/ui/Segmented";
import { Switch } from "@/ui/Switch";
import { VersionChip } from "@/ui/VersionChip";
import { toArabicDigits } from "@/utils/arabic";
import { formatSummaryClipboard } from "../../newsFormat";
import { useCarouselPainter } from "../../useCarouselPainter";
import { CAROUSEL_DENSITIES, CAROUSEL_SLIDE_COUNTS, formatCopy, STUDIO_COPY } from "../formats";
import { CAROUSEL_COPY, DRAFT_COPY, versionLabel } from "../draft/copy";
import { DraftBlock, DraftCopyProvider, selectText, useDraftCopy } from "../draft/DraftBlock";
import { carouselTags, textDir } from "../draft/draftModel";
import { downloadBlob } from "../draft/draftHooks";
import { LOGO_SRC } from "../draft/DeskFormats";
import type { EditorialDesk } from "../useEditorialDesk";
import { isPainting, PHASE_BADGE, phaseLabel, slideProblem, slidesTally, slideViews, type SlideView } from "./carouselModel";
import { BARE_ART, loadSlideImage, PosterArt, posterFrame, useSlidePoster } from "./SlideArt";

const SLIDE_OPTIONS = CAROUSEL_SLIDE_COUNTS.map((count) => ({ value: String(count), label: toArabicDigits(count) }));

export function DeskCarousel({ desk, storyTitle }: { desk: EditorialDesk; storyTitle: string | null }) {
  return (
    <DraftCopyProvider>
      <CarouselView desk={desk} storyTitle={storyTitle} />
    </DraftCopyProvider>
  );
}

function CarouselView({ desk, storyTitle }: { desk: EditorialDesk; storyTitle: string | null }) {
  const data = desk.summary as NewsSummarizeData;
  const queryClient = useQueryClient();
  const { done, copy } = useDraftCopy();
  const { slides, painting, redraw } = useCarouselPainter(data);
  const views = slideViews(slides, painting);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = views.find((view) => view.slide.index === selectedIndex) ?? views[0];
  const tags = carouselTags(data);
  const name = formatCopy("carousel", slides.length).name;
  const conversationId = data.conversationId;
  const versionNumber = desk.detail?.versions.find((version) => version.id === desk.detail?.currentVersionId)?.number ?? data.versionNumber;

  function copyTexts() {
    copy("all", formatSummaryClipboard(data), DRAFT_COPY.copiedAll(name), () => selectText(document.getElementById("carousel-texts")));
  }

  async function downloadImages() {
    if (!conversationId) return;
    for (const view of views) {
      const assetId = view.slide.assetId;
      if (!assetId) continue;
      try {
        const blob = await loadSlideImage(queryClient, conversationId, assetId);
        downloadBlob(blob, `newsplus-carousel-${view.n}.png`);
      } catch {
        // A slide whose image can't be fetched is skipped; the others still download.
      }
    }
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
      <div className="grow col" style={{ background: "var(--bg)" }}>
        <div className="row" style={{ padding: "12px 24px", background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
          <Button variant="ghost" size="sm" onClick={desk.closeDraft}>
            <Icon name="arrow-back" size="sm" />
            {CAROUSEL_COPY.headlines}
          </Button>
          {storyTitle && (
            <span className="t-meta ellipsis" style={{ maxWidth: "360px" }} dir={textDir(storyTitle)}>
              {storyTitle}
            </span>
          )}
          <Badge variant="ai">{name}</Badge>
          {versionNumber !== undefined && <VersionChip current>{versionLabel(versionNumber)}</VersionChip>}
          <span className="grow" />
          <Button variant="quiet" size="sm" onClick={() => void downloadImages()}>
            <Icon name="download" size="sm" />
            {CAROUSEL_COPY.downloadImages}
          </Button>
          <Button variant="ink" size="sm" onClick={copyTexts}>
            <Icon name="copy" size="sm" />
            {done === "all" ? DRAFT_COPY.copied : CAROUSEL_COPY.copyTexts}
          </Button>
        </div>

        <div className="grow" style={{ display: "flex", gap: "28px", padding: "26px 30px", overflow: "hidden" }}>
          <div className="col" style={{ width: "440px", flex: "none", gap: "14px" }}>
            {selected && (
              <BigSlide key={selected.slide.index} view={selected} total={views.length} conversationId={conversationId} mark={data.carousel?.mark ?? true} density={data.carousel?.density} />
            )}
            <div className="row t-meta">
              <Icon name="sparkle" size="sm" style={{ color: "var(--cyan)" }} />
              {CAROUSEL_COPY.aiImage}
            </div>
          </div>

          <div className="grow col" style={{ gap: "18px", overflowY: "auto" }} id="carousel-texts">
            <div className="col" style={{ gap: "10px" }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h2 className="t-head">{CAROUSEL_COPY.slides}</h2>
                <span className="t-meta">{slidesTally(views)}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px" }}>
                {views.map((view) => (
                  <Thumbnail
                    key={view.slide.index}
                    view={view}
                    conversationId={conversationId}
                    selected={view === selected}
                    onSelect={() => setSelectedIndex(view.slide.index)}
                  />
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
                      <Button variant="quiet" size="sm" disabled={painting.includes(view.slide.index)} onClick={() => void redraw(view.slide.index)}>
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
            </div>
            <div className="doc" style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <DraftBlock label={DRAFT_COPY.caption} copy={{ key: "caption", text: data.summary, toast: DRAFT_COPY.copiedCaption }}>
                <p className="t-body" style={{ color: "var(--ink)" }} dir={textDir(data.summary)}>
                  {data.summary}
                </p>
              </DraftBlock>
              {tags.length > 0 && (
                <div className="row" style={{ flexWrap: "wrap", gap: "6px" }}>
                  {tags.map((tag, index) => (
                    <span key={`${index}-${tag}`} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CarouselSettings
        options={desk.carouselOptions}
        busy={desk.busy}
        onChange={desk.setCarouselOptions}
        onUpdate={() => desk.switchFormat("carousel")}
      />
    </div>
  );
}

function slideHeadline(slide: CarouselSlide) {
  return slide.headline.trim();
}

/** The selected slide, 440px: logo, «n / N», headline, coral banner, attribution. */
function BigSlide({
  view,
  total,
  conversationId,
  mark,
  density,
}: {
  view: SlideView;
  total: number;
  conversationId: string | undefined;
  mark: boolean;
  density: CarouselOptions["density"] | undefined;
}) {
  const painting = isPainting(view.phase);
  const poster = useSlidePoster(conversationId, view.slide, !painting);
  const { slide } = view;
  return (
    <figure
      className={cx("slide", painting && "is-painting")}
      style={{ width: "440px", borderRadius: "22px", padding: "26px", boxShadow: "var(--shadow-3)", ...posterFrame(poster) }}
    >
      {poster ? (
        <PosterArt poster={poster} label={slideHeadline(slide)} />
      ) : (
        <>
          <span className="slide__art" style={painting ? undefined : BARE_ART} />
          <span className="slide__art" style={{ background: "linear-gradient(180deg, transparent 30%, rgb(5 13 23 / .88))" }} />
        </>
      )}
      <span className="row" style={{ position: "absolute", top: "18px", insetInline: "18px", justifyContent: "space-between" }}>
        {mark && !poster ? <img src={LOGO_SRC} alt="" style={{ width: "30px", height: "30px", borderRadius: "9px" }} /> : <span />}
        <span className="num" style={{ fontSize: "12px", opacity: 0.8 }}>
          {CAROUSEL_COPY.counter(view.n, total)}
        </span>
      </span>
      {!poster && (
        <>
          <p style={{ fontFamily: "var(--f-display)", fontSize: "30px", lineHeight: 1.35, fontWeight: 700 }} dir={textDir(slide.headline)}>
            {slide.headline}
          </p>
          {density === "banner" && slide.banner && (
            <p
              style={{
                marginTop: "10px",
                alignSelf: "flex-start",
                background: "#ef6c57",
                padding: "4px 10px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "15px",
              }}
              dir={textDir(slide.banner)}
            >
              {slide.banner}
            </p>
          )}
          {slide.attribution && (
            <p style={{ marginTop: "10px", fontSize: "12px", opacity: 0.75 }} dir={textDir(slide.attribution)}>
              {slide.attribution}
            </p>
          )}
        </>
      )}
    </figure>
  );
}

function Thumbnail({
  view,
  conversationId,
  selected,
  onSelect,
}: {
  view: SlideView;
  conversationId: string | undefined;
  selected: boolean;
  onSelect: () => void;
}) {
  const painting = isPainting(view.phase);
  const poster = useSlidePoster(conversationId, view.slide, !painting);
  return (
    <button
      type="button"
      className="col"
      style={{ gap: "8px", border: 0, padding: 0, background: "transparent", textAlign: "start" }}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <figure
        className={cx("slide", painting && "is-painting")}
        style={{ padding: "12px", outline: selected ? "2px solid #0ea5e9" : "none", outlineOffset: "3px", ...posterFrame(poster) }}
      >
        {poster ? (
          <PosterArt poster={poster} label={slideHeadline(view.slide)} />
        ) : (
          <>
            <span className="slide__art" style={painting ? undefined : BARE_ART} />
            <span className="slide__art" style={{ background: "linear-gradient(180deg, transparent 35%, rgb(5 13 23 / .82))" }} />
            <p style={{ fontFamily: "var(--f-display)", fontSize: "13px", lineHeight: 1.45, fontWeight: 700 }} dir={textDir(view.slide.headline)}>
              {view.slide.headline}
            </p>
          </>
        )}
      </figure>
      <span className="row" style={{ justifyContent: "space-between" }}>
        <span className="t-meta num">{CAROUSEL_COPY.slideN(view.n)}</span>
        <Badge variant={PHASE_BADGE[view.phase]}>{phaseLabel(view.phase, false)}</Badge>
      </span>
    </button>
  );
}

/** DeskCarousel aside «إعدادات الشرائح». «حدّث الشرائح» writes the carousel again with these settings. */
function CarouselSettings({
  options,
  busy,
  onChange,
  onUpdate,
}: {
  options: CarouselOptions;
  busy: boolean;
  onChange: (next: CarouselOptions) => void;
  onUpdate: () => void;
}) {
  return (
    <aside
      aria-label={CAROUSEL_COPY.settings}
      style={{ width: "340px", flex: "none", display: "flex", flexDirection: "column", background: "var(--surface)", borderInlineEnd: "1px solid var(--line)" }}
    >
      <div className="row" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
        <span className="ic-wrap ic-wrap--teal">
          <Icon name="filter" />
        </span>
        <h3 className="t-head">{CAROUSEL_COPY.settingsTitle}</h3>
      </div>
      <div className="col" style={{ flex: 1, overflowY: "auto", padding: "18px 20px", gap: "20px" }}>
        <div className="col" style={{ gap: "8px" }}>
          <span className="t-label">{STUDIO_COPY.slideCount}</span>
          <Segmented block options={SLIDE_OPTIONS} value={String(options.slides)} onChange={(value) => onChange({ ...options, slides: Number(value) })} />
        </div>
        <div className="col" style={{ gap: "8px" }}>
          <span className="t-label">{CAROUSEL_COPY.style}</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
            <button
              className="tile"
              type="button"
              aria-pressed={options.style === "cinematic"}
              style={{ padding: "8px", gap: "8px" }}
              onClick={() => onChange({ ...options, style: "cinematic" })}
            >
              <span
                className="tile__shape"
                style={{
                  height: "92px",
                  background: "radial-gradient(circle at 70% 30%, #2b86a8, #0c2340 75%)",
                  color: "#fff",
                  alignContent: "end",
                  justifyItems: "start",
                  padding: "10px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {STUDIO_COPY.styleStoryArt}
              </span>
              <span className="tile__name" style={{ fontSize: "13.5px" }}>
                {STUDIO_COPY.styleStory}
              </span>
            </button>
            <button
              className="tile"
              type="button"
              aria-pressed={options.style === "frame"}
              style={{ padding: "8px", gap: "8px" }}
              onClick={() => onChange({ ...options, style: "frame" })}
            >
              <span className="tile__shape" style={{ height: "92px", padding: "8px" }}>
                <span
                  style={{
                    display: "grid",
                    width: "100%",
                    height: "100%",
                    gridTemplateRows: "1fr auto",
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: "#fff",
                    boxShadow: "0 0 0 1px var(--line)",
                  }}
                >
                  <span style={{ background: "linear-gradient(160deg, #13305a, #0a7cc0)" }} />
                  <span style={{ padding: "5px", fontSize: "10.5px", fontWeight: 700, color: "#0c2340" }}>{STUDIO_COPY.styleCardArt}</span>
                </span>
              </span>
              <span className="tile__name" style={{ fontSize: "13.5px" }}>
                {STUDIO_COPY.styleCard}
              </span>
            </button>
          </div>
        </div>
        <div className="col" style={{ gap: "8px" }}>
          <span className="t-label">{STUDIO_COPY.density}</span>
          <Segmented block options={CAROUSEL_DENSITIES} value={options.density} onChange={(density) => onChange({ ...options, density })} />
        </div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="col">
            <span className="t-label">{STUDIO_COPY.mark}</span>
            <span className="t-meta">{STUDIO_COPY.markHint}</span>
          </span>
          <Switch checked={options.mark} label={STUDIO_COPY.mark} onCheckedChange={(mark) => onChange({ ...options, mark })} />
        </div>
        <Notice variant="info" icon={<Icon name="sparkle" style={{ color: "var(--cyan)", marginTop: "2px" }} />} textClassName="t-small">
          {CAROUSEL_COPY.styleNotice}
        </Notice>
      </div>
      <div style={{ padding: "14px 20px", borderTop: "1px solid var(--line)" }}>
        <Button variant="ai" block disabled={busy} onClick={onUpdate}>
          <Icon name="refresh" />
          {CAROUSEL_COPY.update}
        </Button>
      </div>
    </aside>
  );
}
