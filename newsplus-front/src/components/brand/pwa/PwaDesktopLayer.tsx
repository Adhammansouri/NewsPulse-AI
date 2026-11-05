import type { CSSProperties, ReactNode } from "react";

/**
 * Desktop: the PWA cards float bottom-centre over the app (where the old banner sat, and the Main board's toast
 * placement: 24px from the bottom), stacked with the States grid gap. The layer ignores the pointer; the cards don't.
 */
export const PWA_DESKTOP_LAYER_STYLE: CSSProperties = {
  position: "fixed",
  insetInline: 0,
  bottom: "24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "16px",
  pointerEvents: "none",
  zIndex: 6,
};

/** States «التطبيق على الجهاز» card: `panel col` + `--shadow-3`, at its column width on the 1440 board (320px). */
export function PwaDesktopCard({
  labelledBy,
  style,
  role = "region",
  children,
}: {
  labelledBy: string;
  style: CSSProperties;
  role?: "region" | "status";
  children: ReactNode;
}) {
  return (
    <div
      className="panel col"
      role={role}
      aria-labelledby={labelledBy}
      style={{ ...style, boxShadow: "var(--shadow-3)", width: "320px", pointerEvents: "auto" }}
    >
      {children}
    </div>
  );
}
