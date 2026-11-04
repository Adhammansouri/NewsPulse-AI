import { useLayoutEffect, useSyncExternalStore } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { primaryQueryKey } from "./routeMeta";

/*
 * Route pending state for the route bar and the rail's `is-loading` (S02 §8).
 *
 * The app uses <BrowserRouter> (no data router, so no `useNavigation()`). A navigation is pending while:
 * 1. the destination's lazy page chunk is loading. MainLayout keys the outlet by pathname, so every
 *    navigation mounts a fresh <Suspense> boundary; a fresh boundary shows its fallback even inside the
 *    router's startTransition, and the fallback (PageSkeleton) registers itself here while it is mounted;
 * 2. the destination page's primary query is in its first load (fetching with no data yet), via useIsFetching.
 */

let mountedFallbacks = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return mountedFallbacks > 0;
}

function getServerSnapshot(): boolean {
  return false;
}

/** Called by a route's Suspense fallback: the page chunk is loading for as long as the fallback is committed. */
export function useLazyRouteSignal(): void {
  useLayoutEffect(() => {
    mountedFallbacks += 1;
    emit();
    return () => {
      mountedFallbacks -= 1;
      emit();
    };
  }, []);
}

/** True while the current route's page chunk or its primary query's first load is in flight. */
export function useRoutePending(): boolean {
  const { pathname } = useLocation();
  const chunkLoading = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const queryKey = primaryQueryKey(pathname);
  const firstLoads = useIsFetching({
    queryKey,
    predicate: (query) => queryKey !== undefined && query.state.data === undefined,
  });
  return chunkLoading || firstLoads > 0;
}
