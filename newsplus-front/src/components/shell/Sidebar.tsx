import { Bell, CaretDoubleLeft, SignOut } from "@phosphor-icons/react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { BrandMark } from "@/components/shared/BrandMark";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useRailCollapsed } from "@/hooks/useRailCollapsed";
import { useSession } from "@/hooks/useSession";
import { NAV_ITEMS, SECONDARY_NAV, isActivePath } from "@/utils/nav";
import { useLogout } from "./useLogout";

export function Sidebar() {
  const { pathname } = useLocation();
  const session = useSession();
  const { collapsed, toggle } = useRailCollapsed();
  const { logout, pending } = useLogout();
  const name = session?.user.displayName ?? session?.user.identifier ?? "";
  const items = [...NAV_ITEMS, ...SECONDARY_NAV];

  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`} aria-label="التنقل الرئيسي">
      <div className="sidebar-top">
        <Link to="/" className="sidebar-brand" aria-label="Newsplus — المكتب">
          <BrandMark iconOnly={collapsed} />
        </Link>
        <button type="button" className="icon-btn is-sm sidebar-collapse" onClick={toggle} aria-expanded={!collapsed} aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}>
          <CaretDoubleLeft size={16} weight="bold" aria-hidden="true" />
        </button>
      </div>

      <nav className="sidebar-nav wire-in" aria-label="الأقسام">
        {items.map((item, index) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={`nav-link ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              style={{ "--i": index } as React.CSSProperties}
            >
              <Icon size={22} weight={active ? "fill" : "regular"} aria-hidden="true" />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-foot">
        <Link to="/notifications" className={`nav-link ${pathname === "/notifications" ? "is-active" : ""}`} title={collapsed ? "الإشعارات" : undefined} aria-current={pathname === "/notifications" ? "page" : undefined}>
          <Bell size={22} weight={pathname === "/notifications" ? "fill" : "regular"} aria-hidden="true" />
          <span className="nav-label">الإشعارات</span>
        </Link>
        <ThemeToggle className="nav-link nav-button" withLabel />
        {session ? (
          <div className="sidebar-user">
            <span className="avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
            <span className="sidebar-user-copy">
              <span className="sidebar-user-name truncate">{name}</span>
              <span className="sidebar-user-role">{session.user.role === "admin" ? "مسؤول النظام" : "محرر"}</span>
            </span>
            <button type="button" className="icon-btn is-sm sidebar-logout" onClick={() => void logout()} disabled={pending} aria-label="تسجيل الخروج" title="تسجيل الخروج">
              <SignOut size={18} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
