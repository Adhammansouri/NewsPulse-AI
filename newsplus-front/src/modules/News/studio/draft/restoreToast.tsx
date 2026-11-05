import { ToastGlyph, type ToastApi } from "@/ui/Toast";
import { DRAFT_COPY } from "./copy";

/** States toast «رجعت للنسخة ١»: the history arrow without the clock hands. */
const RESTORE_GLYPH = "M3 12a9 9 0 1 0 3-6.7M3 4v5h5";

/** «رجعت للنسخة {n}» + «تراجع» (States toasts[2]) after a version chip restored an older version. */
export function restoredToast(toast: ToastApi, version: number, onUndo?: () => void) {
  toast.show(DRAFT_COPY.restoredTo(version), {
    icon: <ToastGlyph path={RESTORE_GLYPH} />,
    action: onUndo ? { onAction: onUndo } : undefined,
  });
}
