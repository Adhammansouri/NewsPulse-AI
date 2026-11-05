// Main · «ماذا ننشر؟»: the team-memory chip, the three social tiles (`tile`, platform shapes) and the four
// web tiles (`tile tile--row`). Inline styles are the board's own.
import type { NewsStoryFormat, NewsSummaryFormat } from "@newsplus/shared";
import { Link } from "react-router-dom";
import { useHotkeyActions } from "@/hooks/hotkeyActions";
import { buttonClassName } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { BREAKING_COPY } from "../breaking/breakingModel";
import { DESK_SHAPES } from "./FormatShapes";
import { SOCIAL_FORMATS, STORY_FORMAT_IDS, STUDIO_COPY, TILE_COPY, WEB_FORMATS } from "./formats";

export function FormatDeck({
  selected,
  approvedRules,
  breakingHref,
  onSelect,
}: {
  selected: NewsSummaryFormat;
  /** Approved team-memory rules; the chip is hidden at 0. */
  approvedRules: number;
  /**
   * S13 §2: a breaking story's «وضع العاجل», next to the deck title (the sprint's entry point; no board draws it,
   * so it is the home breaking strip's own `btn--ink btn--sm`).
   */
  breakingHref?: string;
  onSelect: (format: NewsStoryFormat) => void;
}) {
  // S11 `F` then 1–7: the tiles in deck order.
  useHotkeyActions({
    format: (index) => {
      const format = STORY_FORMAT_IDS[index - 1];
      if (format) onSelect(format);
    },
  });
  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", margin: "24px 2px 12px" }}>
        <h3 className="t-head">
          {STUDIO_COPY.whatToPublish}{" "}
          <span className="t-meta" style={{ fontWeight: 400 }}>
            {STUDIO_COPY.forSocial}
          </span>
        </h3>
        <span className="row" style={{ gap: "8px" }}>
          {approvedRules > 0 && (
            <span className="chip chip--ai chip--sm">
              <Icon name="memory" size="sm" style={{ color: "var(--cyan)" }} />
              {STUDIO_COPY.memoryChip(approvedRules)}
            </span>
          )}
          {breakingHref && (
            <Link className={buttonClassName({ variant: "ink", size: "sm" })} to={breakingHref}>
              {BREAKING_COPY.title}
            </Link>
          )}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
        {SOCIAL_FORMATS.map((format) => {
          const on = selected === format;
          return (
            <button key={format} className="tile" type="button" aria-pressed={on} onClick={() => onSelect(format)}>
              <span className="tile__shape" style={{ height: "96px" }}>
                {DESK_SHAPES[format]}
              </span>
              <span className="tile__name">{TILE_COPY[format].name}</span>
              <span className="tile__hint">{TILE_COPY[format].hint}</span>
              {on && (
                <span className="tile__check">
                  <Icon name="check" size="sm" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <h3 className="t-head" style={{ margin: "22px 2px 12px" }}>
        {STUDIO_COPY.forWeb}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px" }}>
        {WEB_FORMATS.map((format) => (
          <button
            key={format}
            className="tile tile--row"
            type="button"
            aria-pressed={selected === format}
            onClick={() => onSelect(format)}
          >
            <span className="tile__shape">{DESK_SHAPES[format]}</span>
            <span className="col">
              <span className="tile__name">{TILE_COPY[format].name}</span>
              <span className="tile__hint">{TILE_COPY[format].hint}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
