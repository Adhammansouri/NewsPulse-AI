import { Route, Routes } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import GeneratePage from "@/modules/Generate/pages/GeneratePage";
import HomePage from "@/modules/Home/pages/HomePage";
import NewsPage from "@/modules/News/pages/NewsPage";
import TranslatePage from "@/modules/Translate/pages/TranslatePage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/translate" element={<TranslatePage />} />
      </Route>
    </Routes>
  );
}
