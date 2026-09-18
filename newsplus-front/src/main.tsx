import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import { applyThemeToDocument, getTheme } from "@/services/themeStore";
import "./index.css";

async function clearDevServiceWorkerCache() {
  if (!import.meta.env.DEV || !("serviceWorker" in navigator)) return false;

  const hadController = Boolean(navigator.serviceWorker.controller);
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  return hadController;
}

async function bootstrap() {
  const reloadedForServiceWorker = await clearDevServiceWorkerCache();
  if (reloadedForServiceWorker) {
    window.location.reload();
    return;
  }

  applyThemeToDocument(getTheme());

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
