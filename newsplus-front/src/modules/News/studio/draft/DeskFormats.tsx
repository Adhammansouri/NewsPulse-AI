// S06 §4, desktop: one renderer per format, from `NewsSummarizeData` only. Markup and inline styles are the
// boards' own — social / desk / bulletin / facts / context / briefing from Main-*, video from DeskDraft.
// Values the API doesn't have (the video's «٠:٤٥» length, the briefing lines' «المصدر · الوقت») are left out.
import type { NewsSummarizeData } from "@newsplus/shared";
import { toArabicDigits } from "@/utils/arabic";
import { cx } from "@/ui/cx";
import { Icon } from "@/ui/Icon";
import { formatSummaryClipboard } from "../../newsFormat";
import { formatCopy } from "../formats";
import { DRAFT_COPY } from "./copy";
import { DraftBlock, Lines } from "./DraftBlock";
import {
  briefingItems,
  docShape,
  draftDir,
  socialModel,
  textDir,
  videoModel,
  type BlockKey,
  type Revision,
} from "./draftModel";

export const LOGO_SRC = "/logo-icon.png";

export type FormatProps = {
  data: NewsSummarizeData;
  rev: Revision;
  /** `typeset`: the version's first render. */
  typeset: boolean;
  busy: boolean;
  /** A revision request (alternate hook → «استبدل الخطاف بـ: …»). */
  onRevise: (instruction: string) => void;
};

/** The version that changed `key`, for «… · عُدّل في ن{n}» + `is-changed`. */
export function changedIn(rev: Revision, key: BlockKey): number | null {
  return rev.number !== null && rev.changed.has(key) ? rev.number : null;
}

export function DeskFormat(props: FormatProps) {
  switch (props.data.format) {
    case "social":
      return <DeskSocial {...props} />;
    case "video":
      return <DeskVideo {...props} />;
    case "briefing":
      return <DeskBriefing {...props} />;
    case "carousel":
      return null;
    default:
      return <DeskDoc {...props} />;
  }
}

