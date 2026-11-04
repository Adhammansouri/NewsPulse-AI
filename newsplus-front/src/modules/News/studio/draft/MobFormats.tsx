// S06 §4, mobile: MobDraft / -video / -briefing / -desk / -facts, from `NewsSummarizeData` only. Markup and
// inline styles are the board's own; bulletin and context (no mobile board) use the same document as desk.
import { clockAr, toArabicDigits } from "@/utils/arabic";
import { cx } from "@/ui/cx";
import { Icon } from "@/ui/Icon";
import { formatSummaryClipboard } from "../../newsFormat";
import { formatCopy } from "../formats";
import { DRAFT_COPY } from "./copy";
import { changedIn, type FormatProps } from "./DeskFormats";
import { DraftBlock, Lines } from "./DraftBlock";
import { briefingItems, docShape, draftDir, socialModel, textDir, videoModel } from "./draftModel";

/** MobDraft's compact block (`margin-inline: -10px; padding: 10px`). */
const TIGHT = { marginInline: "-10px", padding: "10px" } as const;

export function MobFormat(props: FormatProps & { createdAt: string | null }) {
  switch (props.data.format) {
    case "social":
      return <MobSocial {...props} />;
    case "video":
      return <MobVideo {...props} />;
    case "briefing":
      return <MobBriefing {...props} />;
    case "carousel":
      return null;
    default:
      return <MobDoc {...props} />;
  }
}

/** MobDraft (social): the board offers one alternate hook. */
function MobSocial({ data, rev, typeset, busy, onRevise }: FormatProps) {
  const { hook, body, tags, alts } = socialModel(data);
  const dir = draftDir(data);
  const alt = alts[0];
  return (
    <div className={cx("col", typeset && "typeset")} style={{ gap: "2px" }}>
      <DraftBlock label={DRAFT_COPY.hook} changedIn={changedIn(rev, "hook")} copy={{ key: "hook", text: hook, toast: DRAFT_COPY.copiedHook }}>
        <p className="t-display" style={{ fontSize: "20px" }} dir={dir}>
          {hook}
        </p>
      </DraftBlock>
      <DraftBlock label={DRAFT_COPY.body} changedIn={changedIn(rev, "body")} copy={{ key: "body", text: body, toast: DRAFT_COPY.copiedBody }}>
        <p className="t-body" style={{ color: "var(--ink)", fontSize: "15.5px" }} dir={dir}>
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
      {alt && (
        <DraftBlock label={DRAFT_COPY.altMob} changedIn={changedIn(rev, "alts")}>
          <button
            className="tile tile--row"
            type="button"
            style={{ boxShadow: "none", padding: "10px 12px" }}
            aria-disabled={busy || undefined}
            onClick={() => {
              if (!busy) onRevise(DRAFT_COPY.replaceHook(alt));
            }}
          >
            <span className="grow" style={{ fontSize: "14px" }} dir={textDir(alt)}>
              {alt}
            </span>
            <Icon name="swap" size="sm" style={{ color: "var(--ink-3)" }} />
          </button>
        </DraftBlock>
      )}
    </div>
  );
}

/** MobDraft-video. */
function MobVideo({ data, rev, typeset }: FormatProps) {
  const video = videoModel(data);
  const dir = draftDir(data);
  const hookChanged = changedIn(rev, "videoHook");
  return (
    <div className={cx("col", typeset && "typeset")} style={{ gap: "10px" }}>
      <div className="row" style={{ gap: "14px", alignItems: "flex-start" }}>
        <div
          className="col"
          style={{
            width: "128px",
            height: "228px",
            flex: "none",
            borderRadius: "20px",
            background: "radial-gradient(circle at 70% 20%, #1d6f8f, #0c2340 70%)",
            color: "#fff",
            padding: "12px 10px",
            justifyContent: "flex-end",
            gap: "6px",
            boxShadow: "var(--shadow-2)",
          }}
        >
          {video.cover && (
            <>
              <span
                style={{
                  alignSelf: "flex-start",
                  fontSize: "10px",
                  fontWeight: 600,
                  background: "#ef6c57",
                  padding: "1px 6px",
                  borderRadius: "5px",
                }}
              >
                {DRAFT_COPY.cover}
              </span>
              <p style={{ fontFamily: "var(--f-display)", fontSize: "15px", lineHeight: 1.4, fontWeight: 700 }} dir={textDir(video.cover)}>
                {video.cover}
              </p>
            </>
          )}
        </div>
        <div className="col grow" style={{ gap: "2px" }}>
          <DraftBlock label={DRAFT_COPY.videoTitle} changedIn={changedIn(rev, "title")} style={TIGHT}>
            <p className="t-head" dir={dir}>
              {video.title}
            </p>
          </DraftBlock>
          {video.hook && (
            <DraftBlock
              label={DRAFT_COPY.videoHookMob}
              changedIn={hookChanged}
              style={{ ...TIGHT, background: "var(--cyan-soft)" }}
              labelStyle={{ color: "var(--cyan)" }}
            >
              <p style={{ fontWeight: 600, fontSize: "14.5px", lineHeight: 1.6 }} dir={dir}>
                <Lines text={video.hook} />
              </p>
            </DraftBlock>
          )}
        </div>
      </div>
      <DraftBlock
        label={DRAFT_COPY.body}
        changedIn={changedIn(rev, "script")}
        copy={{ key: "script", text: video.script, toast: DRAFT_COPY.copiedBody }}
      >
        <p className="t-body" style={{ color: "var(--ink)", fontSize: "15px" }} dir={dir}>
          <Lines text={video.script} />
        </p>
      </DraftBlock>
      {video.shots.length > 0 && (
        <DraftBlock label={DRAFT_COPY.shots} changedIn={changedIn(rev, "shots")}>
          <ol className="col" style={{ gap: "6px" }}>
            {video.shots.map((shot, index) => (
              <li key={`${index}-${shot}`} className="row" style={{ fontSize: "14px" }} dir={textDir(shot)}>
                <span className="vchip">{toArabicDigits(index + 1)}</span>
                {shot}
              </li>
            ))}
          </ol>
        </DraftBlock>
      )}
    </div>
  );
}

