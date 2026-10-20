import { CheckCircle, Info, WarningCircle, WarningOctagon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

const ICONS = { info: Info, ok: CheckCircle, warn: WarningCircle, error: WarningOctagon } as const;

export function Notice({
  tone = "info",
  title,
  children,
  role,
}: {
  tone?: keyof typeof ICONS;
  title?: string;
  children?: ReactNode;
  role?: "alert" | "status" | "note";
}) {
  const Icon = ICONS[tone];
  return (
    <div className={`notice is-${tone}`} role={role ?? (tone === "error" ? "alert" : "note")}>
      <Icon size={20} weight="fill" aria-hidden="true" />
      <div>
        {title ? <strong>{title}</strong> : null}
        {children}
      </div>
    </div>
  );
}
