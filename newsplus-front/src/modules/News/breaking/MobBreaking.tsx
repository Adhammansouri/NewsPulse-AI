// MobNewBreaking (S13 §2) — port of docs/redesign/design/reference/MobNewBreaking.dc.html. Inline styles are the
// board's own. «اكتب منشور مفصّل» opens the story screen with the social post starting, as the wire's swipe does.
import { Fragment, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { NewsFeedItem } from "@newsplus/shared";
import { Icon } from "@/ui/Icon";
import { Skeleton } from "@/ui/Skeleton";
import { Switch } from "@/ui/Switch";
import { StudioError } from "../studio/StudioError";
import { storyPath, type StudioLinkState } from "../studio/studioLink";
import { alertCount, BREAKING_COPY as C, mobReadyBadge, postCount } from "./breakingModel";
import { Elapsed } from "./Elapsed";
import { useBreaking, type Breaking, type BreakingOutput } from "./useBreaking";

const PANEL_STYLE = { padding: "14px", gap: "8px" } as const;
const PANEL_TITLE_STYLE = { fontWeight: 600, fontSize: "13.5px" } as const;
const OUTPUT_STYLE = { fontSize: "15px", lineHeight: 1.75, fontWeight: 600 } as const;
const COPY_STYLE = { alignSelf: "flex-start" } as const;
const SPACE_BETWEEN = { justifyContent: "space-between" } as const;

/** Where «رجوع» goes when the app did not navigate here (the board's MobWire link). */
const BACK_HREF = "/news";

export function MobBreaking({ item }: { item: NewsFeedItem }) {
  const breaking = useBreaking(item, { mobile: true });
  const location = useLocation();
  const navigate = useNavigate();

  function back(event: MouseEvent<HTMLAnchorElement>) {
    if (location.key === "default") return;
    event.preventDefault();
    navigate(-1);
  }

  const write: StudioLinkState = { item, write: "social" };
  return (
    <>
      <div
        className="breaking-bar"
        role="status"
        style={{ padding: "14px 16px", flexDirection: "column", alignItems: "stretch", gap: "6px" }}
      >
        <div className="row" style={{ position: "relative", justifyContent: "space-between" }}>
          <Link className="icon-btn" to={BACK_HREF} aria-label={C.back} style={{ color: "#fff" }} onClick={back}>
            <Icon name="arrow-back" />
          </Link>
          <span className="row" style={{ gap: "6px", fontSize: "13px" }}>
            <Icon name="clock" size="sm" />
            <Elapsed since={breaking.firstAt} /> {C.sinceFirst}
          </span>
        </div>
        <span
          className="badge"
          style={{ position: "relative", alignSelf: "flex-start", background: "rgb(255 255 255 / .2)", color: "#fff" }}
        >
          {C.badge}
        </span>
        <b style={{ position: "relative", fontFamily: "var(--f-display)", fontSize: "19px", lineHeight: 1.5 }}>{item.title}</b>
      </div>
      <main className="m-scroll col" style={{ padding: "14px 16px", gap: "12px" }} aria-busy={breaking.loading || undefined}>
        {breaking.data && (
          <div className="row" style={SPACE_BETWEEN}>
            <b style={{ fontWeight: 600 }}>{C.mobReady}</b>
            <span className="badge badge--ai">{mobReadyBadge(breaking.data.ms)}</span>
          </div>
        )}
        <MobOutputs breaking={breaking} />
        <div className="m-list">
          <div className="m-item">
            <span className="m-item__label">
              {C.mobAutoUpdate}
              <small>{C.mobAutoUpdateHint}</small>
            </span>
            <Switch checked={breaking.autoUpdate} onCheckedChange={breaking.setAutoUpdate} label={C.autoUpdateLabel} />
          </div>
        </div>
      </main>
      <div className="m-cta">
        <Link className="btn btn--ai btn--block btn--lg" to={storyPath(item.id)} state={write}>
          <Icon name="sparkle" size="sm" />
          {C.writeDetailed}
        </Link>
      </div>
    </>
  );
}

function MobOutputs({ breaking }: { breaking: Breaking }) {
  if (breaking.error) return <StudioError error={breaking.error} onRetry={breaking.retry} />;
  if (!breaking.data || !breaking.post) return <MobOutputsSkeleton />;

  const { data, post } = breaking;
  const panels: Array<{ key: BreakingOutput; meta: string; text: string; copyText: string }> = [
    { key: "post", meta: postCount(data.post), text: post.text, copyText: data.post },
    { key: "ticker", meta: C.tickerMeta, text: data.ticker, copyText: data.ticker },
    { key: "alert", meta: alertCount(data.alert), text: data.alert, copyText: data.alert },
  ];
  return (
    // Keyed by the outputs' arrival: fresh outputs remount the panels and `arrive` plays again.
    <Fragment key={breaking.generation}>
      {panels.map((panel) => (
        <div key={panel.key} className="panel col arrive" style={PANEL_STYLE}>
          <div className="row" style={SPACE_BETWEEN}>
            <b style={PANEL_TITLE_STYLE}>{C[panel.key]}</b>
            <span className="t-meta num">{panel.meta}</span>
          </div>
          <p style={OUTPUT_STYLE}>{panel.text}</p>
          <button
            className="btn btn--ink btn--sm"
            type="button"
            style={COPY_STYLE}
            onClick={() => breaking.copy(panel.key, panel.copyText)}
          >
            <Icon name="copy" size="sm" />
            {breaking.copied === panel.key ? C.copied : C.copy}
          </button>
        </div>
      ))}
    </Fragment>
  );
}

/** While the editor writes: the three panels with their titles, the text as skeleton lines. */
function MobOutputsSkeleton() {
  const keys: BreakingOutput[] = ["post", "ticker", "alert"];
  return (
    <>
      {keys.map((key) => (
        <div key={key} className="panel col" style={PANEL_STYLE} aria-hidden="true">
          <b style={PANEL_TITLE_STYLE}>{C[key]}</b>
          <Skeleton height="14px" width="90%" />
          <Skeleton height="14px" width="60%" />
        </div>
      ))}
    </>
  );
}
