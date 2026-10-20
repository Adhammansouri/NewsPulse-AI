import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type SegmentedOption<T extends string> = {
  id: T;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
};

type SegmentedProps<T extends string> = {
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (id: T) => void;
  ariaLabel: string;
  size?: "md" | "sm";
  block?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Segmented control with a sliding thumb. Radio-group semantics. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  size = "md",
  block = false,
  disabled = false,
  className = "",
}: SegmentedProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const active = root.querySelector<HTMLElement>('[aria-checked="true"]');
      if (!active) return setThumb(null);
      setThumb({ x: active.offsetLeft, w: active.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [value, options.length]);

  function onKeyDown(event: React.KeyboardEvent) {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const enabled = options.filter((o) => !o.disabled);
    const index = enabled.findIndex((o) => o.id === value);
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const forward = event.key === "ArrowDown" || event.key === (rtl ? "ArrowLeft" : "ArrowRight");
    const next = enabled[(index + (forward ? 1 : -1) + enabled.length) % enabled.length];
    if (next) onChange(next.id);
  }

  return (
    <div
      ref={rootRef}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={["seg", size === "sm" ? "is-sm" : "", block ? "is-block" : "", thumb ? "has-thumb" : "", className].filter(Boolean).join(" ")}
      style={thumb ? ({ "--x": `${thumb.x}px`, "--w": `${thumb.w}px` } as React.CSSProperties) : undefined}
    >
      {thumb ? <span className="seg-thumb" aria-hidden="true" /> : null}
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.ariaLabel}
            tabIndex={active ? 0 : -1}
            title={option.title}
            disabled={disabled || option.disabled}
            className={`seg-btn ${active ? "is-active" : ""}`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
            {option.count !== undefined ? <span className="count"><bdi>{option.count}</bdi></span> : null}
          </button>
        );
      })}
    </div>
  );
}
