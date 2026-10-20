import { ArrowsClockwise } from "@phosphor-icons/react";

type PwaUpdateToastProps = {
  onUpdate: () => void;
  onDismiss: () => void;
};

export function PwaUpdateToast({ onUpdate, onDismiss }: PwaUpdateToastProps) {
  return (
    <div className="pwa-banner" role="status" aria-live="polite">
      <ArrowsClockwise size={26} weight="duotone" aria-hidden="true" />
      <div className="pwa-copy">
        <p className="pwa-title">يتوفر إصدار جديد</p>
        <p className="pwa-text">حدّث الآن للحصول على آخر نسخة.</p>
      </div>
      <div className="pwa-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={onUpdate}>حدّث</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDismiss}>لاحقاً</button>
      </div>
    </div>
  );
}
