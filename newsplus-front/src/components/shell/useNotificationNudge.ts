// The notifications nudge: the desktop rail bell and the MobHome bell show a `dot-badge` («الإشعارات، تنبيه جديد»)
// only while push permission was never asked («default»).
import { useSyncExternalStore } from "react";

function readPermission(): NotificationPermission | null {
  return typeof Notification === "undefined" ? null : Notification.permission;
}

function subscribePermission(onChange: () => void) {
  let status: PermissionStatus | null = null;
  let cancelled = false;
  navigator.permissions
    ?.query({ name: "notifications" })
    .then((result) => {
      if (cancelled) return;
      status = result;
      status.addEventListener("change", onChange);
    })
    .catch(() => {
      /* Permissions API without `notifications`: the visibility check below still refreshes it. */
    });
  document.addEventListener("visibilitychange", onChange);
  return () => {
    cancelled = true;
    status?.removeEventListener("change", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

export function useNotificationNudge(): boolean {
  return useSyncExternalStore(subscribePermission, readPermission, () => null) === "default";
}
