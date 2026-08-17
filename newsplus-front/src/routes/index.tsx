import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import RequireAuth from "@/components/shared/RequireAuth";
import GeneratePage from "@/modules/Generate/pages/GeneratePage";
import HomePage from "@/modules/Home/pages/HomePage";
import LoginPage from "@/modules/Login/pages/LoginPage";
import NewsPage from "@/modules/News/pages/NewsPage";
import TranslatePage from "@/modules/Translate/pages/TranslatePage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/translate" element={<TranslatePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}