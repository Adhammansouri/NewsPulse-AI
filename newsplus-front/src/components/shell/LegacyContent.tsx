import type { ReactNode } from "react";
import { cx } from "@/ui/cx";

/**
 * TRANSITIONAL (S02 → S10): content area of a pre-Pulse page inside the new shell. It takes over what the
 * old MainLayout gave those pages — the legacy text baseline and scroll area (styles/legacy-bridge.css,
 * scope `.np-legacy`) and, for the legacy news studio (`tools`), the Nothing `theme-tools` surface. Remove it
 * as soon as the page or pane is rebuilt on the Pulse boards.
 */
export function LegacyContent({ tools = false, children }: { tools?: boolean; children: ReactNode }) {
  return <div className={cx("np-legacy", tools && "np-legacy--tools theme-tools")}>{children}</div>;
}
