import { useEffect } from "react";
import type { PresenceActivity } from "@newsplus/shared";
import { sendPresenceHeartbeat } from "@/services/presenceService";

/** S15: a heartbeat every 20s; the API keeps an entry for 45s, so one lost beat does not drop the user. */
export const PRESENCE_HEARTBEAT_MS = 20_000;

export type PresenceHeartbeatOptions = {
  /** The news story on screen. */
  itemId?: string;
  /** The draft (editorial conversation) on screen. */
  conversationId?: string;
  activity: PresenceActivity;
  /** Default true. Pass false to pause (e.g. until the story or draft has loaded). */
  enabled?: boolean;
};

/**
 * Tells the team what this screen is doing (S15 §1 presence) — for the studio (S05/S06) to mount while a story or
 * draft is open. Beats at once, then every 20s, and again when the tab comes back to the foreground; a hidden tab
 * stops beating, so it drops off the board within 45s. A change of target or activity beats immediately.
 * Failures are ignored: presence is best-effort and the next beat retries.
 */
export function usePresenceHeartbeat({ itemId, conversationId, activity, enabled = true }: PresenceHeartbeatOptions) {
  useEffect(() => {
    if (!enabled) return;
    const beat = () => {
      if (document.visibilityState === "hidden") return;
      sendPresenceHeartbeat({
        activity,
        ...(itemId ? { itemId } : {}),
        ...(conversationId ? { conversationId } : {}),
      }).catch(() => undefined);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") beat();
    };

    beat();
    const timer = window.setInterval(beat, PRESENCE_HEARTBEAT_MS);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, itemId, conversationId, activity]);
}
