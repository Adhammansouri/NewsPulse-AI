import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import RequireAuth from "@/components/shared/RequireAuth";
import GeneratePage from "@/modules/Generate/pages/GeneratePage";
import HomePage from "@/modules/Home/pages/HomePage";
import LoginPage from "@/modules/Login/pages/LoginPage";
import NewsPage from "@/modules/News/pages/NewsPage";
import NotificationsPage from "@/modules/Notifications/pages/NotificationsPage";
import TranslatePage from "@/modules/Translate/pages/TranslatePage";
import UsagePage from "@/modules/Usage/pages/UsagePage";

// Dev-only UI-kit gallery (S01 §7). `import.meta.env.DEV` is `false` in production builds, so the
// lazy import is dead code there and the gallery chunk is never emitted.
const DesignGalleryPage = import.meta.env.DEV
  ? lazy(() => import("@/modules/DesignGallery/DesignGalleryPage"))
  : null;

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
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/translate" element={<TranslatePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/usage" element={<UsagePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
