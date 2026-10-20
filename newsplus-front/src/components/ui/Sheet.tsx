import { X } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** bottom sheet on phones; "side" = drawer on desktop; "center" = modal on desktop */
  variant?: "side" | "center";
  children: ReactNode;
  footer?: ReactNode;
};

const CLOSE_MS = 200;

/** Accessible modal built on native <dialog> (focus trap + Esc for free) with enter/exit animation. */
export function Sheet({ open, onClose, title, subtitle, variant = "center", children, footer }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setMounted(true);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  useEffect(() => {
    const dialog = ref.current;
    if (!mounted || !dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <dialog
      ref={ref}
      className={`sheet is-${variant} ${closing ? "is-closing" : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sheet-panel">
        <div className="sheet-grip" aria-hidden="true" />
        <header className="sheet-head">
          <div>
            <h2 id={titleId} className="sheet-title">{title}</h2>
            {subtitle ? <p className="sheet-sub">{subtitle}</p> : null}
          </div>
          <button type="button" className="icon-btn is-sm" aria-label="إغلاق" onClick={onClose}>
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
        {footer ? <footer className="sheet-foot">{footer}</footer> : null}
      </div>
    </dialog>
  );
}
