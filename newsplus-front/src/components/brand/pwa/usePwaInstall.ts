import { useCallback, useSyncExternalStore } from "react";
import { isStandaloneDisplay } from "@/services/pwaDetect";

// The browser fires `beforeinstallprompt` once, early. Keeping the deferred event in one module-level
// store lets every install entry point (PwaInstall, «المزيد» → «ثبّت التطبيق») use the same prompt.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listening = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function onBeforeInstallPrompt(event: BeforeInstallPromptEvent) {
  event.preventDefault();
  deferredPrompt = event;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!listening && !isStandaloneDisplay()) {
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    listening = true;
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && listening) {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      listening = false;
    }
  };
}

function getSnapshot() {
  return deferredPrompt;
}

function getServerSnapshot() {
  return null;
}

/**
 * Native PWA install prompt (Chromium `beforeinstallprompt`). `canInstall` is true while a deferred
 * prompt is available and the app is not already running standalone; `install()` shows it once.
 */
export function usePwaInstall() {
  const prompt = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const install = useCallback(async () => {
    const event = deferredPrompt;
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    if (deferredPrompt === event) {
      deferredPrompt = null;
      emit();
    }
  }, []);

  return { canInstall: prompt !== null && !isStandaloneDisplay(), install };
}
