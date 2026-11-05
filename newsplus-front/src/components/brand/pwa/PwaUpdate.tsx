// S10 §4 · a new service worker is waiting: «إصدار جديد جاهز» + «حدّث الآن» (AI) / «بعدين».
// Desktop: the States card. Mobile: the MobSystem-update `m-float` above the tab bar.
import { useId } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { PwaDesktopCard } from "./PwaDesktopLayer";

export function PwaUpdate({ onUpdate, onDismiss }: { onUpdate: () => void; onDismiss: () => void }) {
  const isMobile = useIsMobile();
  const titleId = useId();

  const body = (
    <>
      <div className="row" style={isMobile ? { gap: "12px" } : undefined}>
        <span className="ic-wrap ic-wrap--ai">
          <Icon name="refresh" />
        </span>
        <span className="col grow">
          <b id={titleId} style={{ fontWeight: 600 }}>
            إصدار جديد جاهز
          </b>
          <span className="t-meta">حدّث عشان تاخد آخر التحسينات</span>
        </span>
      </div>
      <div className="row">
        <Button variant="ai" size="sm" className="grow" onClick={onUpdate}>
          حدّث الآن
        </Button>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          بعدين
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="m-float" role="status" aria-labelledby={titleId}>
        {body}
      </div>
    );
  }
  return (
    <PwaDesktopCard labelledBy={titleId} role="status" style={{ padding: "16px", gap: "12px" }}>
      {body}
    </PwaDesktopCard>
  );
}
