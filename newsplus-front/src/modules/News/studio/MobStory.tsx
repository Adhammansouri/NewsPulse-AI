// MobStory: the story as its own screen — `m-bar` (back, «الخبر», open source, archive), the article, «ماذا ننشر؟»
// with the social formats in the `m-fmt` snap carousel and the web formats in a 2×2 grid, and the sticky `m-cta`.
// Choosing «كاروسيل بصور AI» opens its settings sheet (MobStory-carousel). Inline styles are the board's own.
import type { MouseEvent, ReactNode } from "react";
import type { NewsStoryFormat, NewsSummaryFormat } from "@newsplus/shared";
import { Link } from "react-router-dom";
import { useAiCooldown } from "@/hooks/useAiCooldown";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { SourceMarks } from "@/ui/SourceMarks";
import { COPY } from "../wire/copy";
import { ARCHIVE_ROUTE } from "./archive/archiveModel";
import { MOB_SHAPES } from "./FormatShapes";
import { SOCIAL_FORMATS, STUDIO_COPY, TILE_COPY, WEB_FORMATS } from "./formats";
import type { StoryModel } from "./storyModel";

/** Bottom CTA: the board's `m-cta`, plus the safe-area inset (GLOBAL-RULES §6). */
export const M_CTA_STYLE = { paddingBottom: "calc(26px + env(safe-area-inset-bottom))" } as const;

const WEB_NAME_STYLE = { fontSize: "13.5px" } as const;
const WEB_HINT_STYLE = { fontSize: "11.5px" } as const;
const WEB_SHAPE_STYLE = { width: "40px", height: "40px" } as const;

export function MobStoryBar({
  backHref,
  onBack,
  onOpenSource,
}: {
  backHref: string;
  onBack: () => void;
  onOpenSource?: () => void;
}) {
  return (
    <header className="m-bar">
      <a
        className="icon-btn"
        href={backHref}
        aria-label={STUDIO_COPY.backToList}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          onBack();
        }}
      >
        <Icon name="arrow-back" />
      </a>
      <span className="m-bar__title">{STUDIO_COPY.story}</span>
      <button className="icon-btn" type="button" aria-label={STUDIO_COPY.openSource} onClick={onOpenSource} disabled={!onOpenSource}>
        <Icon name="external" />
      </button>
      <Link className="icon-btn" to={ARCHIVE_ROUTE} aria-label={STUDIO_COPY.archive}>
        <Icon name="history" />
      </Link>
    </header>
  );
}

export function MobStory({
  story,
  selected,
  hint,
  action,
  notice,
  deckNotice,
  tabs,
  onSelect,
  onGenerate,
}: {
  story: StoryModel;
  selected: NewsSummaryFormat;
  /** «{format} · {hint} · من {sources}» */
  hint: string;
  action: string;
  /** A failed generation (StudioError), above the article. */
  notice?: ReactNode;
  /** A teammate writing about this story (S15 §4), above «ماذا ننشر؟». */
  deckNotice?: ReactNode;
  /** S14: «الخبر | تطور القصة | المصادر» (MobNewTimeline), first in the scroll. */
  tabs?: ReactNode;
  onSelect: (format: NewsStoryFormat) => void;
  onGenerate: () => void;
}) {
  // S10: the AI button waits for the rate-limit cooldown.
  const cooldown = useAiCooldown();
  return (
    <>
      <main className="m-scroll col" style={{ padding: "16px", gap: "18px" }}>
        {tabs}
        {notice}
        <article className="col" style={{ gap: "10px" }}>
          <div className="row t-meta" style={{ flexWrap: "wrap", gap: "8px" }}>
            <SourceMarks marks={story.marks} />
            <b style={{ fontWeight: 600, color: "var(--ink-2)" }}>{story.sourceLine}</b>
            <span className="num">{story.time}</span>
            {story.breaking && <span className="badge badge--breaking">{COPY.breaking}</span>}
          </div>
          <h1 className="t-display" dir={story.dir} style={{ fontSize: "22px", lineHeight: 1.55 }}>
            {story.title}
          </h1>
          {story.excerpt && (
            <p
              className="t-small"
              dir={story.dir}
              style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              {story.excerpt}
            </p>
          )}
        </article>

        {deckNotice}
        <section className="m-section">
          <div className="m-section__head">
            <h2 className="t-head">{STUDIO_COPY.whatToPublish}</h2>
            <span className="badge badge--ai">{STUDIO_COPY.inYourStyle}</span>
          </div>
          <div className="m-fmt" role="group" aria-label={STUDIO_COPY.socialFormats}>
            {SOCIAL_FORMATS.map((format) => {
              const on = selected === format;
              return (
                <button key={format} className="tile" type="button" aria-pressed={on} onClick={() => onSelect(format)}>
                  <span className="tile__shape" style={{ height: "92px" }}>
                    {MOB_SHAPES[format]}
                  </span>
                  <span className="tile__name">{TILE_COPY[format].name}</span>
                  <span className="tile__hint">{TILE_COPY[format].mobHint}</span>
                  {on && (
                    <span className="tile__check">
                      <Icon name="check" size="sm" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
        <section className="m-section">
          <h2 className="t-head">{STUDIO_COPY.forWeb}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
            {WEB_FORMATS.map((format) => (
              <button
                key={format}
                className="tile tile--row"
                type="button"
                aria-pressed={selected === format}
                onClick={() => onSelect(format)}
              >
                <span className="tile__shape" style={WEB_SHAPE_STYLE}>
                  {MOB_SHAPES[format]}
                </span>
                <span className="col">
                  <span className="tile__name" style={WEB_NAME_STYLE}>
                    {TILE_COPY[format].name}
                  </span>
                  <span className="tile__hint" style={WEB_HINT_STYLE}>
                    {TILE_COPY[format].mobHint}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className="m-cta" style={M_CTA_STYLE}>
        <p className="m-cta__hint">{hint}</p>
        <Button variant="ai" block size="lg" disabled={cooldown.active} onClick={onGenerate}>
          <Icon name="sparkle" />
          {action}
        </Button>
      </footer>
    </>
  );
}
