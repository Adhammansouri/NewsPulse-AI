import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from "react";
import { cx } from "./cx";

type PulsePreset = {
  /** Fluid presets stretch to the container (`width="100%"`, `preserveAspectRatio="none"`). */
  fluid: boolean;
  w: number;
  h: number;
  d: string;
  /** Static grey track under the moving dash (`path.base`). Small inline pulses have none. */
  base: boolean;
  /** Track colour on navy surfaces (splash, login hero), exactly as the reference sets it. */
  baseStyle?: CSSProperties;
  svgStyle?: CSSProperties;
};

/**
 * Every pulse line drawn in docs/redesign/design/reference, keyed by its viewBox size.
 * Pick the preset of the board you are building; never draw a new one.
 */
export const PULSE_LINE_PRESETS = {
  /** DesignSystem · AI panel */
  "300x36": { fluid: true, w: 300, h: 36, d: "M0 18h90l12-14 16 28 14-22 10 8h158", base: true },
  /** MobGenerate / MobGenerating · AI panel */
  "320x44": { fluid: true, w: 320, h: 44, d: "M0 22h96l12-16 16 32 14-26 10 10h172", base: true },
  /** States · «الذكاء الاصطناعي يشتغل» */
  "360x40": { fluid: true, w: 360, h: 40, d: "M0 20h110l12-15 16 30 14-24 10 9h198", base: true },
  /** DeskLogin · navy hero */
  "520x56": {
    fluid: true,
    w: 520,
    h: 56,
    d: "M0 28h180l16-22 22 44 18-34 14 12h270",
    base: true,
    baseStyle: { stroke: "rgb(255 255 255 / .1)" },
  },
  /** MobLogin · navy hero */
  "320x34": {
    fluid: true,
    w: 320,
    h: 34,
    d: "M0 17h110l10-12 14 24 12-18 8 6h166",
    base: true,
    baseStyle: { stroke: "rgb(255 255 255 / .12)" },
    svgStyle: { position: "relative" },
  },
  /** Main-generating · AI panel */
  "286x44": { fluid: false, w: 286, h: 44, d: "M0 22h80l12-16 16 32 14-26 10 10h154", base: true },
  /** DeskGenerate-writing */
  "256x40": { fluid: false, w: 256, h: 40, d: "M0 20h70l12-15 16 30 14-24 10 9h134", base: true },
  /** Splash · navy */
  "240x40": {
    fluid: false,
    w: 240,
    h: 40,
    d: "M0 20h80l10-14 14 28 12-22 8 8h116",
    base: true,
    baseStyle: { stroke: "rgb(255 255 255 / .12)" },
  },
  /** MobSplash · navy */
  "200x36": {
    fluid: false,
    w: 200,
    h: 36,
    d: "M0 18h64l9-13 13 26 11-20 7 7h96",
    base: true,
    baseStyle: { stroke: "rgb(255 255 255 / .12)" },
  },
  /** MobWire-refresh · pull to refresh */
  "120x28": { fluid: false, w: 120, h: 28, d: "M0 14h40l6-10 8 20 7-14 5 5h54", base: true },
  /** DeskTranslate-busy */
  "90x24": { fluid: false, w: 90, h: 24, d: "M0 12h26l6-9 8 18 7-13 5 4h38", base: false },
  /** MobTranslate · busy */
  "80x24": { fluid: false, w: 80, h: 24, d: "M0 12h22l6-9 8 18 7-13 5 4h32", base: false },
  /** Main · editor revising bubble */
  "64x20": { fluid: false, w: 64, h: 20, d: "M0 10h18l4-7 6 14 5-11 4 4h27", base: false },
  /** MobDraft-revising bubble */
  "60x20": { fluid: false, w: 60, h: 20, d: "M0 10h16l4-7 6 14 5-11 4 4h25", base: false },
  /** DeskLogin · loading submit button (the small pulse used by `Button loading`) */
  "54x20": { fluid: false, w: 54, h: 20, d: "M0 10h14l4-7 6 14 5-11 4 4h21", base: false },
} as const satisfies Record<string, PulsePreset>;

export type PulseLinePreset = keyof typeof PULSE_LINE_PRESETS;

export type PulseLineProps = Omit<ComponentPropsWithoutRef<"svg">, "children"> & {
  /** Reference size (viewBox `w×h`). Default `300x36` (DesignSystem board). */
  preset?: PulseLinePreset;
};

/** `svg.pulse-line`: grey base track + the AI-gradient dash animated by np4.css (`np-dash`). */
export const PulseLine = forwardRef<SVGSVGElement, PulseLineProps>(function PulseLine(
  { preset = "300x36", className, style, ...rest },
  ref,
) {
  const p: PulsePreset = PULSE_LINE_PRESETS[preset];
  const svgStyle = p.svgStyle || style ? { ...p.svgStyle, ...style } : undefined;

  return (
    <svg
      ref={ref}
      className={cx("pulse-line", className)}
      width={p.fluid ? "100%" : p.w}
      height={p.h}
      viewBox={`0 0 ${p.w} ${p.h}`}
      preserveAspectRatio={p.fluid ? "none" : undefined}
      aria-hidden="true"
      style={svgStyle}
      {...rest}
    >
      {p.base && <path className="base" d={p.d} style={p.baseStyle} />}
      <path d={p.d} />
    </svg>
  );
});
