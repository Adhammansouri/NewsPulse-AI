// NewBreaking (S13 §2) — port of docs/redesign/design/reference/NewBreaking.dc.html: the studio area in breaking
// mode (the board draws no headlines column). Inline styles are the board's own; the board's `main` is a div
// (the shell renders the content `<main>`). Self-contained: the newsroom passes the open item and `onExit`.
import { Fragment, type MouseEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { NewsFeedItem } from "@newsplus/shared";
import { features } from "@/config/features";
import { Icon } from "@/ui/Icon";
import { Skeleton } from "@/ui/Skeleton";
import { Switch } from "@/ui/Switch";
import { StudioError } from "../studio/StudioError";
import { studioLink } from "../studio/studioLink";
import { alertCount, BREAKING_COPY as C, postCount, readyBadge, readyLine } from "./breakingModel";
import { Elapsed } from "./Elapsed";
import { useBreaking, type Breaking, type BreakingOutput } from "./useBreaking";

const PANEL_STYLE = { padding: "16px 18px", gap: "10px" } as const;
const PANEL_TITLE_STYLE = { fontWeight: 600, fontSize: "14px" } as const;
const OUTPUT_STYLE = { fontSize: "16px", lineHeight: 1.75, fontWeight: 600 } as const;
const ACTIONS_STYLE = { flexWrap: "wrap", gap: "6px" } as const;
const SPACE_BETWEEN = { justifyContent: "space-between" } as const;
const OK_STYLE = { color: "var(--ok)" } as const;

export function DeskBreaking({
  item,
  onExit,
}: {
  item: NewsFeedItem;
  /** «اكتب منشور مفصّل»: leave breaking mode for the story's normal social flow (the newsroom starts the post). */
  onExit: () => void;
}) {
  const breaking = useBreaking(item, { mobile: false });

  function writeDetailed(event: MouseEvent<HTMLAnchorElement>) {
    // A modified click opens the story in another tab, as the link says.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onExit();
  }

  return (
    <div className="grow col" style={{ background: "var(--bg)", overflow: "hidden" }}>
      <div className="breaking-bar" role="status">
        <span className="badge" style={{ background: "rgb(255 255 255 / .2)", color: "#fff", position: "relative" }}>
          {C.badge}
        </span>
        <b style={{ position: "relative", fontSize: "16px" }} className="grow">
          {item.title}
        </b>
        <span className="row" style={{ position: "relative", gap: "6px", fontSize: "13px" }}>
          <Icon name="clock" size="sm" />
          <Elapsed since={breaking.firstAt} /> {C.sinceFirst}
        </span>
      </div>
      {/* overflowY auto (board: hidden): the board's 900px fits; a shorter window scrolls instead of clipping. */}
      <div
        className="grow"
        style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "22px", padding: "22px 30px", overflowY: "auto" }}
      >
        <section className="col" style={{ gap: "14px" }} aria-busy={breaking.loading || undefined}>
          <div className="row" style={SPACE_BETWEEN}>
            <div className="col">
              <h1 className="t-title">{C.title}</h1>
              {breaking.data && <p className="t-meta">{readyLine(breaking.data.ms)}</p>}
            </div>
            {breaking.data && <span className="badge badge--ai">{readyBadge(breaking.data.ms)}</span>}
          </div>
          <DeskOutputs breaking={breaking} />
        </section>
        <aside className="col" style={{ gap: "14px" }}>
          <div className="panel col" style={{ padding: "18px", gap: "12px" }}>
            <b style={{ fontWeight: 600 }}>{C.follow}</b>
            <div className="row" style={SPACE_BETWEEN}>
              <span className="t-small">{C.autoUpdate}</span>
              <Switch checked={breaking.autoUpdate} onCheckedChange={breaking.setAutoUpdate} label={C.autoUpdateLabel} />
            </div>
            {features.workflow && (
              <div className="row" style={SPACE_BETWEEN}>
                <span className="t-small">{C.notifyTeam}</span>
                <Switch checked={breaking.notifyTeam} onCheckedChange={breaking.setNotifyTeam} label={C.notifyTeamLabel} />
              </div>
            )}
          </div>
          {breaking.coverage.first && (
            <div className="panel col" style={{ padding: "18px", gap: "10px" }}>
              <b style={{ fontWeight: 600 }}>{C.coverage}</b>
              <div className="row t-small">
                <Icon name="check" size="sm" style={OK_STYLE} />
                {breaking.coverage.first}
              </div>
              {breaking.coverage.confirmed && (
                <div className="row t-small">
                  <Icon name="check" size="sm" style={OK_STYLE} />
                  {breaking.coverage.confirmed}
                </div>
              )}
              {breaking.teammate && (
                <div className="row t-small">
                  <span className="typing">
                    <i />
                    <i />
                    <i />
                  </span>
                  {breaking.teammate}
                </div>
              )}
            </div>
          )}
          <Link className="btn btn--ai btn--lg" to={studioLink(item.id)} onClick={writeDetailed}>
            <Icon name="sparkle" size="sm" />
            {C.writeDetailed}
          </Link>
        </aside>
      </div>
    </div>
  );
}

function DeskOutputs({ breaking }: { breaking: Breaking }) {
  if (breaking.error) return <StudioError error={breaking.error} onRetry={breaking.retry} />;
  if (!breaking.data || !breaking.post) return <DeskOutputsSkeleton />;

  const { data, post } = breaking;
  return (
    // Keyed by the outputs' arrival: fresh outputs remount the panels and `arrive` plays again.
    <Fragment key={breaking.generation}>
      <OutputPanel
        title={C.post}
        meta={postCount(data.post)}
        text={post.text}
        tags={post.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
        copied={breaking.copied === "post"}
        onCopy={() => breaking.copy("post", data.post)}
      />
      <OutputPanel
        title={C.ticker}
        meta={C.tickerMeta}
        text={data.ticker}
        copied={breaking.copied === "ticker"}
        onCopy={() => breaking.copy("ticker", data.ticker)}
      />
      <OutputPanel
        title={C.alert}
        meta={alertCount(data.alert)}
        text={data.alert}
        copied={breaking.copied === "alert"}
        onCopy={() => breaking.copy("alert", data.alert)}
      />
    </Fragment>
  );
}

function OutputPanel({
  title,
  meta,
  text,
  tags,
  copied,
  onCopy,
}: {
  title: string;
  meta: string;
  text: string;
  tags?: ReactNode;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="panel col arrive" style={PANEL_STYLE}>
      <div className="row" style={SPACE_BETWEEN}>
        <b style={PANEL_TITLE_STYLE}>{title}</b>
        <span className="t-meta num">{meta}</span>
      </div>
      <p style={OUTPUT_STYLE}>{text}</p>
      <div className="row" style={ACTIONS_STYLE}>
        {tags}
        <span className="grow" />
        <button className="btn btn--ink btn--sm" type="button" onClick={onCopy}>
          <Icon name="copy" size="sm" />
          {copied ? C.copied : C.copy}
        </button>
      </div>
    </div>
  );
}

/** While the editor writes: the three panels with their titles, the text as skeleton lines. */
function DeskOutputsSkeleton() {
  const titles: BreakingOutput[] = ["post", "ticker", "alert"];
  return (
    <>
      {titles.map((key) => (
        <div key={key} className="panel col" style={PANEL_STYLE} aria-hidden="true">
          <b style={PANEL_TITLE_STYLE}>{C[key]}</b>
          <Skeleton height="14px" width="90%" />
          <Skeleton height="14px" width="60%" />
        </div>
      ))}
    </>
  );
}
