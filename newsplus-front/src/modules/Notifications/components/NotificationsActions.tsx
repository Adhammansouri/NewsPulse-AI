import type { PushNotificationStatus } from "@/hooks/usePushNotifications";

type NotificationsActionsProps = {
  status: PushNotificationStatus;
  lastTestSent: number | null;
  error: string | null;
  onEnable: () => void;
  onDisable: () => void;
  onSendTest: () => void;
};

export function NotificationsActions({
  status,
  lastTestSent,
  error,
  onEnable,
  onDisable,
  onSendTest,
}: NotificationsActionsProps) {
  const busy = status === "busy";
  const canEnable = status === "idle";
  const canDisable = status === "subscribed";
  const canTest = status === "subscribed";

  return (
    <section className="notifications-actions" aria-labelledby="notifications-actions-title">
      <h2 id="notifications-actions-title" className="notifications-actions__title">
        التحكم
      </h2>
      <p className="notifications-actions__copy">
        التفعيل يطلب إذن المتصفح لهذا الجهاز فقط. الإيقاف يلغي الاشتراك هنا دون حذف حسابك.
      </p>
      <div className="notifications-actions__row">
        {canDisable ? (
          <button type="button" className="brand-header-ghost-btn" disabled={busy} onClick={onDisable}>
            إيقاف الإشعارات
          </button>
        ) : (
          <button type="button" className="brand-btn" disabled={!canEnable || busy} onClick={onEnable}>
            {busy ? "جاري التحديث…" : "تفعيل الإشعارات"}
          </button>
        )}
        <button
          type="button"
          className="brand-header-ghost-btn"
          disabled={!canTest || busy}
          onClick={onSendTest}
        >
          إرسال تجريبي
        </button>
      </div>
      {lastTestSent != null ? (
        <p className="notifications-actions__note" role="status">
          أُرسلت تجربة إلى هذا الجهاز ({lastTestSent}).
        </p>
      ) : null}
      {error ? (
        <p className="notifications-actions__error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
