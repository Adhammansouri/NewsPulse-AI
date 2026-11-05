import { useEffect, useRef, useState, type RefObject } from "react";

/** Pull distance that triggers a refresh (S04 §6, MobWire-refresh). */
export const PULL_THRESHOLD_PX = 64;
/** Movement before a touch counts as a pull or a sideways swipe. */
const SLOP_PX = 10;

/**
 * Pull-to-refresh on a scroll container: pulling down ≥ 64px while it sits at the top runs `onRefresh`;
 * `refreshing` stays true until it settles (the `ptr` row). The browser's own overscroll is held back
 * during the pull, so the listeners are native (`touchmove` must not be passive).
 */
export function usePullToRefresh(scrollRef: RefObject<HTMLElement | null>, onRefresh: () => Promise<void>): boolean {
  const [refreshing, setRefreshing] = useState(false);
  const refreshRef = useRef(onRefresh);
  useEffect(() => {
    refreshRef.current = onRefresh;
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let start: { x: number; y: number } | null = null;
    let pulling = false;
    let distance = 0;
    let busy = false;

    const reset = () => {
      start = null;
      pulling = false;
      distance = 0;
    };
    const onStart = (event: TouchEvent) => {
      reset();
      if (busy || event.touches.length !== 1 || el.scrollTop > 0) return;
      start = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    };
    const onMove = (event: TouchEvent) => {
      if (!start) return;
      const dx = event.touches[0].clientX - start.x;
      const dy = event.touches[0].clientY - start.y;
      if (!pulling) {
        if (Math.abs(dx) < SLOP_PX && Math.abs(dy) < SLOP_PX) return;
        if (dy <= 0 || Math.abs(dy) <= Math.abs(dx) || el.scrollTop > 0) {
          reset();
          return;
        }
        pulling = true;
      }
      distance = dy;
      if (event.cancelable) event.preventDefault();
    };
    const onEnd = () => {
      const run = pulling && distance >= PULL_THRESHOLD_PX;
      reset();
      if (!run) return;
      busy = true;
      setRefreshing(true);
      void refreshRef.current().finally(() => {
        busy = false;
        setRefreshing(false);
      });
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", reset);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", reset);
    };
  }, [scrollRef]);

  return refreshing;
}
