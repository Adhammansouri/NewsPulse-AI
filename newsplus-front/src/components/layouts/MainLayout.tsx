import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col antialiased">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
