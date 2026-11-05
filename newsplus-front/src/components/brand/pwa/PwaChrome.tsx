import { useRegisterSW } from "virtual:pwa-register/react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PwaInstall } from "./PwaInstall";
import { PWA_DESKTOP_LAYER_STYLE } from "./PwaDesktopLayer";
import { PwaUpdate } from "./PwaUpdate";

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
    <PwaUpdate
      onUpdate={() => {
        void updateServiceWorker(true);
      }}
      onDismiss={() => setNeedRefresh(false)}
    />
  ) : null;
}

/**
 * Install + update chrome (S10 §4), mounted inside the `.np` root. Mobile surfaces (sheet, `m-float`) position
 * against `.np.m`; desktop cards share one bottom-centre layer. Production only: the dev server has no SW.
 */
export function PwaChrome() {
  if (import.meta.env.DEV) return null;
  return <PwaSurfaces />;
}

function PwaSurfaces() {
  const isMobile = useIsMobile();
  const surfaces = (
    <>
      <PwaInstall />
      <PwaServiceWorker />
    </>
  );
  return isMobile ? surfaces : <div style={PWA_DESKTOP_LAYER_STYLE}>{surfaces}</div>;
}
