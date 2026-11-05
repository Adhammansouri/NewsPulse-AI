import type { Theme } from "@/services/themeStore";

/** Stops of the AI gradient — docs/redesign/design/icons.json notes (light #0D9B8A→#0EA5E9, dark #2DD4BF→#38BDF8). */
const AI_GRADIENT_STOPS: Record<Theme, readonly [string, string]> = {
  light: ["#0d9b8a", "#0ea5e9"],
  dark: ["#2dd4bf", "#38bdf8"],
};

export type AiGradientDefsProps = { theme: Theme };

/**
 * Hidden `#np-ai-grad` definition that AI icons and the pulse line stroke with (`stroke: url(#np-ai-grad)`).
 * Markup as in the reference boards; rendered once, by AppRoot.
 */
export function AiGradientDefs({ theme }: AiGradientDefsProps) {
  const [from, to] = AI_GRADIENT_STOPS[theme];
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id="np-ai-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
    </svg>
  );
}
