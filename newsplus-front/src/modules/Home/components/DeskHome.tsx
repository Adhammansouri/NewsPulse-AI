// DeskHome / DeskHome-loading / DeskHome-offline (S07) — port of docs/redesign/design/reference/DeskHome.dc.html.
// Inline styles are the board's own. The board's `main` is a div here: the shell renders the content `<main>`,
// and its offline banner heads the page (MainLayout), so offline the page starts one column gap (24px) below it.
import { Link } from "react-router-dom";
import { AiPanel } from "@/ui/AiPanel";
import { Badge } from "@/ui/Badge";
import { Button, buttonClassName } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Panel } from "@/ui/Panel";
import { Skeleton } from "@/ui/Skeleton";
import { cx } from "@/ui/cx";
import { ARCHIVE_MEMORY_PATH, ARCHIVE_PATH, storyLink } from "../homeModel";
import type { Compose } from "../useCompose";
import type { Home } from "../useHome";

const GRID_STYLE = { display: "grid", gridTemplateColumns: "1.15fr 1fr 0.85fr", gap: "18px" } as const;
const HEAD_STYLE = { justifyContent: "space-between", padding: "16px 20px 10px" } as const;
const HEAD_LINK_STYLE = { fontSize: "13.5px", fontWeight: 600 } as const;
const NUM_STYLE = { fontSize: "28px" } as const;

export function DeskHome({ home, compose, online }: { home: Home; compose: Compose; online: boolean }) {
  return (
    <div className="grow" style={{ padding: online ? "34px 48px 48px" : "24px 48px 48px", overflowY: "auto" }}>
      <div className="col" style={{ maxWidth: "1200px", margin: "0 auto", gap: "24px" }}>
        <header className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="col">
            <p className="t-meta">{home.date}</p>
            <h1 className="t-hero">{home.greeting}</h1>
          </div>
          {home.live && <p className="live">{home.live}</p>}
        </header>

        <DeskCompose compose={compose} />

        {home.loading ? <DeskSkeleton /> : <DeskContent home={home} />}
      </div>
    </div>
  );
}

function DeskCompose({ compose }: { compose: Compose }) {
  return (
    <AiPanel
      as="section"
      aria-labelledby="cmd-title"
      style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: "14px" }}
    >
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 id="cmd-title" className="t-head row">
          <span className="ic-wrap ic-wrap--ai" style={{ width: "30px", height: "30px", borderRadius: "9px" }}>
            <Icon name="sparkle" size="sm" />
          </span>
          ابدأ من رابط أو فكرة
        </h2>
        <span className="t-meta">المحرّر يتعرّف على الرابط تلقائياً</span>
      </div>
      <label className="field field--area" style={{ minHeight: "84px" }}>
        <span className="sr">رابط أو موضوع</span>
        <textarea
          ref={compose.fieldRef}
          rows={2}
          dir={compose.isUrl ? "ltr" : undefined}
          style={{ textAlign: "right", fontSize: "16px" }}
          value={compose.text}
          onChange={(event) => compose.setText(event.target.value)}
        />
      </label>
      <div className="row" style={{ flexWrap: "wrap" }}>
        {compose.isUrl && (
          <Badge variant="teal">
            <Icon name="check" size="sm" />
            رابط من {compose.host}
          </Badge>
        )}
        <span className="grow" />
        <Link className={buttonClassName({ variant: "ghost" })} to="/translate" state={compose.translateState}>
          <Icon name="translate" />
          ترجم
        </Link>
        <Link className={buttonClassName({ variant: "quiet" })} to="/generate" state={compose.generateState}>
          <Icon name="pen" />
          اكتب مقالاً
        </Link>
        <Button
          variant="ai"
          loading={compose.pending}
          aria-disabled={compose.aiBlocked || undefined}
          onClick={compose.startAi}
        >
          {!compose.pending && <Icon name="sparkle" />}
          {compose.aiLabel}
        </Button>
      </div>
    </AiPanel>
  );
}

