import { useRegisterSW } from "virtual:pwa-register/react";
import { IosInstallHint } from "./IosInstallHint";
import { PwaInstallBanner } from "./PwaInstallBanner";
import { PwaUpdateToast } from "./PwaUpdateToast";

function PwaServiceWorker() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (!registration) return;
      window.setInterval(() => {
        void registration.update();
      }, 60 * 60 * 1000);
    },
  });

  return needRefresh ? (
    <PwaUpdateToast
      onUpdate={() => {
        void updateServiceWorker(true);
      }}
      onDismiss={() => setNeedRefresh(false)}
    />
  ) : null;
}

export function PwaChrome() {
  if (import.meta.env.DEV) return null;

  return (
    <>
      <PwaInstallBanner />
      <IosInstallHint />
      <PwaServiceWorker />
    </>
  );
}
