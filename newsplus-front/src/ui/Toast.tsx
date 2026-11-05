import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cx } from "./cx";
import { Icon, type IconName } from "./Icon";

/** How long a toast stays up (S01: 1.9s). Hovering or focusing it pauses the countdown. */
export const TOAST_DURATION_MS = 1900;

/** Default action label (States board). */
export const TOAST_UNDO_LABEL = "تراجع";

/** The boards draw every toast icon in this teal. */
const TOAST_ICON_STYLE = { color: "#5eead4" } as const;

/** A States toast glyph the boards trim from an icon (one path), for `toast.show(…, { icon: <ToastGlyph … /> })`. */
export function ToastGlyph({ path }: { path: string }) {
  return (
    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true" style={TOAST_ICON_STYLE}>
      <path d={path} />
    </svg>
  );
}

export type ToastAction = {
  /** Button label — «تراجع» by default; S05 uses «افتح». */
  label?: string;
  onAction: () => void;
};

/* ---------- Presentational toast ---------- */

export type ToastProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  /** Leading icon: an icons.json name (drawn in `#5eead4` like the boards) or any node. Default: check. */
  icon?: IconName | ReactNode;
  /** Optional trailing action (`button.btn` inside the toast). */
  action?: ToastAction;
  children: ReactNode;
};

/** `span.toast`: icon, message, optional action button. The bare visual — show toasts with `useToast()`. */
export const Toast = forwardRef<HTMLSpanElement, ToastProps>(function Toast(
  { icon = "check", action, className, children, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cx("toast", className)} {...rest}>
      {typeof icon === "string" ? <Icon name={icon as IconName} style={TOAST_ICON_STYLE} /> : icon}
      {children}
      {action && (
        <button className="btn" type="button" onClick={action.onAction}>
          {action.label ?? TOAST_UNDO_LABEL}
        </button>
      )}
    </span>
  );
});

/* ---------- Provider, region, hook ---------- */

export type ShowToastOptions = {
  /** icons.json name or a node (some States toasts use trimmed glyphs). Default: check. */
  icon?: IconName | ReactNode;
  /** `{ onAction }` for «تراجع», or `{ label, onAction }` for another action. */
  action?: ToastAction;
};

export type ToastApi = {
  /** Shows a toast, replacing the current one (one at a time). */
  show: (message: ReactNode, options?: ShowToastOptions) => void;
  dismiss: () => void;
};

type ActiveToast = ShowToastOptions & { id: number; message: ReactNode };

type ToastState = {
  toast: ActiveToast | null;
  dismiss: () => void;
  setPaused: (paused: boolean) => void;
};

const ToastApiContext = createContext<ToastApi | null>(null);
const ToastStateContext = createContext<ToastState | null>(null);

export type ToastProviderProps = {
  children?: ReactNode;
  /**
   * `true` (default): renders `<ToastRegion />` right after `children`.
   * `false`: render `<ToastRegion />` yourself inside the positioned area the toast should centre in
   * (e.g. the studio `main`, as on the Main board).
   */
  region?: boolean;
};

/**
 * Holds the single toast (one at a time, auto-hides after 1.9s). Mount once inside the `.np` root.
 * Everything below can call `useToast()`.
 */
export function ToastProvider({ children, region = true }: ToastProviderProps) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const [paused, setPaused] = useState(false);
  const nextId = useRef(0);

  const dismiss = useCallback(() => setToast(null), []);
  const show = useCallback((message: ReactNode, options?: ShowToastOptions) => {
    nextId.current += 1;
    setPaused(false);
    setToast({ id: nextId.current, message, ...options });
  }, []);

  useEffect(() => {
    if (!toast || paused) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast, paused]);

  const api = useMemo<ToastApi>(() => ({ show, dismiss }), [show, dismiss]);
  const state = useMemo<ToastState>(() => ({ toast, dismiss, setPaused }), [toast, dismiss]);

  return (
    <ToastApiContext.Provider value={api}>
      <ToastStateContext.Provider value={state}>
        {children}
        {region && <ToastRegion />}
      </ToastStateContext.Provider>
    </ToastApiContext.Provider>
  );
}

/** Desktop placement, from the Main board: centred, 24px above the bottom of the positioned area. */
const DESKTOP_REGION_STYLE = {
  position: "absolute",
  bottom: "24px",
  insetInline: 0,
  display: "flex",
  justifyContent: "center",
  pointerEvents: "none",
} as const;

/**
 * The `aria-live` region that shows the current toast. Always in the DOM (so screen readers announce changes);
 * absolutely positioned against the nearest positioned ancestor: `div.m-toast` on mobile (`useIsMobile()`),
 * the Main-board bottom-centre wrapper on desktop.
 */
export function ToastRegion() {
  const state = useContext(ToastStateContext);
  const isMobile = useIsMobile();
  if (!state) throw new Error("<ToastRegion> must be inside <ToastProvider>.");
  const { toast, dismiss, setPaused } = state;

  const node = toast && (
    <Toast
      key={toast.id}
      icon={toast.icon}
      action={
        toast.action && {
          label: toast.action.label,
          onAction: () => {
            // Dismiss first: the action may show a follow-up toast, which must survive.
            dismiss();
            toast.action?.onAction();
          },
        }
      }
      // The desktop wrapper ignores the pointer (Main board); the toast itself stays clickable for its action.
      style={isMobile ? undefined : { pointerEvents: "auto" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {toast.message}
    </Toast>
  );

  return isMobile ? (
    <div className="m-toast" role="status" aria-live="polite" aria-atomic="true">
      {node}
    </div>
  ) : (
    <div role="status" aria-live="polite" aria-atomic="true" style={DESKTOP_REGION_STYLE}>
      {node}
    </div>
  );
}

/**
 * `const toast = useToast();`
 * `toast.show("نُسخ المنشور كاملاً")` · `toast.show("رجعت للنسخة ١", { icon, action: { onAction: undo } })`.
 */
export function useToast(): ToastApi {
  const api = useContext(ToastApiContext);
  if (!api) throw new Error("useToast() needs a <ToastProvider> above it (mount it once inside the .np root).");
  return api;
}
