// MobHome / MobHome-loading / MobHome-offline (S07) — port of docs/redesign/design/reference/MobHome.dc.html.
// Inline styles are the board's own. The offline `m-banner` above the header is the shell's (MainLayout).
// S13: «اللي فاتك» replaces the `main` with MobNewDigest's (MobDigest); the breaking card opens breaking mode.
import { Link } from "react-router-dom";
import { useNotificationNudge } from "@/components/shell/useNotificationNudge";
import { breakingPath } from "@/modules/News/breaking/breakingModel";
import type { StudioLinkState } from "@/modules/News/studio/studioLink";
import { AiPanel } from "@/ui/AiPanel";
import { Badge } from "@/ui/Badge";
import { Button, buttonClassName } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Panel } from "@/ui/Panel";
import { Skeleton } from "@/ui/Skeleton";
import { cx } from "@/ui/cx";
import { ARCHIVE_PATH, storyLink } from "../homeModel";
import type { Compose } from "../useCompose";
import type { Home } from "../useHome";
import { MobDigest } from "./MobDigest";

const SECTION_LINK_STYLE = { fontSize: "13px", fontWeight: 600 } as const;
const SMALL_BTN_STYLE = { minHeight: "42px" } as const;

export function MobHome({ home, compose, online }: { home: Home; compose: Compose; online: boolean }) {
  const nudge = useNotificationNudge();

  return (
    <>
      <header className="m-head">
        <div className="m-head__row">
          <span className="col grow">
            <span className="t-meta">{home.date}</span>
            <span className="m-title" style={{ fontSize: "25px" }}>
              {home.greeting}
            </span>
          </span>
          <Link
            className="icon-btn icon-btn--line"
            to="/notifications"
            aria-label={nudge ? "الإشعارات، تنبيه جديد" : "الإشعارات"}
          >
            <Icon name="bell" />
            {nudge && <span className="dot-badge" />}
          </Link>
        </div>
      </header>

      {home.digest.shown ? <MobDigest home={home} /> : <MobMain home={home} compose={compose} online={online} />}
    </>
  );
}

/** MobHome's `main`: the compose panel and the content (or MobHome-loading). */
function MobMain({ home, compose, online }: { home: Home; compose: Compose; online: boolean }) {
  return (
    <main className="m-scroll col" style={{ padding: "4px 16px 20px", gap: "18px" }}>
      <AiPanel as="section" className="col" style={{ padding: "14px", gap: "10px", opacity: online ? "1" : ".55" }}>
        <label className="field field--area field--sunken" style={{ minHeight: "76px" }}>
          <span className="sr">رابط أو فكرة</span>
          <textarea
            ref={compose.fieldRef}
            rows={2}
            placeholder="الصق رابطاً أو اكتب فكرة…"
            value={compose.text}
            onChange={(event) => compose.setText(event.target.value)}
          />
        </label>
        <Button
          variant="ai"
          block
          size="lg"
          loading={compose.pending}
          aria-disabled={compose.aiBlocked || undefined}
          onClick={compose.startAi}
        >
          {!compose.pending && <Icon name="sparkle" />}
          {compose.aiLabel}
        </Button>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
          <Link
            className={buttonClassName({ variant: "quiet", size: "sm" })}
            to="/generate"
            state={compose.generateState}
            style={SMALL_BTN_STYLE}
          >
            اكتب مقالاً
          </Link>
          <Link
            className={buttonClassName({ variant: "quiet", size: "sm" })}
            to="/translate"
            state={compose.translateState}
            style={SMALL_BTN_STYLE}
          >
            ترجم
          </Link>
        </div>
        {!online && (
          <p className="hint" style={{ justifyContent: "center" }}>
            المحرّر محتاج إنترنت. هيشتغل أول ما الشبكة ترجع.
          </p>
        )}
      </AiPanel>

      {home.loading ? <MobSkeleton /> : <MobContent home={home} />}
    </main>
  );
}

function MobContent({ home }: { home: Home }) {
  const { breaking, resume, rows } = home;
  return (
    <>
      {breaking && (
        <Link
          to={breakingPath(breaking.id)}
          state={{ item: breaking.item } satisfies StudioLinkState}
          className="col"
          style={{ gap: "8px", padding: "16px", borderRadius: "20px", color: "var(--ink)", background: "var(--breaking-soft)" }}
        >
          <span className="row" style={{ justifyContent: "space-between" }}>
            <Badge variant="breaking" style={{ background: "var(--surface)" }}>
              عاجل الآن
            </Badge>
            <span className="t-meta num">{breaking.meta}</span>
          </span>
          <span style={{ fontWeight: 700, fontSize: "16.5px", lineHeight: 1.6 }}>{breaking.title}</span>
          <span className="row" style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--breaking)" }}>
            اكتب عنه
            <Icon name="arrow-forward" size="sm" />
          </span>
        </Link>
      )}

      {resume.length > 0 && (
        <section className="m-section">
          <div className="m-section__head">
            <h2 className="t-head">كمّل شغلك</h2>
            <Link to={ARCHIVE_PATH} style={SECTION_LINK_STYLE}>
              الأرشيف
            </Link>
          </div>
          <div className="scroll-x" style={{ marginInline: "-16px", paddingInline: "16px" }}>
            {resume.map((d) => (
              <Link
                key={d.key}
                to={d.to}
                state={d.state}
                className="panel col"
                style={{ width: "220px", flex: "none", padding: "14px", gap: "8px", color: "var(--ink)" }}
              >
                <span className="row" style={{ justifyContent: "space-between" }}>
                  <Badge variant="ai">{d.name}</Badge>
                  {d.version && (
                    <span className="vchip num" style={{ height: "24px", minWidth: "28px" }}>
                      {d.version}
                    </span>
                  )}
                </span>
                <span style={{ fontWeight: 600, fontSize: "14.5px", lineHeight: 1.6 }}>{d.title}</span>
                <span className="t-meta">{d.time}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {rows.length > 0 && (
        <section className="m-section">
          <div className="m-section__head">
            <h2 className="t-head">أهم العناوين</h2>
            <Link to="/news" style={SECTION_LINK_STYLE}>
              الكل
            </Link>
          </div>
          <div className="m-list">
            {rows.map((r) => (
              <Link key={r.id} to={storyLink(r.id)} className={cx("m-row", r.freshness)}>
                <span className="tick" aria-hidden="true" />
                <span className="m-row__meta">
                  <b style={{ fontWeight: 600, color: "var(--ink-2)" }}>{r.source}</b>
                  <span className="grow" />
                  <span className="num">{r.time}</span>
                </span>
                <span className="m-row__title" style={{ fontSize: "15px" }}>
                  {r.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/** MobHome-loading: the breaking card, the «كمّل شغلك» cards and the headlines as skeletons. */
function MobSkeleton() {
  return (
    <>
      <Skeleton height="112px" radius="20px" />
      <div className="col" style={{ gap: "10px" }}>
        <Skeleton height="18px" width="30%" />
        <div className="row" style={{ gap: "10px" }}>
          <Skeleton height="120px" width="216px" radius="20px" style={{ flex: "none" }} />
          <Skeleton height="120px" width="140px" radius="20px" style={{ flex: "none" }} />
        </div>
      </div>
      <Panel className="col" style={{ padding: "14px 16px", gap: "14px" }}>
        <Skeleton height="18px" width="40%" />
        <Skeleton height="14px" />
        <Skeleton height="14px" width="80%" />
        <Skeleton height="14px" width="90%" />
      </Panel>
    </>
  );
}
