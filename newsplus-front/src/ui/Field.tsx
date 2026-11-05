import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { cx } from "./cx";

export type FieldState = "focus" | "valid" | "error";
export type HintTone = "error" | "ok";

type FieldContextValue = { hintId?: string; invalid: boolean };
const FieldContext = createContext<FieldContextValue>({ invalid: false });

/* ---------- Hint ---------- */

export type HintProps = ComponentPropsWithoutRef<"p"> & {
  /** `hint--error` / `hint--ok`; omit for the neutral grey hint. */
  tone?: HintTone;
};

/** `p.hint` (+ `hint--error` / `hint--ok`). */
export const Hint = forwardRef<HTMLParagraphElement, HintProps>(function Hint({ tone, className, ...rest }, ref) {
  return <p ref={ref} className={cx("hint", tone && `hint--${tone}`, className)} {...rest} />;
});

/* ---------- Field ---------- */

type FieldOwnProps = {
  /** Wrapper element: `div` (default) or `label` (the whole field is clickable, as in the search fields). */
  as?: "div" | "label";
  /** `field--sunken`: sunken search field. */
  sunken?: boolean;
  /** `field--area`: multi-line field around a textarea. */
  area?: boolean;
  /**
   * Static visual state: `is-focus` (the CSS already applies it on `:focus-within`, so pass it only
   * to pin the look), `is-valid`, `is-error`. `error` also marks `FieldInput`/`FieldTextarea` `aria-invalid`.
   */
  state?: FieldState;
  /** Message under the field, rendered as a sibling `p.hint`. */
  hint?: ReactNode;
  /** Hint tone. Defaults to `error` when `state="error"`. */
  hintTone?: HintTone;
  /** Id of the hint (auto-generated). `FieldInput`/`FieldTextarea` point `aria-describedby` at it. */
  hintId?: string;
};

export type FieldProps = Omit<HTMLAttributes<HTMLElement>, keyof FieldOwnProps> &
  FieldOwnProps & {
    /** Only with `as="label"`. */
    htmlFor?: string;
  };

/**
 * `.field` wrapper: put the icon, the control and any trailing `kbd` inside, exactly as the board does.
 * Use `FieldInput` / `FieldTextarea` (or a plain `<input>`) as the control.
 */
export const Field = forwardRef<HTMLElement, FieldProps>(function Field(
  { as = "div", sunken = false, area = false, state, hint, hintTone, hintId, className, children, htmlFor, ...rest },
  ref,
) {
  const autoId = useId();
  const resolvedHintId = hint != null ? (hintId ?? `${autoId}-hint`) : undefined;
  const tone = hintTone ?? (state === "error" ? "error" : undefined);
  const classes = cx(
    "field",
    sunken && "field--sunken",
    area && "field--area",
    state && `is-${state}`,
    className,
  );

  const content = (
    <FieldContext.Provider value={{ hintId: resolvedHintId, invalid: state === "error" }}>{children}</FieldContext.Provider>
  );

  return (
    <>
      {as === "label" ? (
        <label ref={ref as Ref<HTMLLabelElement>} className={classes} htmlFor={htmlFor} {...rest}>
          {content}
        </label>
      ) : (
        <div ref={ref as Ref<HTMLDivElement>} className={classes} {...rest}>
          {content}
        </div>
      )}
      {hint != null && (
        <Hint id={resolvedHintId} tone={tone}>
          {hint}
        </Hint>
      )}
    </>
  );
});

/* ---------- Controls wired to the Field ---------- */

function describedBy(own: string | undefined, hintId: string | undefined): string | undefined {
  const ids = [own, hintId].filter(Boolean).join(" ");
  return ids || undefined;
}

export type FieldInputProps = ComponentPropsWithoutRef<"input">;

/** `<input>` that picks up the parent `Field` hint (`aria-describedby`) and error state (`aria-invalid`). */
export const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(function FieldInput(
  { "aria-describedby": ownDescribedBy, "aria-invalid": ownInvalid, ...rest },
  ref,
) {
  const { hintId, invalid } = useContext(FieldContext);
  return (
    <input
      ref={ref}
      aria-describedby={describedBy(ownDescribedBy, hintId)}
      aria-invalid={ownInvalid ?? (invalid || undefined)}
      {...rest}
    />
  );
});

export type FieldTextareaProps = ComponentPropsWithoutRef<"textarea">;

/** `<textarea>` counterpart of `FieldInput` (use inside `<Field area>`). */
export const FieldTextarea = forwardRef<HTMLTextAreaElement, FieldTextareaProps>(function FieldTextarea(
  { "aria-describedby": ownDescribedBy, "aria-invalid": ownInvalid, ...rest },
  ref,
) {
  const { hintId, invalid } = useContext(FieldContext);
  return (
    <textarea
      ref={ref}
      aria-describedby={describedBy(ownDescribedBy, hintId)}
      aria-invalid={ownInvalid ?? (invalid || undefined)}
      {...rest}
    />
  );
});
