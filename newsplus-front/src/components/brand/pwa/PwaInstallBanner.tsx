import { useEffect, useState } from "react";
import {
  INSTALL_DISMISS_KEY,
  isStandaloneDisplay,
  readDismissed,
  writeDismissed,
} from "@/services/pwaDetect";

export function PwaInstallBanner() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => readDismissed(INSTALL_DISMISS_KEY));

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    function onPrompt(next: BeforeInstallPromptEvent) {
      next.preventDefault();
      setEvent(next);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!event || dismissed || isStandaloneDisplay()) return null;

  async function handleInstall() {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    setEvent(null);
  }

  function handleDismiss() {
    writeDismissed(INSTALL_DISMISS_KEY);
    setDismissed(true);
  }

  return (
    <div className="pwa-banner" role="dialog" aria-labelledby="pwa-install-title">
      <div className="pwa-banner__copy">
        <p id="pwa-install-title" className="pwa-banner__title">
          ثبّت Newsplus
        </p>
        <p className="pwa-banner__text">افتح التطبيق من الشاشة الرئيسية بدون المتصفح.</p>
      </div>
      <div className="pwa-banner__actions">
        <button type="button" className="brand-btn brand-btn-pill" onClick={() => void handleInstall()}>
          تثبيت
        </button>
        <button type="button" className="brand-header-ghost-btn" onClick={handleDismiss}>
          لاحقاً
        </button>
      </div>
    </div>
  );
}
