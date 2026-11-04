import { useCallback, useEffect, useState } from "react";
import { isApiError } from "@/services/apiError";
import { canUseWebPush, isIosDevice, isStandaloneDisplay } from "@/services/pwaDetect";
import {
  getExistingPushSubscription,
  getVapidKey,
  sendTestPush,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/services/pushService";
import { useSession } from "@/hooks/useSession";

export type PushNotificationStatus =
  | "unsupported"
  | "ios_needs_install"
  | "blocked"
  | "idle"
  | "subscribed"
  | "busy"
  | "vapid_off";

export type PushStatusDot = "on" | "off" | "blocked" | "unavailable";

export function pushStatusDot(status: PushNotificationStatus, hasSubscription = false): PushStatusDot {
  if (status === "subscribed" || (status === "busy" && hasSubscription)) return "on";
  if (status === "idle" || status === "busy") return "off";
  if (status === "blocked") return "blocked";
  return "unavailable";
}

/** When this device subscribed (ISO), for the notifications screen's device line. Local to this browser. */
const SUBSCRIBED_AT_KEY = "newsplus-push-subscribed-at";

function readSubscribedAt(): string | null {
  try {
    return localStorage.getItem(SUBSCRIBED_AT_KEY);
  } catch {
    return null;
  }
}

function writeSubscribedAt(value: string | null) {
  try {
    if (value) localStorage.setItem(SUBSCRIBED_AT_KEY, value);
    else localStorage.removeItem(SUBSCRIBED_AT_KEY);
  } catch {
    /* private mode */
  }
}

function readPermission(): NotificationPermission | "unavailable" {
  if (typeof Notification === "undefined") return "unavailable";
  return Notification.permission;
}

function describeError(error: unknown) {
  if (isApiError(error)) return error.code;
  if (error instanceof Error && error.message === "service-worker-unavailable") {
    return "خدمة الخلفية غير جاهزة في هذا المتصفح بعد.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "تعذر إكمال الطلب";
}

function resolveStatus(args: {
  permission: NotificationPermission | "unavailable";
  vapidConfigured: boolean | null;
  hasSubscription: boolean;
  canPush: boolean;
  iosNeedsInstall: boolean;
}): Exclude<PushNotificationStatus, "busy"> {
  if (!args.canPush) return "unsupported";
  if (args.iosNeedsInstall) return "ios_needs_install";
  if (args.permission === "denied") return "blocked";
  if (args.vapidConfigured === false) return "vapid_off";
  return args.hasSubscription ? "subscribed" : "idle";
}

export function usePushNotifications() {
  const session = useSession();
  const [status, setStatus] = useState<PushNotificationStatus>("idle");
  const [permission, setPermission] = useState<NotificationPermission | "unavailable">("unavailable");
  const [vapidConfigured, setVapidConfigured] = useState<boolean | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [lastTestSent, setLastTestSent] = useState<number | null>(null);
  const [lastTestAt, setLastTestAt] = useState<number | null>(null);
  const [subscribedAt, setSubscribedAt] = useState<string | null>(() => readSubscribedAt());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);
  const [checked, setChecked] = useState(false);

  const refresh = useCallback(async () => {
    const canPush = canUseWebPush();
    const iosNeedsInstall = canPush && isIosDevice() && !isStandaloneDisplay();
    const currentPermission = canPush ? readPermission() : "unavailable";
    setPermission(currentPermission);

    let configured: boolean | null = null;
    if (session && canPush && !iosNeedsInstall) {
      try {
        const vapid = await getVapidKey();
        configured = vapid.configured && Boolean(vapid.publicKey);
      } catch (cause) {
        setError(describeError(cause));
      }
    }
    setVapidConfigured(configured);

    let subscription = false;
    if (canPush && !iosNeedsInstall) {
      try {
        subscription = Boolean(await getExistingPushSubscription());
      } catch (cause) {
        setError(describeError(cause));
      }
    }
    setHasSubscription(subscription);
    if (!subscription) {
      writeSubscribedAt(null);
      setSubscribedAt(null);
    }

    const next = resolveStatus({
      permission: currentPermission,
      vapidConfigured: configured,
      hasSubscription: subscription,
      canPush,
      iosNeedsInstall,
    });
    setStatus(next);
    setPending(false);
    setChecked(true);
    return next;
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    setPending(true);
    setStatus("busy");
    setError(null);
    try {
      const subscription = await subscribeToPush();
      if (!subscription) {
        setError("لم يكتمل الاشتراك في هذا المتصفح.");
      } else {
        const now = new Date().toISOString();
        writeSubscribedAt(now);
        setSubscribedAt(now);
      }
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      await refresh();
    }
  }, [refresh]);

  const disable = useCallback(async () => {
    setPending(true);
    setStatus("busy");
    setError(null);
    try {
      await unsubscribeFromPush();
      setLastTestSent(null);
      setLastTestAt(null);
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      await refresh();
    }
  }, [refresh]);

  const sendTest = useCallback(async () => {
    setError(null);
    setPending(true);
    const previous = status === "busy" ? "subscribed" : status;
    setStatus("busy");
    try {
      const result = await sendTestPush();
      setLastTestSent(result.sent);
      setLastTestAt(Date.now());
      setStatus("subscribed");
    } catch (cause) {
      setError(describeError(cause));
      setStatus(previous);
    } finally {
      setPending(false);
    }
  }, [status]);

  const displayStatus: PushNotificationStatus = pending ? "busy" : status;

  return {
    status: displayStatus,
    permission,
    vapidConfigured,
    hasSubscription,
    lastTestSent,
    /** `Date.now()` of the last successful `POST /push/test`. */
    lastTestAt,
    /** ISO time this device subscribed (stored locally by `enable`); null when unknown. */
    subscribedAt,
    /** The first status check finished (until then `status` is `busy`). */
    checked,
    error,
    refresh,
    enable,
    disable,
    sendTest,
  };
}
