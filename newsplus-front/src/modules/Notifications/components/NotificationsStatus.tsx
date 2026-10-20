import { CheckCircle, MinusCircle, WarningCircle } from "@phosphor-icons/react";
import type { PushNotificationStatus } from "@/hooks/usePushNotifications";

type Tone = "ok" | "warn" | "muted";
type Row = { label: string; value: string; tone: Tone };

type NotificationsStatusProps = {
  status: PushNotificationStatus;
  permission: NotificationPermission | "unavailable";
  vapidConfigured: boolean | null;
  hasSubscription: boolean;
};

function permissionRow(permission: NotificationPermission | "unavailable"): Omit<Row, "label"> {
  if (permission === "granted") return { value: "مسموح", tone: "ok" };
  if (permission === "denied") return { value: "محظور", tone: "warn" };
  if (permission === "default") return { value: "لم يُطلب بعد", tone: "muted" };
  return { value: "غير متاح", tone: "muted" };
}

function flagRow(value: boolean | null, yes: string, no: string): Omit<Row, "label"> {
  if (value == null) return { value: "غير معروف", tone: "muted" };
  return value ? { value: yes, tone: "ok" } : { value: no, tone: "muted" };
}

const ICONS = { ok: CheckCircle, warn: WarningCircle, muted: MinusCircle } as const;

export function NotificationsStatus({ status, permission, vapidConfigured, hasSubscription }: NotificationsStatusProps) {
  const supported = status !== "unsupported";
  const rows: Row[] = [
    { label: "دعم المتصفح", value: supported ? "يدعم الدفع" : "غير مدعوم", tone: supported ? "ok" : "warn" },
    { label: "إذن المتصفح", ...permissionRow(permission) },
    { label: "اشتراك هذا الجهاز", ...flagRow(hasSubscription, "مشترك", "غير مشترك") },
    { label: "مفتاح الخادم", ...flagRow(vapidConfigured, "مُعدّ", "غير مُعدّ") },
  ];

  return (
    <section className="panel settings-block" aria-labelledby="notif-status-title">
      <div className="panel-head">
        <h2 id="notif-status-title" className="panel-title">الحالة الحالية</h2>
      </div>
      <dl className="status-list">
        {rows.map((row) => {
          const Icon = ICONS[row.tone];
          return (
            <div key={row.label} className="status-row">
              <dt>{row.label}</dt>
              <dd className={`is-${row.tone}`}>
                <Icon size={18} weight="fill" aria-hidden="true" />
                {row.value}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
