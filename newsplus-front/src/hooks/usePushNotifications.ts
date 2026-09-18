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
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

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

    const next = resolveStatus({
      permission: currentPermission,
      vapidConfigured: configured,
      hasSubscription: subscription,
      canPush,
      iosNeedsInstall,
    });
    setStatus(next);
    setPending(false);
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
    error,
    refresh,
    enable,
    disable,
    sendTest,
  };
}
