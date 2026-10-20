import { BellRinging, BellSlash, PaperPlaneTilt } from "@phosphor-icons/react";
import type { PushNotificationStatus } from "@/hooks/usePushNotifications";
import { Notice } from "@/components/ui/Notice";
import { formatNumber } from "@/utils/format";

type NotificationsActionsProps = {
  status: PushNotificationStatus;
  lastTestSent: number | null;
  error: string | null;
  onEnable: () => void;
  onDisable: () => void;
  onSendTest: () => void;
};

export function NotificationsActions({ status, lastTestSent, error, onEnable, onDisable, onSendTest }: NotificationsActionsProps) {
  const busy = status === "busy";
  const subscribed = status === "subscribed";

  return (
    <section className="panel settings-block" aria-labelledby="notif-actions-title">
      <div className="panel-head">
        <h2 id="notif-actions-title" className="panel-title">التحكم</h2>
      </div>
      <div className="settings-body">
        <p className="hint">التفعيل يطلب إذن المتصفح لهذا الجهاز فقط. الإيقاف يلغي الاشتراك هنا دون المساس بحسابك.</p>
        <div className="settings-actions">
          {subscribed ? (
            <button type="button" className="btn btn-quiet" disabled={busy} onClick={onDisable}>
              <BellSlash size={20} aria-hidden="true" />
              إيقاف الإشعارات
            </button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={status !== "idle" || busy} onClick={onEnable}>
              {busy ? <span className="spinner" aria-hidden="true" /> : <BellRinging size={20} aria-hidden="true" />}
              {busy ? "جارٍ التفعيل…" : "فعّل الإشعارات"}
            </button>
          )}
          <button type="button" className="btn btn-ghost" disabled={!subscribed || busy} onClick={onSendTest}>
            <PaperPlaneTilt size={20} aria-hidden="true" />
            إرسال إشعار تجريبي
          </button>
        </div>
        {lastTestSent != null ? (
          <Notice tone="ok" role="status">وصل إشعار تجريبي إلى هذا الجهاز ({formatNumber(lastTestSent)}).</Notice>
        ) : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
      </div>
    </section>
  );
}
