// MobNotif / MobNotif-off / MobNotif-blocked (S09 §A) — port of docs/redesign/design/reference/MobNotif.dc.html.
// Inline styles are the board's own.
import { AiPanel } from "@/ui/AiPanel";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { Icon } from "@/ui/Icon";
import { Panel } from "@/ui/Panel";
import { Skeleton } from "@/ui/Skeleton";
import { Switch } from "@/ui/Switch";
import { toArabicDigits } from "@/utils/arabic";
import { CALLOUTS, statusCells } from "../notificationsModel";
import { MobBackLink } from "@/components/shell/MobBackLink";
import { Benefits, CalloutNotice, Dot, PREVIEW_LOGO } from "./NotificationParts";
import type { NotificationsScreenProps } from "./screenProps";

const BENEFITS = ["العاجل بس، مش كل خبر", "تضغط عليه يفتح الخبر جاهز للكتابة", "تقدر توقفه في أي وقت"] as const;

const BLOCKED_STEPS = ["افتح الإعدادات ← Newsplus", "اختار «الإشعارات» وفعّل «السماح»", "ارجع هنا واضغط «تحقّق تاني»"] as const;

const STEP_DOT_STYLE = {
  background: "var(--surface-2)",
  borderColor: "var(--line-strong)",
  color: "var(--ink-2)",
  fontSize: "12px",
  fontWeight: 700,
} as const;

const HERO_ITEM_STYLE = { minHeight: "76px" } as const;
const HERO_ICON_STYLE = { width: "44px", height: "44px", borderRadius: "13px" } as const;

export function MobNotifications(props: NotificationsScreenProps) {
  const { checked, view, push, callout } = props;

  return (
    <>
      <header className="m-head">
        <div className="m-head__row">
          <MobBackLink />
          <span className="m-title">الإشعارات</span>
        </div>
        <p className="t-meta">تنبيهات العاجل على هذا الجهاز، حتى والتطبيق مقفول</p>
      </header>
      <main className="m-scroll col" style={{ padding: "8px 16px 24px", gap: "18px" }} aria-busy={!checked || undefined}>
        {!checked ? (
          <div className="m-list">
            <div className="m-item" style={HERO_ITEM_STYLE}>
              <span className="ic-wrap" style={HERO_ICON_STYLE}>
                <Icon name="bell" />
              </span>
              <span className="m-item__label" style={{ gap: "6px" }}>
                <Skeleton height={14} width="45%" />
                <Skeleton height={12} width="65%" />
              </span>
            </div>
          </div>
        ) : push.status === "blocked" ? (
          <Blocked {...props} />
        ) : view === "on" ? (
          <On {...props} />
        ) : (
          <Off {...props} notice={callout ? CALLOUTS.find((item) => item.id === callout) : undefined} />
        )}
      </main>
    </>
  );
}

function ResultHint({ error, ok, neutral }: { error: string | null; ok?: string | null; neutral?: string }) {
  if (error) {
    return (
      <p className="hint hint--error" role="alert" style={{ justifyContent: "center" }}>
        <Icon name="error-circle" size="sm" />
        {error}
      </p>
    );
  }
  if (ok) {
    return (
      <p className="hint hint--ok" role="status" style={{ justifyContent: "center" }}>
        <Icon name="check" size="sm" />
        {ok}
      </p>
    );
  }
  return neutral ? (
    <p className="hint" style={{ justifyContent: "center" }}>
      {neutral}
    </p>
  ) : null;
}

