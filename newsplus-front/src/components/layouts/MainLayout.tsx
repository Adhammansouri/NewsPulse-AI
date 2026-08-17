import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";
import { Outlet, useLocation } from "react-router-dom";

const TOOL_PATHS = ["/news", "/generate", "/translate"];

function isToolRoute(pathname: string) {
  return TOOL_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function MainLayout() {
  const { pathname } = useLocation();
  const toolsTheme = isToolRoute(pathname);

  return (
    <div className="flex min-h-[100dvh] flex-col antialiased">
      <Header />
      <main className={toolsTheme ? "theme-tools flex-1" : "flex-1"}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
