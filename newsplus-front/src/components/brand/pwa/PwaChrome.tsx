import { useRegisterSW } from "virtual:pwa-register/react";
import { IosInstallHint } from "./IosInstallHint";
import { PwaInstallBanner } from "./PwaInstallBanner";
import { PwaUpdateToast } from "./PwaUpdateToast";

export function PwaChrome() {
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

  return (
    <>
      <PwaInstallBanner />
      <IosInstallHint />
      {needRefresh ? (
        <PwaUpdateToast
          onUpdate={() => {
            void updateServiceWorker(true);
          }}
          onDismiss={() => setNeedRefresh(false)}
        />
      ) : null}
    </>
  );
}