function On({ push, mobileOnLine, testLine, previewText, action, canToggle, onToggle, onTest }: NotificationsScreenProps) {
  const busy = push.status === "busy";
  return (
    <>
      <div className="m-list">
        <div className="m-item" style={HERO_ITEM_STYLE}>
          <span className="ic-wrap ic-wrap--teal" style={HERO_ICON_STYLE}>
            <Icon name="bell" />
          </span>
          <span className="m-item__label">
            إشعارات العاجل<small>{mobileOnLine}</small>
          </span>
          <Switch checked label="إشعارات العاجل" disabled={busy || !canToggle} onCheckedChange={onToggle} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {statusCells(push, "الاشتراك").map((cell) => (
          <Panel key={cell.label} className="row" style={{ gap: "8px", padding: "12px", boxShadow: "none" }}>
            <Dot color={cell.dot} size={8} />
            <span className="col">
              <span className="t-meta" style={{ fontSize: "11.5px" }}>
                {cell.label}
              </span>
              <b style={{ fontSize: "13.5px", fontWeight: 600 }}>{cell.value}</b>
            </span>
          </Panel>
        ))}
      </div>
      {previewText && (
        <section className="col" style={{ gap: "8px" }}>
          <h2 className="t-label">شكل الإشعار</h2>
          <Panel className="row" style={{ gap: "12px", padding: "12px 14px", borderRadius: "20px", boxShadow: "var(--shadow-2)" }}>
            <img src={PREVIEW_LOGO} alt="" style={{ width: "38px", height: "38px", borderRadius: "10px" }} />
            <span className="col grow">
              <span className="row" style={{ justifyContent: "space-between" }}>
                <b style={{ fontSize: "13px" }}>Newsplus · عاجل</b>
                <span className="t-meta">الآن</span>
              </span>
              <span style={{ fontSize: "14px", lineHeight: 1.55 }}>{previewText}</span>
            </span>
          </Panel>
        </section>
      )}
      <Button variant="quiet" block disabled={busy && action !== "test"} loading={busy && action === "test"} onClick={onTest}>
        <Icon name="send" />
        أرسل إشعار تجربة
      </Button>
      <ResultHint error={push.error} ok={testLine} />
    </>
  );
}

function Off({
  push,
  action,
  canToggle,
  canEnable,
  onToggle,
  onEnable,
  notice,
}: NotificationsScreenProps & { notice?: (typeof CALLOUTS)[number] }) {
  const busy = push.status === "busy";
  return (
    <>
      {notice ? (
        <CalloutNotice callout={notice} />
      ) : (
        <div className="m-list">
          <div className="m-item" style={HERO_ITEM_STYLE}>
            <span className="ic-wrap" style={HERO_ICON_STYLE}>
              <Icon name="bell" />
            </span>
            <span className="m-item__label">
              إشعارات العاجل<small>مش مفعّلة على الجهاز ده</small>
            </span>
            <Switch checked={false} label="إشعارات العاجل" disabled={busy || !canToggle} onCheckedChange={onToggle} />
          </div>
        </div>
      )}
      <AiPanel as="section" className="col" style={{ padding: "18px", gap: "12px", boxShadow: "none" }}>
        <b style={{ fontWeight: 600 }}>العاجل يوصلك أول بأول</b>
        <Benefits items={BENEFITS} />
      </AiPanel>
      <Panel
        className="row"
        style={{ gap: "12px", padding: "12px 14px", borderRadius: "20px", boxShadow: "var(--shadow-2)", opacity: 0.7 }}
      >
        <img src={PREVIEW_LOGO} alt="" style={{ width: "38px", height: "38px", borderRadius: "10px" }} />
        <span className="col grow">
          <b style={{ fontSize: "13px" }}>Newsplus · عاجل</b>
          <span style={{ fontSize: "14px", lineHeight: 1.55 }}>شكل الإشعار اللي هيوصلك</span>
        </span>
      </Panel>
      <Button
        variant="ink"
        block
        size="lg"
        disabled={!canEnable && action !== "enable"}
        loading={busy && action === "enable"}
        onClick={onEnable}
      >
        فعّل الإشعارات
      </Button>
      <ResultHint error={push.error} neutral="الجهاز هيطلب إذنك مرة واحدة" />
    </>
  );
}

function Blocked({ action, onCheck }: NotificationsScreenProps) {
  return (
    <>
      <EmptyState
        style={{ paddingTop: "24px" }}
        art={<Icon name="bell-off" size="xl" />}
        artStyle={{ background: "var(--warn-soft)", color: "var(--warn)" }}
        title="الإشعارات محظورة"
        description="المتصفح منع Newsplus من إرسال إشعارات. فعّلها من إعدادات الجهاز:"
        descriptionStyle={{ maxWidth: "300px" }}
      />
      <ol className="steps panel" style={{ padding: "18px", gap: "14px", boxShadow: "none" }}>
        {BLOCKED_STEPS.map((step, index) => (
          <li key={step} className="step is-done">
            <span className="step__dot" style={STEP_DOT_STYLE}>
              {toArabicDigits(index + 1)}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <Button variant="ink" block size="lg" loading={action === "check"} onClick={onCheck}>
        تحقّق تاني
      </Button>
    </>
  );
}
