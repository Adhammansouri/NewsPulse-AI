import { Link, useLocation } from "react-router-dom";
import { Icon, type IconName } from "@/ui/Icon";
import { cx } from "@/ui/cx";
import { isSectionActive } from "./routeMeta";

type Tab = { to: string; label: string; icon: IconName; ai?: boolean };

const TABS: readonly Tab[] = [
  { to: "/", label: "الرئيسية", icon: "home" },
  { to: "/news", label: "الأخبار", icon: "news" },
  { to: "/generate", label: "توليد", icon: "sparkle", ai: true },
  { to: "/translate", label: "ترجمة", icon: "translate" },
  { to: "/more", label: "المزيد", icon: "more" },
];

/**
 * npm2 `m-tabbar` is 84px tall with 24px bottom padding (the 390×844 frame); on devices with a home
 * indicator both grow by the safe-area inset (GLOBAL-RULES §6), so the tabs keep their 52px row.
 */
const SAFE_AREA_STYLE = {
  height: "calc(84px + env(safe-area-inset-bottom))",
  paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
} as const;

/** Mobile tab bar (S02 §3, `nav.m-tabbar` on the Mob* boards): five tabs, «توليد» raised in the centre. */
export function TabBar() {
  const { pathname } = useLocation();

  return (
    <nav className="m-tabbar" aria-label="التنقل" style={SAFE_AREA_STYLE}>
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className={cx("m-tab", tab.ai && "m-tab--ai")}
          aria-current={isSectionActive(pathname, tab.to) ? "page" : undefined}
        >
          <span className="m-tab__ic">
            <Icon name={tab.icon} size={tab.ai ? "lg" : "md"} />
          </span>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
