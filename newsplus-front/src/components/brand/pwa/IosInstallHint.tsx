import { ShareNetwork } from "@phosphor-icons/react";
import { useState } from "react";
import { IOS_HINT_DISMISS_KEY, isIosSafari, isStandaloneDisplay, readDismissed, writeDismissed } from "@/services/pwaDetect";

export function IosInstallHint() {
  const [dismissed, setDismissed] = useState(() => readDismissed(IOS_HINT_DISMISS_KEY));

  if (dismissed || isStandaloneDisplay() || !isIosSafari()) return null;

  function handleDismiss() {
    writeDismissed(IOS_HINT_DISMISS_KEY);
    setDismissed(true);
  }

  return (
    <div className="pwa-banner" role="dialog" aria-labelledby="pwa-ios-title">
      <ShareNetwork size={26} weight="duotone" aria-hidden="true" />
      <div className="pwa-copy">
        <p id="pwa-ios-title" className="pwa-title">أضف Newsplus للشاشة الرئيسية</p>
        <p className="pwa-text">اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية». الإشعارات تعمل بعد التثبيت على iOS.</p>
      </div>
      <div className="pwa-actions">
        <button type="button" className="btn btn-quiet btn-sm" onClick={handleDismiss}>حسناً</button>
      </div>
    </div>
  );
}
