import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import { applyThemeToDocument, getTheme } from "@/services/themeStore";
import "@fontsource/alexandria/500.css";
import "@fontsource/alexandria/600.css";
import "@fontsource/alexandria/700.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
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
