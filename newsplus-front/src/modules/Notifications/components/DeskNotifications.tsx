// DeskNotifications / DeskNotifications-off (S09 §A) — port of docs/redesign/design/reference/DeskNotifications.dc.html.
// The board's `main` is a div here: the shell already renders the content `<main>`.
import { AiPanel } from "@/ui/AiPanel";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Panel } from "@/ui/Panel";
import { Skeleton } from "@/ui/Skeleton";
import { Switch } from "@/ui/Switch";
import { orderedCallouts, statusCells, heroTitle } from "../notificationsModel";
import type { NotificationsScreenProps } from "./screenProps";
import { Benefits, CalloutNotice, Dot, PREVIEW_LOGO } from "./NotificationParts";

const BENEFITS = ["العاجل بس، مش كل خبر", "تضغط على الإشعار تفتح الخبر جاهز للكتابة", "تقدر توقفها في أي وقت"] as const;

export function DeskNotifications(props: NotificationsScreenProps) {
  const { checked, view, push, callout, heroSub, testLine, previewText, action, canToggle, canEnable, onToggle, onEnable, onDisable, onTest } =
    props;
  const busy = push.status === "busy";
  const on = view === "on";

  return (
    <div className="grow" style={{ padding: "36px 48px", overflowY: "auto" }}>
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.25fr 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <div className="col" style={{ gap: "20px" }}>
          <header className="col">
            <h1 className="t-hero" style={{ fontSize: "30px" }}>
              الإشعارات
            </h1>
            <p className="t-small">تنبيهات العاجل على هذا الجهاز، حتى لو التطبيق مقفول.</p>
          </header>

          <Panel as="section" className="col" style={{ padding: "22px", gap: "18px" }} aria-busy={!checked || undefined}>
            <div className="row" style={{ gap: "14px" }}>
              <span className="ic-wrap ic-wrap--teal" style={{ width: "48px", height: "48px", borderRadius: "14px" }}>
                <Icon name="bell" size="lg" />
              </span>
              {checked ? (
                <>
                  <span className="col grow">
                    <span className="t-head">{heroTitle(view)}</span>
                    <span className="t-meta">{heroSub}</span>
                  </span>
                  <Switch
                    checked={on}
                    label="إشعارات العاجل"
                    disabled={busy || !canToggle}
                    onCheckedChange={onToggle}
                  />
                </>
              ) : (
                <span className="col grow" style={{ gap: "6px" }}>
                  <Skeleton height={16} width="40%" />
                  <Skeleton height={12} width="60%" />
                </span>
              )}
            </div>
            {checked && (
              <>
                <hr className="hr" />
                <dl
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "12px",
                    margin: "1em 0",
                  }}
                >
                  {statusCells(push, "اشتراك الجهاز").map((cell) => (
                    <div
                      key={cell.label}
                      className="row panel panel--flat"
                      style={{ gap: "10px", padding: "12px 14px", background: "var(--surface-2)" }}
                    >
                      <Dot color={cell.dot} size={9} />
                      <span className="col">
                        <dt className="t-meta">{cell.label}</dt>
                        <dd style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>{cell.value}</dd>
                      </span>
                    </div>
                  ))}
                </dl>
                {on ? (
                  <div className="row" style={{ flexWrap: "wrap" }}>
                    <Button variant="quiet" disabled={busy && action !== "test"} loading={busy && action === "test"} onClick={onTest}>
                      <Icon name="send" />
                      أرسل إشعار تجربة
                    </Button>
                    {push.error ? (
                      <span className="hint hint--error" role="alert">
                        <Icon name="error-circle" size="sm" />
                        {push.error}
                      </span>
                    ) : (
                      testLine && (
                        <span className="hint hint--ok" role="status">
                          <Icon name="check" size="sm" />
                          {testLine}
                        </span>
                      )
                    )}
                    <span className="grow" />
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: "var(--breaking)" }}
                      disabled={busy && action !== "disable"}
                      loading={busy && action === "disable"}
                      onClick={onDisable}
                    >
                      إيقاف على هذا الجهاز
                    </Button>
                  </div>
                ) : (
                  <AiPanel className="col" style={{ padding: "18px", gap: "12px", boxShadow: "none" }}>
                    <b style={{ fontWeight: 600 }}>هتوصلك الأخبار العاجلة أول بأول</b>
                    <Benefits items={BENEFITS} />
                    <div className="row">
                      <Button
                        variant="ink"
                        disabled={!canEnable && action !== "enable"}
                        loading={busy && action === "enable"}
                        onClick={onEnable}
                      >
                        <Icon name="bell" />
                        فعّل الإشعارات
                      </Button>
                      {push.error ? (
                        <span className="hint hint--error" role="alert">
                          <Icon name="error-circle" size="sm" />
                          {push.error}
                        </span>
                      ) : (
                        <span className="hint">المتصفح هيطلب إذنك مرة واحدة</span>
                      )}
                    </div>
                  </AiPanel>
                )}
              </>
            )}
          </Panel>

          {previewText && (
            <section className="col" style={{ gap: "10px" }}>
              <h2 className="t-head">شكل الإشعار</h2>
              <Panel
                className="row"
                style={{ gap: "12px", padding: "14px 16px", maxWidth: "460px", borderRadius: "18px", boxShadow: "var(--shadow-2)" }}
              >
                <img src={PREVIEW_LOGO} alt="" style={{ width: "40px", height: "40px", borderRadius: "10px" }} />
                <span className="col grow">
                  <span className="row" style={{ justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, fontSize: "13.5px" }}>Newsplus · عاجل</span>
                    <span className="t-meta">الآن</span>
                  </span>
                  <span style={{ fontSize: "14px", lineHeight: 1.6 }}>{previewText}</span>
                </span>
              </Panel>
            </section>
          )}
        </div>

        <aside className="col" style={{ gap: "12px", paddingTop: "86px" }}>
          <h2 className="t-label">لو ظهرت لك رسالة من دول</h2>
          {orderedCallouts(callout).map((item) => (
            <CalloutNotice key={item.id} callout={item} />
          ))}
        </aside>
      </div>
    </div>
  );
}
