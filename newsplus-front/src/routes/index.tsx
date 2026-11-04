import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import RequireAuth from "@/components/shared/RequireAuth";
import { LegacyContent } from "@/components/shell/LegacyContent";
import { PageSkeleton, type PageSkeletonLayout } from "@/components/shell/PageSkeleton";
// TRANSITIONAL: the legacy pages' own stylesheets stay in the entry bundle. Imported here (before
// index.css, as when the pages were eager) they keep their place in the cascade that styles/legacy-bridge.css
// relies on; a lazily loaded stylesheet would land after index.css. Drop each import with its page's rebuild.
import "@/modules/News/newsroom.css";
import "@/modules/Translate/translate.css";
import "@/modules/Usage/usage.css";

const LoginPage = lazy(() => import("@/modules/Login/pages/LoginPage"));
const HomePage = lazy(() => import("@/modules/Home/pages/HomePage"));
const NewsPage = lazy(() => import("@/modules/News/pages/NewsPage"));
const GeneratePage = lazy(() => import("@/modules/Generate/pages/GeneratePage"));
const TranslatePage = lazy(() => import("@/modules/Translate/pages/TranslatePage"));
const NotificationsPage = lazy(() => import("@/modules/Notifications/pages/NotificationsPage"));
const UsagePage = lazy(() => import("@/modules/Usage/pages/UsagePage"));
const MorePage = lazy(() => import("@/modules/More/pages/MorePage"));

// Dev-only UI-kit gallery (S01 §7). `import.meta.env.DEV` is `false` in production builds, so the
// lazy import is dead code there and the gallery chunk is never emitted.
const DesignGalleryPage = import.meta.env.DEV
  ? lazy(() => import("@/modules/DesignGallery/DesignGalleryPage"))
  : null;

/**
 * A lazy page inside the shell: its RouteLoader-shaped skeleton while the chunk loads. `legacy` pages
 * (not yet rebuilt on the Pulse boards) render in the transitional legacy content area; `"tools"` were
 * the Nothing-themed tool routes of the old shell.
 */
function page(element: ReactNode, layout: PageSkeletonLayout, legacy?: "page" | "tools") {
  return (
    <Suspense fallback={<PageSkeleton layout={layout} />}>
      {legacy ? <LegacyContent tools={legacy === "tools"}>{element}</LegacyContent> : element}
    </Suspense>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {DesignGalleryPage && (
        <Route
          path="/__design"
          element={
            <Suspense fallback={null}>
              <DesignGalleryPage />
            </Suspense>
          }
        />
      )}
      <Route
        path="/login"
        element={
          <Suspense fallback={null}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route element={<RequireAuth />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={page(<HomePage />, "stack", "page")} />
          <Route path="/news" element={page(<NewsPage />, "split")} />
          <Route path="/generate" element={page(<GeneratePage />, "split", "tools")} />
          <Route path="/translate" element={page(<TranslatePage />, "stack", "tools")} />
          <Route path="/notifications" element={page(<NotificationsPage />, "stack", "page")} />
          <Route path="/usage" element={page(<UsagePage />, "stack", "tools")} />
          <Route path="/more" element={page(<MorePage />, "stack")} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
