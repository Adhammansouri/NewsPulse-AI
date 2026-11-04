// MobStory-carousel: the carousel settings sheet before writing — slide count, image style (قصة / بطاقة preview
// tiles), text density, the Newsplus mark — mapped to `CarouselOptions`. Inline styles are the board's own.
import type { CarouselOptions } from "@newsplus/shared";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { Segmented } from "@/ui/Segmented";
import { Sheet } from "@/ui/Sheet";
import { Switch } from "@/ui/Switch";
import { toArabicDigits } from "@/utils/arabic";
import { CAROUSEL_DENSITIES, CAROUSEL_SLIDE_COUNTS, carouselSheetAction, STUDIO_COPY } from "./formats";

const TITLE_ID = "cs-title";

const SLIDE_OPTIONS = CAROUSEL_SLIDE_COUNTS.map((count) => ({ value: String(count), label: toArabicDigits(count) }));

const STYLE_TILE = { padding: "8px", gap: "8px" } as const;
const STYLE_NAME = { fontSize: "13.5px" } as const;
const STORY_ART = {
  height: "88px",
  background: "radial-gradient(circle at 70% 30%, #2b86a8, #0c2340 75%)",
  color: "#fff",
  justifyItems: "start",
  alignContent: "end",
  padding: "10px",
  fontSize: "11.5px",
  fontWeight: 700,
} as const;
const CARD_ART = { height: "88px", padding: "8px" } as const;
const CARD_FRAME = {
  display: "grid",
  width: "100%",
  height: "100%",
  gridTemplateRows: "1fr auto",
  borderRadius: "8px",
  overflow: "hidden",
  background: "#fff",
  boxShadow: "0 0 0 1px var(--line)",
} as const;
const CARD_IMAGE = { background: "linear-gradient(160deg, #13305a, #0a7cc0)" } as const;
const CARD_CAPTION = { padding: "5px", fontSize: "10.5px", fontWeight: 700, color: "#0c2340" } as const;

export function MobCarouselSheet({
  open,
  options,
  onChange,
  onClose,
  onGenerate,
}: {
  open: boolean;
  options: CarouselOptions;
  onChange: (next: CarouselOptions) => void;
  onClose: () => void;
  onGenerate: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} aria-labelledby={TITLE_ID} className="col" style={{ paddingBottom: "26px" }}>
      <header className="row" style={{ justifyContent: "space-between", padding: "6px 20px 14px" }}>
        <h2 id={TITLE_ID} className="t-title">
          {STUDIO_COPY.carouselTitle}
        </h2>
        <IconButton label={STUDIO_COPY.close} icon="close" onClick={onClose} />
      </header>
      <div className="col" style={{ padding: "0 20px", gap: "18px" }}>
        <div className="col" style={{ gap: "8px" }}>
          <span className="t-label">{STUDIO_COPY.slideCount}</span>
          <Segmented
            block
            options={SLIDE_OPTIONS}
            value={String(options.slides)}
            onChange={(value) => onChange({ ...options, slides: Number(value) })}
          />
        </div>
        <div className="col" style={{ gap: "8px" }}>
          <span className="t-label">{STUDIO_COPY.imageStyle}</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
            <button
              className="tile"
              type="button"
              aria-pressed={options.style === "cinematic"}
              style={STYLE_TILE}
              onClick={() => onChange({ ...options, style: "cinematic" })}
            >
              <span className="tile__shape" style={STORY_ART}>
                {STUDIO_COPY.styleStoryArt}
              </span>
              <span className="tile__name" style={STYLE_NAME}>
                {STUDIO_COPY.styleStory}
              </span>
            </button>
            <button
              className="tile"
              type="button"
              aria-pressed={options.style === "frame"}
              style={STYLE_TILE}
              onClick={() => onChange({ ...options, style: "frame" })}
            >
              <span className="tile__shape" style={CARD_ART}>
                <span style={CARD_FRAME}>
                  <span style={CARD_IMAGE} />
                  <span style={CARD_CAPTION}>{STUDIO_COPY.styleCardArt}</span>
                </span>
              </span>
              <span className="tile__name" style={STYLE_NAME}>
                {STUDIO_COPY.styleCard}
              </span>
            </button>
          </div>
        </div>
        <div className="col" style={{ gap: "8px" }}>
          <span className="t-label">{STUDIO_COPY.density}</span>
          <Segmented
            block
            options={CAROUSEL_DENSITIES}
            value={options.density}
            onChange={(density) => onChange({ ...options, density })}
          />
        </div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="col">
            <span className="t-label">{STUDIO_COPY.mark}</span>
            <span className="t-meta">{STUDIO_COPY.markHint}</span>
          </span>
          <Switch checked={options.mark} label={STUDIO_COPY.mark} onCheckedChange={(mark) => onChange({ ...options, mark })} />
        </div>
        <Button variant="ai" block size="lg" onClick={onGenerate}>
          <Icon name="sparkle" />
          {carouselSheetAction(options.slides)}
        </Button>
      </div>
    </Sheet>
  );
}
