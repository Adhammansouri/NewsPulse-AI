// Maps `usePushNotifications` to the DeskNotifications / MobNotif boards (S09 §A).
import type { NewsFeedItem } from "@newsplus/shared";
import type { PushNotificationStatus } from "@/hooks/usePushNotifications";
import type { IconName } from "@/ui/Icon";
import type { NoticeVariant } from "@/ui/Notice";
import { relativeTimeAr } from "@/utils/arabic";
import { deviceLabel, type DeviceInfo } from "./device";

/** `on` = DeskNotifications / MobNotif, `off` = the «-off» boards (MobNotif-blocked is `off` + the blocked callout on mobile). */
export type NotifView = "on" | "off";

/** The «لو ظهرت لك رسالة من دول» callouts, in the board's order. */
export type CalloutId = "ios" | "blocked" | "unsupported" | "vapid";

export type Callout = {
  id: CalloutId;
  variant: NoticeVariant;
  /** Extra `ic-wrap` modifier of the callout icon (the info callout has none). */
  iconWrap?: string;
  icon: IconName;
  title: string;
  text: string;
};

export const CALLOUTS: ReadonlyArray<Callout> = [
  {
    id: "ios",
    variant: "info",
    icon: "share-up",
    title: "على الآيفون: ثبّت التطبيق أولاً",
    text: "من Safari اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية»، وافتح Newsplus من الأيقونة.",
  },
  {
    id: "blocked",
    variant: "warn",
    iconWrap: "ic-wrap--warn",
    icon: "warning",
    title: "الإذن محظور في المتصفح",
    text: "افتح إعدادات الموقع، اسمح بالإشعارات، ثم أعد تحميل الصفحة.",
  },
  {
    id: "unsupported",
    variant: "warn",
    iconWrap: "ic-wrap--warn",
    icon: "close",
    title: "المتصفح لا يدعم الإشعارات",
    text: "استخدم Chrome أو Edge أو Safari حديث، أو ثبّت التطبيق.",
  },
  {
    id: "vapid",
    variant: "error",
    iconWrap: "ic-wrap--breaking",
    icon: "server",
    title: "الخادم غير جاهز للإرسال",
    text: "مفتاح الإرسال غير مُعدّ على السيرفر. بلّغ مسؤول النظام.",
  },
];

const CALLOUT_FOR_STATUS: Partial<Record<PushNotificationStatus, CalloutId>> = {
  ios_needs_install: "ios",
  blocked: "blocked",
  unsupported: "unsupported",
  vapid_off: "vapid",
};

export type PushState = {
  status: PushNotificationStatus;
  permission: NotificationPermission | "unavailable";
  vapidConfigured: boolean | null;
  hasSubscription: boolean;
  subscribedAt: string | null;
};

/** `subscribed`, or `busy` while a subscription exists (disable / test in flight) → the «on» boards. */
export function notifView({ status, hasSubscription }: PushState): NotifView {
  return status === "subscribed" || (status === "busy" && hasSubscription) ? "on" : "off";
}

/** The callout that applies to this device right now (shown first on desktop, in the hero area on mobile). */
export function activeCallout(status: PushNotificationStatus): CalloutId | null {
  return CALLOUT_FOR_STATUS[status] ?? null;
}

/** Desktop callouts: the active one first, the others in the board's order. */
export function orderedCallouts(active: CalloutId | null): Callout[] {
  if (!active) return [...CALLOUTS];
  return [...CALLOUTS].sort((a, b) => Number(b.id === active) - Number(a.id === active));
}

export type StatusCell = { label: string; value: string; dot: string };

const OK_DOT = "var(--ok-dot)";
const WARN_DOT = "var(--warn-dot)";
const IDLE_DOT = "var(--line-strong)";
const ERROR_DOT = "var(--breaking-dot)";
/** No value known (e.g. the server key is never fetched before the iPhone install) — the boards' missing-value dash. */
const UNKNOWN = "—";

function permissionCell(permission: PushState["permission"]): Omit<StatusCell, "label"> {
  if (permission === "granted") return { value: "مسموح", dot: OK_DOT };
  if (permission === "default") return { value: "ما اتطلبش لسه", dot: WARN_DOT };
  if (permission === "denied") return { value: "محظور", dot: WARN_DOT };
  return { value: UNKNOWN, dot: IDLE_DOT };
}

function serverCell(configured: boolean | null): Omit<StatusCell, "label"> {
  if (configured === true) return { value: "جاهز", dot: OK_DOT };
  if (configured === false) return { value: "غير جاهز", dot: ERROR_DOT };
  return { value: UNKNOWN, dot: IDLE_DOT };
}

/** The 2×2 status cells. `subscriptionLabel`: «اشتراك الجهاز» (desktop) / «الاشتراك» (mobile). */
export function statusCells(state: PushState, subscriptionLabel: string): StatusCell[] {
  const supported = state.status !== "unsupported";
  return [
    {
      label: "المتصفح",
      ...(supported ? { value: "يدعم الإشعارات", dot: OK_DOT } : { value: "لا يدعم الإشعارات", dot: WARN_DOT }),
    },
    { label: "إذن النظام", ...permissionCell(state.permission) },
    {
      label: subscriptionLabel,
      ...(state.hasSubscription ? { value: "مشترك", dot: OK_DOT } : { value: "غير مشترك", dot: IDLE_DOT }),
    },
    { label: "خادم الإرسال", ...serverCell(state.vapidConfigured) },
  ];
}

export function heroTitle(view: NotifView): string {
  return view === "on" ? "إشعارات العاجل مفعّلة" : "الإشعارات مش مفعّلة";
}

/** Desktop device line: «Chrome على macOS · فُعّلت قبل ٣ ساعات» / «… · ما اتطلبش إذن لسه». */
export function deviceLine(state: PushState, view: NotifView, device: DeviceInfo, now: Date): string {
  const parts = [deviceLabel(device)];
  if (view === "on" && state.subscribedAt) {
    const when = relativeTimeAr(state.subscribedAt, now);
    if (when) parts.push(`فُعّلت ${when}`);
  } else if (view === "off" && state.permission === "default") {
    parts.push("ما اتطلبش إذن لسه");
  }
  return parts.filter(Boolean).join(" · ");
}

/** Mobile hero item (on): «مفعّلة · iPhone · Newsplus مثبّت». */
export function mobileOnLine(device: DeviceInfo, installed: boolean): string {
  return ["مفعّلة", device.os, installed ? "Newsplus مثبّت" : null].filter(Boolean).join(" · ");
}

/** The «شكل الإشعار» preview text: the newest breaking headline, else the newest headline (no sample copy). */
export function previewHeadline(items: readonly NewsFeedItem[] | undefined): string | null {
  if (!items?.length) return null;
  return (items.find((item) => item.breaking) ?? items[0]).title;
}

/** «وصل إشعار التجربة قبل دقيقة» — only when the server reports at least one delivery. */
export function testResultLine(lastTestAt: number | null, lastTestSent: number | null, now: Date): string | null {
  if (lastTestAt == null || !lastTestSent) return null;
  const when = relativeTimeAr(new Date(lastTestAt).toISOString(), now);
  return when ? `وصل إشعار التجربة ${when}` : null;
}
