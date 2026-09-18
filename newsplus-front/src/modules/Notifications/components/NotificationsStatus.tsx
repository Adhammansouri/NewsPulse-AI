import type { PushNotificationStatus } from "@/hooks/usePushNotifications";

type ChipTone = "ok" | "warn" | "muted";

type StatusItem = {
  label: string;
  value: string;
  tone: ChipTone;
};

type NotificationsStatusProps = {
  status: PushNotificationStatus;
  permission: NotificationPermission | "unavailable";
  vapidConfigured: boolean | null;
  hasSubscription: boolean;
};

function permissionChip(permission: NotificationPermission | "unavailable"): Omit<StatusItem, "label"> {
  if (permission === "granted") return { value: "مسموح", tone: "ok" };
  if (permission === "denied") return { value: "محظور", tone: "warn" };
  if (permission === "default") return { value: "لم يُطلب", tone: "muted" };
  return { value: "غير متاح", tone: "muted" };
}

function flagChip(value: boolean | null, yes: string, no: string): Omit<StatusItem, "label"> {
  if (value == null) return { value: "غير معروف", tone: "muted" };
  return value ? { value: yes, tone: "ok" } : { value: no, tone: "muted" };
}

export function NotificationsStatus({
  status,
  permission,
  vapidConfigured,
  hasSubscription,
}: NotificationsStatusProps) {
  const browserSupported = status !== "unsupported";
  const items: StatusItem[] = [
    {
      label: "المتصفح",
      value: browserSupported ? "يدعم الدفع" : "غير مدعوم",
      tone: browserSupported ? "ok" : "warn",
    },
    { label: "إذن النظام", ...permissionChip(permission) },
    { label: "اشتراك الدفع", ...flagChip(hasSubscription, "مشترك", "غير مشترك") },
    { label: "مفتاح الخادم", ...flagChip(vapidConfigured, "مُعدّ", "غير مُعدّ") },
  ];

  return (
    <section className="notifications-status" aria-labelledby="notifications-status-title">
      <h2 id="notifications-status-title" className="notifications-status__title">
        الحالة الحالية
      </h2>
      <dl className="notifications-status__grid">
        {items.map((item) => (
          <div key={item.label} className="notifications-status__cell">
            <dt>{item.label}</dt>
            <dd>
              <span className={`notifications-chip notifications-chip--${item.tone}`}>{item.value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
