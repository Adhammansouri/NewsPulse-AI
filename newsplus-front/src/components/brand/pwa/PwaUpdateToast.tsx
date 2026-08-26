type PwaUpdateToastProps = {
  onUpdate: () => void;
  onDismiss: () => void;
};

export function PwaUpdateToast({ onUpdate, onDismiss }: PwaUpdateToastProps) {
  return (
    <div className="pwa-banner" role="status" aria-live="polite">
      <div className="pwa-banner__copy">
        <p className="pwa-banner__title">يتوفر إصدار جديد</p>
        <p className="pwa-banner__text">حدّث الآن للحصول على آخر نسخة من Newsplus.</p>
      </div>
      <div className="pwa-banner__actions">
        <button type="button" className="brand-btn brand-btn-pill" onClick={onUpdate}>
          تحديث
        </button>
        <button type="button" className="brand-header-ghost-btn" onClick={onDismiss}>
          لاحقاً
        </button>
      </div>
    </div>
  );
}
