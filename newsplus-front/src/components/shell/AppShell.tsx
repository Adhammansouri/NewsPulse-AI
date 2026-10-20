import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/Toaster";
import { MobileBar } from "./MobileBar";
import { Sidebar } from "./Sidebar";

export default function AppShell() {
  const { pathname } = useLocation();
  // The newsroom and generator are full-height workspaces; other pages scroll as documents.
  const workspace = pathname.startsWith("/news") || pathname.startsWith("/generate") || pathname.startsWith("/translate");

  return (
    <div className={`shell ${workspace ? "is-workspace" : ""}`}>
      <a href="#main" className="skip-link">تخطي إلى المحتوى</a>
      <Sidebar />
      <MobileBar />
      <main id="main" tabIndex={-1} className="shell-main">
        <div key={pathname} className="page-enter shell-page">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