function DeskContent({ home }: { home: Home }) {
  const { breaking, resume, rows, stats, memory } = home;
  return (
    <>
      {breaking && (
        <Link
          to={storyLink(breaking.id)}
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
          <span className="ic-wrap ic-wrap--breaking" style={{ background: "var(--surface)" }}>
            <Icon name="bolt" />
          </span>
          <span className="col grow">
            <span className="row">
              <Badge variant="breaking" style={{ background: "var(--surface)" }}>
                عاجل الآن
              </Badge>
              <span className="t-meta num">{breaking.meta}</span>
            </span>
            <span style={{ fontWeight: 700, fontSize: "16.5px", marginTop: "4px" }}>{breaking.title}</span>
          </span>
          <span className={buttonClassName({ variant: "ink", size: "sm" })}>اكتب عنه</span>
        </Link>
      )}

      <div style={GRID_STYLE}>
        {resume.length > 0 && (
          // minWidth 0: lets the board's `ellipsis` titles truncate instead of widening the 1.15fr track.
          <Panel as="section" aria-labelledby="resume-title" style={{ paddingBottom: "6px", minWidth: 0 }}>
            <div className="row" style={HEAD_STYLE}>
              <h2 id="resume-title" className="t-head">
                كمّل شغلك
              </h2>
              <Link to={ARCHIVE_PATH} style={HEAD_LINK_STYLE}>
                الأرشيف
              </Link>
            </div>
            <ul>
              {resume.map((d) => (
                <li key={d.key}>
                  <Link
                    to={d.to}
                    state={d.state}
                    className="row"
                    style={{ gap: "14px", padding: "12px 20px", color: "var(--ink)", borderTop: "1px solid var(--line)" }}
                  >
                    <span
                      className={cx("ic-wrap", d.icon)}
                      style={{ width: "42px", height: "42px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}
                    >
                      {d.kind}
                    </span>
                    <span className="col grow">
                      <span className="ellipsis" style={{ fontWeight: 600 }}>
                        {d.title}
                      </span>
                      <span className="t-meta">{d.meta}</span>
                    </span>
                    <Icon name="arrow-forward" size="sm" style={{ color: "var(--ink-3)" }} />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {rows.length > 0 && (
          <Panel as="section" aria-labelledby="top-title" style={{ overflow: "hidden" }}>
            <div className="row" style={HEAD_STYLE}>
              <h2 id="top-title" className="t-head">
                أهم العناوين الآن
              </h2>
              <Link to="/news" style={HEAD_LINK_STYLE}>
                غرفة الأخبار
              </Link>
            </div>
            <div style={{ borderTop: "1px solid var(--line)" }}>
              {rows.map((row) => (
                <Link key={row.id} to={storyLink(row.id)} className={cx("wire-row", row.freshness)}>
                  <span className="tick" aria-hidden="true" />
                  <span className="wire-row__meta">
                    <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>{row.source}</span>
                    <span className="grow" />
                    <span className="num">{row.time}</span>
                  </span>
                  <span className="wire-row__title" style={{ fontSize: "14.5px" }}>
                    {row.title}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>
        )}

        {(stats || memory) && (
          <section className="col" style={{ gap: "18px" }}>
            {stats && (
              <Panel className="col" style={{ padding: "18px 20px", gap: "12px" }}>
                <h2 className="t-head">شغلك النهارده</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
                  {stats.map((stat) => (
                    <div key={stat.label} className="col">
                      <span className="t-num" style={NUM_STYLE}>
                        {stat.value}
                      </span>
                      <span className="t-meta">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
            {memory && (
              <Link
                to={ARCHIVE_MEMORY_PATH}
                className="ai-panel col"
                style={{ padding: "18px 20px", gap: "8px", color: "var(--ink)", boxShadow: "none" }}
              >
                <span className="row">
                  <Icon name="memory" style={{ color: "var(--cyan)" }} />
                  <span className="t-label t-ai">المحرّر تعلّم قاعدة جديدة</span>
                </span>
                <p style={{ fontSize: "14px", lineHeight: 1.7 }}>{memory.rule}</p>
                <span className="t-meta">ذاكرة الفريق · {memory.count}</span>
              </Link>
            )}
          </section>
        )}
      </div>
    </>
  );
}

/** DeskHome-loading: the breaking strip and the three columns as skeletons. */
function DeskSkeleton() {
  const resumeRows: Array<[string, string]> = [
    ["80%", "45%"],
    ["70%", "40%"],
    ["75%", "50%"],
  ];
  return (
    <>
      <Skeleton height="82px" radius="20px" />
      <div style={GRID_STYLE}>
        <Panel className="col" style={{ padding: "18px 20px", gap: "16px" }}>
          <Skeleton height="18px" width="35%" />
          {resumeRows.map(([title, meta]) => (
            <div key={title} className="row">
              <Skeleton width="42px" height="42px" radius="12px" />
              <div className="col grow" style={{ gap: "8px" }}>
                <Skeleton height="13px" width={title} />
                <Skeleton height="10px" width={meta} />
              </div>
            </div>
          ))}
        </Panel>
        <Panel className="col" style={{ padding: "18px 20px", gap: "16px" }}>
          <Skeleton height="18px" width="45%" />
          <Skeleton height="14px" />
          <Skeleton height="14px" width="80%" />
          <Skeleton height="14px" width="90%" />
          <Skeleton height="14px" width="70%" />
        </Panel>
        <Skeleton height="240px" radius="20px" />
      </div>
    </>
  );
}
