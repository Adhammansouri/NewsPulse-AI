import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "@/components/shell/AppShell";
import RequireAuth from "@/components/shared/RequireAuth";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

const HomePage = lazy(() => import("@/modules/Home/pages/HomePage"));
const NewsPage = lazy(() => import("@/modules/News/pages/NewsPage"));
const GeneratePage = lazy(() => import("@/modules/Generate/pages/GeneratePage"));
const TranslatePage = lazy(() => import("@/modules/Translate/pages/TranslatePage"));
const NotificationsPage = lazy(() => import("@/modules/Notifications/pages/NotificationsPage"));
const UsagePage = lazy(() => import("@/modules/Usage/pages/UsagePage"));
const LoginPage = lazy(() => import("@/modules/Login/pages/LoginPage"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
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
    </Suspense>
  );
}
