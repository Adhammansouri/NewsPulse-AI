import { useRoutePending } from "./routePending";

/**
 * `route-bar` (RouteLoader board): the 3px AI-gradient bar at the top of the content area while the
 * destination page is loading — its lazy chunk, or its primary query's first load (see routePending).
 * Positioned by np4 against the nearest positioned ancestor: the content `main` (desktop) / `.np.m` (mobile).
 */
export function RouteBar() {
  const pending = useRoutePending();
  if (!pending) return null;
  return <div className="route-bar" role="progressbar" aria-label="جاري فتح الصفحة" />;
}
