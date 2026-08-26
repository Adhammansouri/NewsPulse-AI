import { useState } from "react";
import {
  IOS_HINT_DISMISS_KEY,
  isIosSafari,
  isStandaloneDisplay,
  readDismissed,
  writeDismissed,
} from "@/services/pwaDetect";

export function IosInstallHint() {
  const [dismissed, setDismissed] = useState(() => readDismissed(IOS_HINT_DISMISS_KEY));

  if (dismissed || isStandaloneDisplay() || !isIosSafari()) return null;

  function handleDismiss() {
    writeDismissed(IOS_HINT_DISMISS_KEY);
    setDismissed(true);
  }

  return (
    <div className="pwa-banner" role="dialog" aria-labelledby="pwa-ios-title">
      <div className="pwa-banner__copy">
        <p id="pwa-ios-title" className="pwa-banner__title">
          أضِف Newsplus للشاشة الرئيسية
        </p>
        <p className="pwa-banner__text">شارك ← إضافة إلى الشاشة الرئيسية. الإشعارات تعمل بعد التثبيت على iOS.</p>
      </div>
      <div className="pwa-banner__actions">
        <button type="button" className="brand-header-ghost-btn" onClick={handleDismiss}>
          حسناً
        </button>
      </div>
    </div>
  );
}
