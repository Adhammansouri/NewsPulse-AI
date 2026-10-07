import { BrandSideRail } from "@/components/shared/BrandSideRail";
import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";
import { Outlet, useLocation } from "react-router-dom";

const TOOL_PATHS = ["/news", "/generate", "/translate", "/usage"];

function isToolRoute(pathname: string) {
  return TOOL_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function MainLayout() {
  const { pathname } = useLocation();
  const toolsTheme = isToolRoute(pathname);

  return (
    <div className={toolsTheme ? "brand-app-shell brand-app-shell--tools antialiased" : "brand-app-shell antialiased"}>
      <BrandSideRail />
      <div className={toolsTheme ? "brand-app-column brand-app-column--tools" : "brand-app-column"}>
        <Header />
        <main
          id="main-content"
          tabIndex={-1}
          className={toolsTheme ? "theme-tools layout-main--tools flex-1" : "flex-1 outline-none"}
        >
          <div key={pathname} className="brand-page-enter">
            <Outlet />
          </div>
        </main>
        {!toolsTheme && <Footer />}
      </div>
    </div>
  );
}
