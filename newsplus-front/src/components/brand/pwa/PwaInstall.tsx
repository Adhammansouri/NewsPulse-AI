// S10 §4 · install the app. Desktop: the States «التطبيق على الجهاز» card (install), or its «على الآيفون» steps
// card on iOS. Mobile: the MobSystem-install sheet; iOS can't prompt, so it shows only the Safari steps.
// Detection is unchanged: `beforeinstallprompt` (usePwaInstall), iOS Safari and standalone (pwaDetect).
import { useId, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  INSTALL_DISMISS_KEY,
  IOS_HINT_DISMISS_KEY,
  isIosSafari,
  isStandaloneDisplay,
  readDismissed,
  writeDismissed,
} from "@/services/pwaDetect";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Sheet } from "@/ui/Sheet";
import { PwaDesktopCard } from "./PwaDesktopLayer";
import { usePwaInstall } from "./usePwaInstall";

const LOGO_SRC = "/logo-icon.png";

/** «على الآيفون» step dot (States): neutral instead of the done teal. */
const IOS_DOT_STYLE = {
  width: "22px",
  height: "22px",
  background: "var(--surface-2)",
  borderColor: "var(--line-strong)",
  color: "var(--ink-2)",
} as const;

export function PwaInstall() {
  const isMobile = useIsMobile();
  const { canInstall, install } = usePwaInstall();
  const [ios] = useState(() => isIosSafari() && !isStandaloneDisplay());
  const [dismissed, setDismissed] = useState(() => readDismissed(ios ? IOS_HINT_DISMISS_KEY : INSTALL_DISMISS_KEY));

  const show = !dismissed && (ios || canInstall);
  if (!show) return null;

  function later() {
    writeDismissed(ios ? IOS_HINT_DISMISS_KEY : INSTALL_DISMISS_KEY);
    setDismissed(true);
  }

  if (isMobile) return <InstallSheet ios={ios} onInstall={() => void install()} onLater={later} />;
  return ios ? <IosStepsCard onLater={later} /> : <InstallCard onInstall={() => void install()} onLater={later} />;
}

/** States: «ثبّت Newsplus» card. */
function InstallCard({ onInstall, onLater }: { onInstall: () => void; onLater: () => void }) {
  const titleId = useId();
  return (
    <PwaDesktopCard labelledBy={titleId} style={{ padding: "16px", gap: "12px" }}>
      <div className="row">
        <img src={LOGO_SRC} alt="" style={{ width: "44px", height: "44px", borderRadius: "12px" }} />
        <span className="col grow">
          <b id={titleId} style={{ fontWeight: 600 }}>
            ثبّت Newsplus
          </b>
          <span className="t-meta">افتحه من الشاشة الرئيسية واستقبل العاجل</span>
        </span>
      </div>
      <div className="row">
        <Button variant="ink" size="sm" className="grow" onClick={onInstall}>
          تثبيت
        </Button>
        <Button variant="ghost" size="sm" onClick={onLater}>
          لاحقاً
        </Button>
      </div>
    </PwaDesktopCard>
  );
}

/**
 * States: «على الآيفون» — Safari can't prompt, so the card is the two steps. The board has no dismiss; «لاحقاً» is
 * the install card's own (same board), so the card never stays over the screen for good.
 */
function IosStepsCard({ onLater }: { onLater: () => void }) {
  const titleId = useId();
  return (
    <PwaDesktopCard labelledBy={titleId} style={{ padding: "16px", gap: "10px" }}>
      <b id={titleId} style={{ fontWeight: 600 }}>
        على الآيفون
      </b>
      <ol className="steps" style={{ gap: "10px" }}>
        <li className="step is-done" style={{ fontSize: "13.5px" }}>
          <span className="step__dot" style={IOS_DOT_STYLE}>
            <Icon name="share-up" size="sm" />
          </span>
          اضغط مشاركة في Safari
        </li>
        <li className="step is-done" style={{ fontSize: "13.5px" }}>
          <span className="step__dot" style={IOS_DOT_STYLE}>
            <Icon name="plus" size="sm" />
          </span>
          إضافة إلى الشاشة الرئيسية
        </li>
      </ol>
      <div className="row">
        <Button variant="ghost" size="sm" onClick={onLater}>
          لاحقاً
        </Button>
      </div>
    </PwaDesktopCard>
  );
}

/** MobSystem-install: logo, «ثبّت Newsplus», the benefits, then «تثبيت» (or, on iOS, the Safari steps) and «لاحقاً». */
function InstallSheet({ ios, onInstall, onLater }: { ios: boolean; onInstall: () => void; onLater: () => void }) {
  const titleId = useId();
  const [open, setOpen] = useState(true);
  const close = () => {
    setOpen(false);
    onLater();
  };
  return (
    <Sheet open={open} onClose={close} aria-labelledby={titleId} className="col" style={{ padding: "0 20px 28px", gap: "14px" }}>
      <div className="row" style={{ gap: "14px", marginTop: "6px" }}>
        <img src={LOGO_SRC} alt="" style={{ width: "60px", height: "60px", borderRadius: "16px", boxShadow: "var(--shadow-2)" }} />
        <span className="col">
          <h2 id={titleId} className="t-title">
            ثبّت Newsplus
          </h2>
          <span className="t-meta">على الشاشة الرئيسية</span>
        </span>
      </div>
      <ul className="m-list">
        <li className="m-item">
          <span className="ic-wrap ic-wrap--breaking">
            <Icon name="bell" />
          </span>
          <span className="m-item__label">
            إشعارات العاجل<small>توصلك حتى والتطبيق مقفول</small>
          </span>
        </li>
        <li className="m-item">
          <span className="ic-wrap ic-wrap--teal">
            <Icon name="bolt" />
          </span>
          <span className="m-item__label">
            يفتح أسرع<small>شاشة كاملة من غير شريط المتصفح</small>
          </span>
        </li>
      </ul>
      {ios ? (
        <div className="notice notice--info" style={{ fontSize: "13.5px", alignItems: "flex-start" }}>
          <Icon name="share-up" size="sm" style={{ color: "var(--cyan)", marginTop: "4px" }} />
          <span>
            على الآيفون: اضغط <b>مشاركة</b> في Safari، ثم <b>إضافة إلى الشاشة الرئيسية</b>.
          </span>
        </div>
      ) : (
        <button className="btn btn--ink btn--block btn--lg" type="button" onClick={onInstall}>
          تثبيت
        </button>
      )}
      <button className="btn btn--ghost btn--block" type="button" onClick={close}>
        لاحقاً
      </button>
    </Sheet>
  );
}
