import { Link, useLocation } from "react-router-dom";
import { features } from "@/config/features";
import { useSession } from "@/hooks/useSession";
import { useTheme } from "@/hooks/useTheme";
import { Icon, type IconName } from "@/ui/Icon";
import { cx } from "@/ui/cx";
import { AvatarMenu } from "./AvatarMenu";
import { isSectionActive } from "./routeMeta";
import { useRoutePending } from "./routePending";
import { openShortcuts } from "./shellOverlay";
import { useNotificationNudge } from "./useNotificationNudge";

type RailItem = { to: string; label: string; icon: IconName; visible: boolean };

/** Main.dc.html `rail__btn` style for the notifications link while it is the current page (DeskNotifications). */
const CURRENT_BTN_STYLE = { background: "rgb(45 212 191 / .14)", color: "#5eead4" } as const;

/**
 * Desktop navigation rail (S02 §2, `nav.rail` on the desktop boards): logo · sections · spacer ·
 * keyboard (flag) · notifications · theme · avatar. `aria-current="page"` on the active section and
 * `is-loading` on it while its navigation is pending (RouteLoader).
 */
export function Rail() {
  const { pathname } = useLocation();
  const session = useSession();
  const { toggleTheme } = useTheme();
  const pending = useRoutePending();
  const nudge = useNotificationNudge();

  const items: RailItem[] = [
    { to: "/", label: "الرئيسية", icon: "home", visible: true },
    { to: "/news", label: "الأخبار", icon: "news", visible: true },
    { to: "/board", label: "سير العمل", icon: "board", visible: features.workflow },
    { to: "/generate", label: "توليد", icon: "pen", visible: true },
    { to: "/translate", label: "ترجمة", icon: "translate", visible: true },
    // The usage API answers 403 to editors.
    { to: "/usage", label: "الاستهلاك", icon: "chart", visible: session?.user.role === "admin" },
  ];

  const notificationsCurrent = isSectionActive(pathname, "/notifications");

  return (
    <nav className="rail" aria-label="التنقل الرئيسي" style={{ position: "relative" }}>
      <img className="rail__logo" src="/logo-icon.png" alt="Newsplus" />
      {items
        .filter((item) => item.visible)
        .map((item) => {
          const current = isSectionActive(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cx("rail__item", current && pending && "is-loading")}
              aria-current={current ? "page" : undefined}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      <div style={{ flex: 1 }} />
      {features.shortcuts && (
        <button className="rail__btn" type="button" aria-label="اختصارات الكيبورد" onClick={openShortcuts}>
          <Icon name="keyboard" />
        </button>
      )}
      <Link
        className="rail__btn"
        to="/notifications"
        aria-label={nudge ? "الإشعارات، تنبيه جديد" : "الإشعارات"}
        aria-current={notificationsCurrent ? "page" : undefined}
        style={notificationsCurrent ? CURRENT_BTN_STYLE : undefined}
      >
        <Icon name="bell" />
        {nudge && <span className="dot-badge" style={{ boxShadow: "0 0 0 2px var(--navy)" }} />}
      </Link>
      <button className="rail__btn" type="button" aria-label="الوضع الداكن" onClick={toggleTheme}>
        <Icon name="moon" />
      </button>
      <AvatarMenu />
    </nav>
  );
}
