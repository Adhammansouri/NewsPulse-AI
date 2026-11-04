import { Fragment } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { OfflineBanner } from "@/components/shell/OfflineBanner";
import { Rail } from "@/components/shell/Rail";
import { RouteBar } from "@/components/shell/RouteBar";
import { TabBar } from "@/components/shell/TabBar";
import { isTabScreen } from "@/components/shell/routeMeta";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useOnline } from "@/hooks/useOnline";

/**
 * Pulse app shell (S02 §1) inside AppRoot's `.np` root.
 * Desktop: rail + content area (the RouteLoader board's `main`, which hosts the route bar).
 * Mobile: the screen fills `.np.m` (a 100dvh flex column) + the tab bar on tab screens only.
 * The outlet is keyed by pathname, so every navigation mounts a fresh Suspense boundary and the
 * destination's skeleton shows while its lazy chunk loads (see shell/routePending.ts).
 */
export default function MainLayout() {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const online = useOnline();
  const screen = (
    <Fragment key={pathname}>
      <Outlet />
    </Fragment>
  );

  if (isMobile) {
    return (
      <>
        <RouteBar />
        <OfflineBanner />
        {screen}
        {isTabScreen(pathname) && <TabBar />}
      </>
    );
  }

  return (
    <div style={{ display: "flex", height: "100dvh" }}>
      <Rail />
      <main className="grow col" style={{ position: "relative", background: "var(--bg)" }}>
        <RouteBar />
        {!online && (
          // DeskHome-offline: the banner heads the page's content column (main padding 34px 48px,
          // column max-width 1200px centred); the page's own top spacing follows it.
          <div style={{ padding: "34px 48px 0" }}>
            <div className="col" style={{ maxWidth: "1200px", margin: "0 auto" }}>
              <OfflineBanner />
            </div>
          </div>
        )}
        {screen}
      </main>
    </div>
  );
}