/** MobDraft-desk / -facts. */
function MobDoc({ data, rev, typeset }: FormatProps) {
  const shape = docShape(data.format);
  const dir = draftDir(data);
  const points = data.bullets.map((point) => point.trim()).filter(Boolean);
  const pointsLabel =
    data.format === "facts" ? DRAFT_COPY.pointsFactsMob : data.format === "context" ? DRAFT_COPY.pointsContext : DRAFT_COPY.pointsDesk;
  return (
    <article className={cx("doc col", typeset && "typeset")} style={{ padding: "0 0 14px", gap: "2px" }}>
      <div className="ai-strip" />
      <div className="col" style={{ padding: "12px 18px 0", gap: "2px" }}>
        <DraftBlock
          label={data.format === "bulletin" ? DRAFT_COPY.bulletinTitle : DRAFT_COPY.title}
          changedIn={changedIn(rev, "title")}
          copy={{ key: "title", text: data.title, toast: DRAFT_COPY.copiedTitle }}
          style={TIGHT}
        >
          <h2 className="t-display" style={{ fontSize: "20px" }} dir={dir}>
            {data.title}
          </h2>
        </DraftBlock>
        {shape.dek && data.dek && (
          <DraftBlock label={DRAFT_COPY.dek} changedIn={changedIn(rev, "dek")} style={TIGHT}>
            <p style={{ fontWeight: 500, fontSize: "15px", lineHeight: 1.7, color: "var(--ink-2)" }} dir={dir}>
              {data.dek}
            </p>
          </DraftBlock>
        )}
        {shape.body && data.summary && (
          <DraftBlock
            label={DRAFT_COPY.body}
            changedIn={changedIn(rev, "body")}
            copy={{ key: "body", text: data.summary, toast: DRAFT_COPY.copiedBody }}
            style={TIGHT}
          >
            <p className="t-body" style={{ color: "var(--ink)", fontSize: "15px" }} dir={dir}>
              <Lines text={data.summary} />
            </p>
          </DraftBlock>
        )}
        {shape.points && points.length > 0 && (
          <DraftBlock label={pointsLabel} changedIn={changedIn(rev, "points")} style={TIGHT}>
            <ul className="col" style={{ gap: "8px" }}>
              {points.map((point, index) => (
                <li
                  key={`${index}-${point}`}
                  className="row"
                  style={{ alignItems: "flex-start", fontSize: "14.5px", gap: "10px", lineHeight: 1.7 }}
                  dir={textDir(point)}
                >
                  <span
                    style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--ai)", marginTop: "9px", flex: "none" }}
                  />
                  {point}
                </li>
              ))}
            </ul>
          </DraftBlock>
        )}
      </div>
    </article>
  );
}

/** MobDraft-briefing: «موجز {الساعة}» from when this version was written. */
function MobBriefing({ data, rev, typeset, createdAt }: FormatProps & { createdAt: string | null }) {
  const items = briefingItems(data);
  const before = rev.previous ? briefingItems(rev.previous) : null;
  const dir = draftDir(data);
  const name = formatCopy("briefing", 0).name;
  const label = createdAt ? DRAFT_COPY.briefingHeadMob(clockAr(new Date(createdAt))) : name;
  return (
    <div className={cx("col", typeset && "typeset")} style={{ gap: "4px" }}>
      <DraftBlock
        label={label}
        changedIn={changedIn(rev, "title")}
        copy={{ key: "briefing", text: formatSummaryClipboard(data), toast: DRAFT_COPY.copiedAll(name) }}
      >
        <p className="t-display" style={{ fontSize: "20px" }} dir={dir}>
          {data.title}
        </p>
      </DraftBlock>
      {items.map((item, index) => (
        <div
          key={`${index}-${item}`}
          className={cx("block row", before !== null && before[index] !== item && "is-changed")}
          style={{ alignItems: "flex-start", gap: "12px" }}
        >
          <span className="t-num" style={{ fontSize: "20px", color: "var(--cyan)", width: "18px" }}>
            {toArabicDigits(index + 1)}
          </span>
          <span className="col grow">
            <span style={{ fontWeight: 600, fontSize: "15px", lineHeight: 1.6 }} dir={textDir(item)}>
              {item}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
