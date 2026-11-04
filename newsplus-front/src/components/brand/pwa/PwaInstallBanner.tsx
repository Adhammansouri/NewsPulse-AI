import { useState } from "react";
import { INSTALL_DISMISS_KEY, readDismissed, writeDismissed } from "@/services/pwaDetect";
import { usePwaInstall } from "./usePwaInstall";

export function PwaInstallBanner() {
  const { canInstall, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(() => readDismissed(INSTALL_DISMISS_KEY));

  if (!canInstall || dismissed) return null;

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
        <button type="button" className="brand-btn brand-btn-pill" onClick={() => void install()}>
          تثبيت
        </button>
        <button type="button" className="brand-header-ghost-btn" onClick={handleDismiss}>
          لاحقاً
        </button>
      </div>
    </div>
  );
}