/** Main-social. */
function DeskSocial({ data, rev, typeset, busy, onRevise }: FormatProps) {
  const { hook, body, tags, alts } = socialModel(data);
  const dir = draftDir(data);
  return (
    <div className={cx(typeset && "typeset")} style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "4px" }}>
      <DraftBlock label={DRAFT_COPY.hook} changedIn={changedIn(rev, "hook")} copy={{ key: "hook", text: hook, toast: DRAFT_COPY.copiedHook }}>
        <p className="t-display" style={{ fontSize: "22px" }} dir={dir}>
          {hook}
        </p>
      </DraftBlock>
      <DraftBlock label={DRAFT_COPY.body} changedIn={changedIn(rev, "body")} copy={{ key: "body", text: body, toast: DRAFT_COPY.copiedBody }}>
        <p className="t-body" style={{ color: "var(--ink)" }} dir={dir}>
          <Lines text={body} />
        </p>
      </DraftBlock>
      {tags.length > 0 && (
        <DraftBlock
          label={DRAFT_COPY.tags}
          changedIn={changedIn(rev, "tags")}
          copy={{ key: "tags", text: tags.join(" "), toast: DRAFT_COPY.copiedTags }}
        >
          <div className="row" style={{ flexWrap: "wrap", gap: "6px" }}>
            {tags.map((tag, index) => (
              <span key={`${index}-${tag}`} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </DraftBlock>
      )}
      {alts.length > 0 && (
        <DraftBlock label={DRAFT_COPY.altsDesk} changedIn={changedIn(rev, "alts")}>
          <div className="col" style={{ gap: "8px" }}>
            {alts.map((alt, index) => (
              <button
                key={`${index}-${alt}`}
                className="tile tile--row"
                type="button"
                style={{ boxShadow: "none", padding: "10px 14px" }}
                aria-disabled={busy || undefined}
                onClick={() => {
                  if (!busy) onRevise(DRAFT_COPY.replaceHook(alt));
                }}
              >
                <span className="grow" style={{ fontSize: "14.5px", fontWeight: 500 }} dir={textDir(alt)}>
                  {alt}
                </span>
                <Icon name="swap" size="sm" style={{ color: "var(--ink-3)" }} />
              </button>
            ))}
          </div>
        </DraftBlock>
      )}
    </div>
  );
}

/** DeskDraft: the 9:16 cover, then عنوان النشر · الهوك · النص · لقطات / CG. */
function DeskVideo({ data, rev, typeset }: FormatProps) {
  const video = videoModel(data);
  const dir = draftDir(data);
  return (
    <div className={cx("row", typeset && "typeset")} style={{ alignItems: "flex-start", gap: "30px" }}>
      <div
        style={{
          width: "224px",
          height: "398px",
          flex: "none",
          borderRadius: "28px",
          background: "radial-gradient(circle at 70% 20%, #1d6f8f, #0c2340 70%)",
          color: "#fff",
          padding: "18px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "var(--shadow-3)",
        }}
      >
        <div className="row" style={{ justifyContent: "space-between" }}>
          <img src={LOGO_SRC} alt="" style={{ width: "28px", height: "28px", borderRadius: "8px" }} />
        </div>
        {video.cover && (
          <div className="col" style={{ gap: "8px" }}>
            <span
              style={{
                alignSelf: "flex-start",
                fontSize: "11px",
                fontWeight: 600,
                background: "#ef6c57",
                padding: "2px 8px",
                borderRadius: "6px",
              }}
            >
              {DRAFT_COPY.cover}
            </span>
            <p style={{ fontFamily: "var(--f-display)", fontSize: "24px", lineHeight: 1.4, fontWeight: 700 }} dir={textDir(video.cover)}>
              {video.cover}
            </p>
          </div>
        )}
      </div>
      <div className="col grow" style={{ gap: "4px", maxWidth: "520px" }}>
        <DraftBlock
          label={DRAFT_COPY.videoTitle}
          changedIn={changedIn(rev, "title")}
          copy={{ key: "title", text: video.title, toast: DRAFT_COPY.copiedVideoTitle }}
        >
          <p className="t-title" dir={dir}>
            {video.title}
          </p>
        </DraftBlock>
        {video.hook && (
          <DraftBlock
            label={DRAFT_COPY.videoHookDesk}
            changedIn={changedIn(rev, "videoHook")}
            copy={{ key: "videoHook", text: video.hook, toast: DRAFT_COPY.copiedVideoHook }}
          >
            <p className="t-head" style={{ fontSize: "17px" }} dir={dir}>
              <Lines text={video.hook} />
            </p>
          </DraftBlock>
        )}
        <DraftBlock
          label={DRAFT_COPY.body}
          changedIn={changedIn(rev, "script")}
          copy={{ key: "script", text: video.script, toast: DRAFT_COPY.copiedBody }}
        >
          <p className="t-body" style={{ color: "var(--ink)" }} dir={dir}>
            <Lines text={video.script} />
          </p>
        </DraftBlock>
        {video.shots.length > 0 && (
          <DraftBlock label={DRAFT_COPY.shots} changedIn={changedIn(rev, "shots")}>
            <ol className="col" style={{ gap: "8px" }}>
              {video.shots.map((shot, index) => (
                <li key={`${index}-${shot}`} className="row" style={{ fontSize: "14px", alignItems: "flex-start" }}>
                  <span className="vchip num">{toArabicDigits(index + 1)}</span>
                  <span style={{ paddingTop: "3px" }} dir={textDir(shot)}>
                    {shot}
                  </span>
                </li>
              ))}
            </ol>
          </DraftBlock>
        )}
      </div>
    </div>
  );
}

/** Main-desk / -bulletin / -facts / -context. */
function DeskDoc({ data, rev, typeset }: FormatProps) {
  const shape = docShape(data.format);
  const dir = draftDir(data);
  const points = data.bullets.map((point) => point.trim()).filter(Boolean);
  const pointsLabel =
    data.format === "facts" ? DRAFT_COPY.pointsFacts : data.format === "context" ? DRAFT_COPY.pointsContext : DRAFT_COPY.pointsDesk;
  return (
    <article
      className={cx("doc", typeset && "typeset")}
      style={{ maxWidth: "680px", padding: "30px 36px", display: "flex", flexDirection: "column", gap: "4px" }}
    >
      <DraftBlock
        label={data.format === "bulletin" ? DRAFT_COPY.bulletinTitle : DRAFT_COPY.title}
        changedIn={changedIn(rev, "title")}
        copy={{ key: "title", text: data.title, toast: DRAFT_COPY.copiedTitle }}
      >
        <h2 className="t-display" dir={dir}>
          {data.title}
        </h2>
      </DraftBlock>
      {shape.dek && data.dek && (
        <DraftBlock label={DRAFT_COPY.dek} changedIn={changedIn(rev, "dek")}>
          <p className="t-head" style={{ color: "var(--ink-2)", fontWeight: 500 }} dir={dir}>
            {data.dek}
          </p>
        </DraftBlock>
      )}
      {shape.body && data.summary && (
        <DraftBlock label={DRAFT_COPY.body} changedIn={changedIn(rev, "body")}>
          <p className="t-body" style={{ color: "var(--ink)" }} dir={dir}>
            <Lines text={data.summary} />
          </p>
        </DraftBlock>
      )}
      {shape.points && points.length > 0 && (
        <DraftBlock label={pointsLabel} changedIn={changedIn(rev, "points")}>
          <ul className="col" style={{ gap: "8px" }}>
            {points.map((point, index) => (
              <li key={`${index}-${point}`} className="row" style={{ alignItems: "flex-start", fontSize: "15px", gap: "10px" }} dir={textDir(point)}>
                <span
                  style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--ai)", marginTop: "10px", flex: "none" }}
                />
                {point}
              </li>
            ))}
          </ul>
        </DraftBlock>
      )}
    </article>
  );
}

/** Main-briefing: the header copies the whole briefing. */
function DeskBriefing({ data, rev, typeset }: FormatProps) {
  const items = briefingItems(data);
  const before = rev.previous ? briefingItems(rev.previous) : null;
  const dir = draftDir(data);
  return (
    <article
      className={cx("doc", typeset && "typeset")}
      style={{ maxWidth: "700px", padding: "28px 32px", display: "flex", flexDirection: "column", gap: "6px" }}
    >
      <DraftBlock
        label={DRAFT_COPY.briefingHead(items.length)}
        changedIn={changedIn(rev, "title")}
        copy={{ key: "briefing", text: formatSummaryClipboard(data), toast: DRAFT_COPY.copiedAll(formatCopy("briefing", 0).name) }}
      >
        <h2 className="t-display" dir={dir}>
          {data.title}
        </h2>
      </DraftBlock>
      <ol className="col" style={{ gap: "2px" }}>
        {items.map((item, index) => (
          <li
            key={`${index}-${item}`}
            className={cx("block row", before !== null && before[index] !== item && "is-changed")}
            style={{ alignItems: "flex-start", gap: "14px" }}
          >
            <span className="t-num" style={{ fontSize: "20px", color: "var(--cyan)", width: "22px" }}>
              {toArabicDigits(index + 1)}
            </span>
            <span className="col grow">
              <span style={{ fontWeight: 600, fontSize: "15.5px", lineHeight: 1.6 }} dir={textDir(item)}>
                {item}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}
