import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import {
  canUseWebPush,
  isIosDevice,
  isStandaloneDisplay,
} from "@/services/pwaDetect";
import { getExistingPushSubscription, subscribeToPush } from "@/services/pushService";

type PushState = "hidden" | "idle" | "on" | "busy" | "blocked";

export function PushOptInButton() {
  const session = useSession();
  const [state, setState] = useState<PushState>("hidden");

  useEffect(() => {
    if (!session || !canUseWebPush()) {
      setState("hidden");
      return;
    }

    if (isIosDevice() && !isStandaloneDisplay()) {
      setState("hidden");
      return;
    }

    let cancelled = false;
    void getExistingPushSubscription().then((sub) => {
      if (cancelled) return;
      if (Notification.permission === "denied") {
        setState("blocked");
        return;
      }
      setState(sub ? "on" : "idle");
    });

    return () => {
      cancelled = true;
    };
  }, [session]);

  if (state === "hidden") return null;

  const label =
    state === "on" ? "الإشعارات مفعّلة" : state === "blocked" ? "الإشعارات محظورة" : "تفعيل الإشعارات";

  async function handleClick() {
    if (state !== "idle") return;
    setState("busy");
    try {
      const sub = await subscribeToPush();
      setState(sub ? "on" : "idle");
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      type="button"
      className="brand-header-icon-btn"
      onClick={() => void handleClick()}
      aria-label={label}
      title={label}
      aria-pressed={state === "on"}
      disabled={state === "busy" || state === "blocked" || state === "on"}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
      </svg>
    </button>
  );
}
