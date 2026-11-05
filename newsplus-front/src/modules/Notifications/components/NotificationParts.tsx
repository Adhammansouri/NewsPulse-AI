// Pieces shared by DeskNotifications and MobNotif (docs/redesign/design/reference). Inline styles are the boards' own.
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/cx";
import type { Callout } from "../notificationsModel";

/** One «لو ظهرت لك رسالة من دول» callout (DeskNotifications `states`). */
export function CalloutNotice({ callout }: { callout: Callout }) {
  return (
    <div className={cx("notice", `notice--${callout.variant}`)} style={{ flexDirection: "column", gap: "6px" }}>
      <span className="row" style={{ fontWeight: 600 }}>
        <span
          className={cx("ic-wrap", callout.iconWrap)}
          style={{ width: "28px", height: "28px", borderRadius: "8px", background: "var(--surface)" }}
        >
          <Icon name={callout.icon} size="sm" />
        </span>
        {callout.title}
      </span>
      <span className="t-small">{callout.text}</span>
    </div>
  );
}

/** The `ul` of benefits in the off state's `ai-panel` (copy differs per board). */
export function Benefits({ items }: { items: readonly string[] }) {
  return (
    <ul className="col" style={{ gap: "8px" }}>
      {items.map((item) => (
        <li key={item} className="row t-small">
          <Icon name="check" size="sm" style={{ color: "var(--teal)" }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Status dot of a cell (`c.dot` on the boards). */
export function Dot({ color, size }: { color: string; size: number }) {
  return (
    <span style={{ width: `${size}px`, height: `${size}px`, borderRadius: "50%", background: color, flex: "none" }} />
  );
}

/** Logo of the notification preview («شكل الإشعار»). */
export const PREVIEW_LOGO = "/logo-icon.png";
