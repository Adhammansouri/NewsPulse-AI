// NewDigest (S13 §3–4) — port of docs/redesign/design/reference/NewDigest.dc.html: the home when «اللي فاتك» shows.
// Inline styles are the board's own; the board's `main` is a div (the shell renders the content `<main>`).
import { Link } from "react-router-dom";
import { BREAKING_COPY, breakingLink } from "@/modules/News/breaking/breakingModel";
import { AiPanel } from "@/ui/AiPanel";
import { Badge } from "@/ui/Badge";
import { Button, buttonClassName } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Panel } from "@/ui/Panel";
import { Skeleton } from "@/ui/Skeleton";
import { toArabicDigits } from "@/utils/arabic";
import { DIGEST_COPY as C } from "../digest";
import { storyLink } from "../homeModel";
import { sparkHeights, trendMeta } from "../trending";
import type { Home } from "../useHome";

const SPACE_BETWEEN = { justifyContent: "space-between" } as const;
const ROW_STYLE = { gap: "14px", padding: "12px 0", borderBottom: "1px solid var(--line)" } as const;
const NUMBER_STYLE = { fontSize: "22px", color: "var(--cyan)", width: "22px" } as const;

export function DeskDigest({ home }: { home: Home }) {
  const { breaking } = home;
  return (
    // overflowY auto (board: hidden), as DeskHome: the board's 900px fits; a shorter window scrolls.
    <div className="grow" style={{ padding: "30px 44px", overflowY: "auto" }}>
      <div className="col" style={{ maxWidth: "1200px", margin: "0 auto", gap: "22px" }}>
        <header className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
          <div className="col">
            <p className="t-meta">{home.date}</p>
            <h1 className="t-hero">{home.greeting}</h1>
          </div>
          {home.live && <p className="live">{home.live}</p>}
        </header>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
          <DigestPanel home={home} />
          <TrendsPanel home={home} />
        </div>
        {breaking && (
          <Link
            to={breakingLink(breaking.id)}
            className="panel row"
            style={{
              gap: "16px",
              padding: "16px 20px",
              color: "var(--ink)",
              background: "var(--breaking-soft)",
              borderColor: "transparent",
              boxShadow: "none",
            }}
          >
            <Badge variant="breaking" style={{ background: "var(--surface)" }}>
              {C.breakingNow}
            </Badge>
            <b className="grow" style={{ fontSize: "16px" }}>
              {breaking.title}
            </b>
            <span className={buttonClassName({ variant: "ink", size: "sm" })}>{C.breakingMode}</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function DigestPanel({ home }: { home: Home }) {
  const { digest } = home;
  return (
    <AiPanel as="section" className="col" style={{ padding: "22px 24px", gap: "6px" }} aria-busy={digest.loading || undefined}>
      <div className="row" style={SPACE_BETWEEN}>
        <span className="row">
          <span className="ic-wrap ic-wrap--ai" style={{ width: "34px", height: "34px", borderRadius: "10px" }}>
            <Icon name="sun" size="sm" />
          </span>
          <span className="col">
            <b style={{ fontSize: "17px", fontFamily: "var(--f-display)" }}>{digest.title}</b>
            {digest.loading ? <Skeleton height="10px" width="60%" /> : <span className="t-meta">{digest.meta}</span>}
          </span>
        </span>
        {!digest.loading && (
          <Button variant="ghost" size="sm" loading={digest.refreshing} disabled={digest.aiCooldown} onClick={digest.refresh}>
            {!digest.refreshing && <Icon name="refresh" size="sm" />}
            {C.refresh}
          </Button>
        )}
      </div>
      {digest.loading ? (
        <DigestSkeleton />
      ) : (
        <>
          <ol>
            {digest.rows.map((row) => (
              <li key={row.itemId} className="row" style={ROW_STYLE}>
                <span className="t-num" style={NUMBER_STYLE}>
                  {row.number}
                </span>
                <span className="col grow">
                  <b style={{ fontWeight: 600, fontSize: "15px" }}>{row.title}</b>
                  <span className="t-meta">{row.meta}</span>
                </span>
                <Link className={buttonClassName({ variant: "quiet", size: "sm" })} to={storyLink(row.itemId)}>
                  {C.writeAbout}
                </Link>
              </li>
            ))}
          </ol>
          <div className="row" style={{ paddingTop: "8px" }}>
            <Button variant="ai" disabled={digest.aiCooldown} onClick={digest.toBriefing}>
              <Icon name="sparkle" size="sm" />
              {C.toBriefing}
            </Button>
            <Button variant="ghost" onClick={digest.copySummary}>
              {digest.copied ? BREAKING_COPY.copied : C.copySummary}
            </Button>
          </div>
        </>
      )}
    </AiPanel>
  );
}

/** While the editor writes the digest: three numbered rows as skeleton lines (the DeskHome-loading lines). */
function DigestSkeleton() {
  const widths: Array<[string, string]> = [
    ["80%", "45%"],
    ["70%", "40%"],
    ["75%", "50%"],
  ];
  return (
    <ol aria-hidden="true">
      {widths.map(([title, meta], index) => (
        <li key={title} className="row" style={ROW_STYLE}>
          <span className="t-num" style={NUMBER_STYLE}>
            {toArabicDigits(index + 1)}
          </span>
          <span className="col grow" style={{ gap: "8px" }}>
            <Skeleton height="13px" width={title} />
            <Skeleton height="10px" width={meta} />
          </span>
        </li>
      ))}
    </ol>
  );
}

function TrendsPanel({ home }: { home: Home }) {
  if (!home.loading && home.trends.length === 0) return null;
  return (
    <Panel as="section" className="col" style={{ padding: "20px 22px", gap: "12px" }} aria-busy={home.loading || undefined}>
      <div className="row" style={SPACE_BETWEEN}>
        <b style={{ fontWeight: 600, fontSize: "16px" }}>{C.trendsTitle}</b>
        <span className="t-meta">{C.trendsFrom}</span>
      </div>
      {/* Loading: the 4 `trend` rows (12px radius) at their height on NewDigest.jpg. */}
      {home.loading
        ? [0, 1, 2, 3].map((index) => <Skeleton key={index} height="62px" radius="12px" />)
        : home.trends.map((trend) => (
            <div key={trend.topic} className="trend">
              <span className="col grow">
                <b style={{ fontWeight: 600, fontSize: "14px" }}>{trend.name}</b>
                <span className="t-meta">{trendMeta(trend.count)}</span>
              </span>
              <span className="spark" aria-hidden="true">
                {sparkHeights(trend.buckets, home.trendScale).map((height, index) => (
                  <i key={index} style={{ height: `${height}px` }} />
                ))}
              </span>
              <span className="t-meta" style={{ minWidth: "58px", textAlign: "end" }}>
                {trend.label}
              </span>
            </div>
          ))}
      {home.trendInsight && <p className="t-meta">{home.trendInsight}</p>}
    </Panel>
  );
}
