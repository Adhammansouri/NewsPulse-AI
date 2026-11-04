// MobNewDigest (S13 §3–4) — port of the `main` of docs/redesign/design/reference/MobNewDigest.dc.html: the home
// when «اللي فاتك» shows (the `m-head` is MobHome's). Inline styles are the board's own.
import { Link } from "react-router-dom";
import { BREAKING_COPY, breakingPath } from "@/modules/News/breaking/breakingModel";
import type { StudioLinkState } from "@/modules/News/studio/studioLink";
import { AiPanel } from "@/ui/AiPanel";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Skeleton } from "@/ui/Skeleton";
import { toArabicDigits } from "@/utils/arabic";
import { DIGEST_COPY as C } from "../digest";
import { MOB_SPARK_BARS, sparkHeights, trendCount } from "../trending";
import type { Home } from "../useHome";

const ROW_STYLE = { gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--line)" } as const;
const NUMBER_STYLE = { fontSize: "18px", color: "var(--cyan)", width: "18px" } as const;
const ACTION_STYLE = { minHeight: "42px" } as const;

export function MobDigest({ home }: { home: Home }) {
  const { digest, breaking } = home;
  const rising = home.trends.filter((trend) => trend.rising);
  /** One scale for the bars drawn: the last 5 buckets of each card. */
  const scale = Math.max(0, ...rising.flatMap((trend) => trend.buckets.slice(-MOB_SPARK_BARS)));
  return (
    <main className="m-scroll col" style={{ padding: "4px 16px 16px", gap: "16px" }}>
      <AiPanel as="section" className="col" style={{ padding: "16px", gap: "4px" }} aria-busy={digest.loading || undefined}>
        <div className="row">
          <span className="ic-wrap ic-wrap--ai" style={{ width: "32px", height: "32px", borderRadius: "10px" }}>
            <Icon name="sun" size="sm" />
          </span>
          <span className="col">
            <b style={{ fontFamily: "var(--f-display)", fontSize: "16px" }}>{C.mobTitle}</b>
            {digest.loading ? <Skeleton height="10px" width="60%" /> : <span className="t-meta">{digest.mobMeta}</span>}
          </span>
        </div>
        {digest.loading ? (
          <ol aria-hidden="true">
            {["80%", "70%", "75%"].map((width, index) => (
              <li key={width} className="row" style={ROW_STYLE}>
                <span className="t-num" style={NUMBER_STYLE}>
                  {toArabicDigits(index + 1)}
                </span>
                <span className="col grow" style={{ gap: "8px" }}>
                  <Skeleton height="13px" width={width} />
                  <Skeleton height="10px" width="35%" />
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <>
            <ol>
              {digest.rows.map((row) => (
                <li key={row.itemId} className="row" style={ROW_STYLE}>
                  <span className="t-num" style={NUMBER_STYLE}>
                    {row.number}
                  </span>
                  <span className="col grow">
                    <b style={{ fontWeight: 600, fontSize: "14.5px", lineHeight: 1.6 }}>{row.title}</b>
                    {row.sources && <span className="t-meta">{row.sources}</span>}
                  </span>
                </li>
              ))}
            </ol>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" }}>
              <Button variant="quiet" size="sm" style={ACTION_STYLE} onClick={digest.copySummary}>
                {digest.copied ? BREAKING_COPY.copied : C.copySummary}
              </Button>
              <Button variant="ai" size="sm" style={ACTION_STYLE} onClick={digest.toBriefing}>
                <Icon name="sparkle" size="sm" />
                {C.mobToBriefing}
              </Button>
            </div>
          </>
        )}
      </AiPanel>

      {rising.length > 0 && (
        <section className="m-section">
          <div className="m-section__head">
            <h2 className="t-head">{C.mobTrendsTitle}</h2>
            <span className="t-meta">{C.mobTrendsSpan}</span>
          </div>
          <div className="scroll-x" style={{ marginInline: "-16px", paddingInline: "16px" }}>
            {rising.map((trend) => (
              <div key={trend.topic} className="trend" style={{ flex: "none", minWidth: "150px" }}>
                <span className="col grow">
                  <b style={{ fontWeight: 600, fontSize: "13.5px" }}>{trend.name}</b>
                  <span className="t-meta">{trendCount(trend.count)}</span>
                </span>
                <span className="spark" aria-hidden="true">
                  {sparkHeights(trend.buckets.slice(-MOB_SPARK_BARS), scale).map((height, index) => (
                    <i key={index} style={{ height: `${height}px` }} />
                  ))}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {breaking && (
        <Link
          to={breakingPath(breaking.id)}
          state={{ item: breaking.item } satisfies StudioLinkState}
          className="col"
          style={{ gap: "6px", padding: "14px 16px", borderRadius: "20px", color: "var(--ink)", background: "var(--breaking-soft)" }}
        >
          <span className="row" style={{ justifyContent: "space-between" }}>
            <Badge variant="breaking" style={{ background: "var(--surface)" }}>
              {C.breakingNow}
            </Badge>
            <span className="t-meta num">{breaking.time}</span>
          </span>
          <b style={{ fontSize: "15.5px", lineHeight: 1.6 }}>{breaking.title}</b>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--breaking)" }}>{C.mobBreakingMode}</span>
        </Link>
      )}
    </main>
  );
}
