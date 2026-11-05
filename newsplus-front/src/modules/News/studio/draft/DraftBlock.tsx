// S06 §3: a draft block (`block` + `block__label`, the copy button at the label's end) and the copy behaviour of
// the interactive Main board: «نسخ» → «تم النسخ» (`is-done`) for 1.9s with a toast («نُسخ الخطاف»…); one copied
// block at a time. A refused clipboard shows «تعذّر النسخ» with «حدّد النص», which selects the block's text.
// `is-changed` + «… · عُدّل في ن{n}» marks a block that differs from the previous version.
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { copyText, selectText, showCopyFailed } from "@/services/toolErrors";
import { cx } from "@/ui/cx";
import { TOAST_DURATION_MS, useToast } from "@/ui/Toast";
import { DRAFT_COPY } from "./copy";

/** Selects `node`'s text, or the part after `from` (a block's label), for a manual copy (S10: shared). */
export { selectText };

type DraftCopyApi = {
  /** The key of the control showing «تم النسخ». */
  done: string | null;
  /** Copies `text`; on success flags `key` and toasts `message`, on failure offers to select `target()`. */
  copy: (key: string, text: string, message: string, select: () => void) => void;
};

const DraftCopyContext = createContext<DraftCopyApi | null>(null);

export function DraftCopyProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [done, setDone] = useState<{ key: string; at: number } | null>(null);

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [done]);

  const copy = useCallback(
    (key: string, text: string, message: string, select: () => void) => {
      copyText(text).then(
        () => {
          setDone({ key, at: Date.now() });
          toast.show(message);
        },
        () => {
          setDone(null);
          showCopyFailed(toast, select);
        },
      );
    },
    [toast],
  );

  const api = useMemo<DraftCopyApi>(() => ({ done: done?.key ?? null, copy }), [done, copy]);
  return <DraftCopyContext.Provider value={api}>{children}</DraftCopyContext.Provider>;
}

export function useDraftCopy(): DraftCopyApi {
  const api = useContext(DraftCopyContext);
  if (!api) throw new Error("useDraftCopy() needs a <DraftCopyProvider> above it.");
  return api;
}

export type BlockCopy = { key: string; text: string; toast: string };

export function DraftBlock({
  label,
  changedIn = null,
  copy,
  className,
  style,
  labelStyle,
  children,
}: {
  label: string;
  /** The version (ن{n}) that changed this block, when it differs from the previous version. */
  changedIn?: number | null;
  copy?: BlockCopy;
  className?: string;
  style?: CSSProperties;
  labelStyle?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const { done, copy: run } = useDraftCopy();
  const isDone = copy !== undefined && done === copy.key;
  return (
    <div ref={ref} className={cx("block", changedIn !== null && "is-changed", className)} style={style}>
      <div ref={labelRef} className="block__label" style={labelStyle}>
        {changedIn !== null ? DRAFT_COPY.changedIn(label, changedIn) : label}
        {copy && (
          <button
            className={cx("block__copy", isDone && "is-done")}
            type="button"
            onClick={() => run(copy.key, copy.text, copy.toast, () => selectText(ref.current, labelRef.current))}
          >
            {isDone ? DRAFT_COPY.copied : DRAFT_COPY.copy}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/** Text with its line breaks kept (social captions and video scripts are written in short lines). */
export function Lines({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, index) => (
        <Fragment key={index}>
          {index > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  );
}
