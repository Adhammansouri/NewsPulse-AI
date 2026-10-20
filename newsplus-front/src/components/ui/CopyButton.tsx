import { Copy } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { copyText } from "@/services/toolErrors";
import { toast } from "./toast";

/** Copies text, flips to a drawn check and raises a toast. */
export function CopyButton({
  getText,
  label = "نسخ",
  doneLabel = "تم النسخ",
  toastMessage = "تم النسخ إلى الحافظة",
  className = "btn btn-quiet",
  disabled,
  iconOnly = false,
}: {
  getText: () => string;
  label?: string;
  doneLabel?: string;
  toastMessage?: string;
  className?: string;
  disabled?: boolean;
  iconOnly?: boolean;
}) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(false), 1800);
    return () => window.clearTimeout(timer);
  }, [done]);

  async function onClick() {
    try {
      await copyText(getText());
      setDone(true);
      toast(toastMessage);
    } catch {
      toast("تعذّر النسخ. حدّد النص وانسخه يدوياً.", "error", 3200);
    }
  }

  return (
    <button type="button" className={className} disabled={disabled} onClick={() => void onClick()} aria-label={iconOnly ? (done ? doneLabel : label) : undefined} title={iconOnly ? label : undefined}>
      {done ? (
        <svg className="check-draw" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      ) : (
        <Copy size={18} aria-hidden="true" />
      )}
      {iconOnly ? null : done ? doneLabel : label}
    </button>
  );
}
