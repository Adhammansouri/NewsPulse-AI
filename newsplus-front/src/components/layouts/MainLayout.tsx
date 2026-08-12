import { Header } from "@/components/shared/Header";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="min-h-screen antialiased">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
