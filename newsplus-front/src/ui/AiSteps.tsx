import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";

export type AiStepStatus = "done" | "active" | "todo";

export type AiStep = {
  /** React key; defaults to the index. */
  id?: string;
  label: ReactNode;
  status: AiStepStatus;
  /** Dot content; defaults to the small check for `done` steps, empty otherwise. */
  icon?: ReactNode;
};

export type AiStepsProps = Omit<ComponentPropsWithoutRef<"ol">, "children"> & {
  steps: ReadonlyArray<AiStep>;
  /** Inline style on every `li.step` (compact boards set `font-size: 13.5px`). */
  stepStyle?: CSSProperties;
  /** Inline style on every `span.step__dot` (compact boards set `width/height: 20px`). */
  dotStyle?: CSSProperties;
};

const STATUS_CLASS: Record<AiStepStatus, string | undefined> = {
  done: "is-done",
  active: "is-active",
  todo: undefined,
};

/** `ol.steps` of `li.step` (`is-done` / `is-active`) with `span.step__dot`. Put `aria-live` on the surrounding AI panel. */
export const AiSteps = forwardRef<HTMLOListElement, AiStepsProps>(function AiSteps(
  { steps, stepStyle, dotStyle, className, ...rest },
  ref,
) {
  return (
    <ol ref={ref} className={cx("steps", className)} {...rest}>
      {steps.map((step, index) => (
        <li key={step.id ?? index} className={cx("step", STATUS_CLASS[step.status])} style={stepStyle}>
          <span className="step__dot" style={dotStyle}>
            {step.icon ?? (step.status === "done" ? <Icon name="check" size="sm" /> : null)}
          </span>
          {step.label}
        </li>
      ))}
    </ol>
  );
});
