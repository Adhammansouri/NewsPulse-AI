import { Bell, ChartBar, DotsThree, SignOut } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { BrandMark } from "@/components/shared/BrandMark";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Sheet } from "@/components/ui/Sheet";
import { useSession } from "@/hooks/useSession";
import { NAV_ITEMS, isActivePath, titleForPath } from "@/utils/nav";
import { useLogout } from "./useLogout";

export function MobileBar() {
  const { pathname } = useLocation();
  const session = useSession();
  const { logout, pending } = useLogout();
  const [moreOpen, setMoreOpen] = useState(false);
  const name = session?.user.displayName ?? session?.user.identifier ?? "";
  const moreActive = pathname.startsWith("/usage") || pathname.startsWith("/notifications");

  useEffect(() => setMoreOpen(false), [pathname]);

  return (
    <>
      <header className="topbar">
        <Link to="/" aria-label="Newsplus — المكتب" className="topbar-brand">
          <BrandMark iconOnly size={32} />
        </Link>
        <p className="topbar-title" aria-hidden="true">{titleForPath(pathname)}</p>
        <ThemeToggle />
      </header>

      <nav className="tabbar" aria-label="التنقل">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <NavLink key={item.href} to={item.href} end={item.href === "/"} className={`tab ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}>
              <span className="tab-icon"><Icon size={24} weight={active ? "fill" : "regular"} aria-hidden="true" /></span>
              <span className="tab-label">{item.short}</span>
            </NavLink>
          );
        })}
        <button type="button" className={`tab ${moreActive ? "is-active" : ""}`} onClick={() => setMoreOpen(true)} aria-haspopup="dialog" aria-expanded={moreOpen}>
          <span className="tab-icon"><DotsThree size={26} weight="bold" aria-hidden="true" /></span>
          <span className="tab-label">المزيد</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="المزيد" subtitle={name ? `مسجّل باسم ${name}` : undefined} variant="center">
        <ul className="more-list">
          <li><Link to="/usage" className="more-item"><ChartBar size={22} aria-hidden="true" />استهلاك الذكاء الاصطناعي</Link></li>
          <li><Link to="/notifications" className="more-item"><Bell size={22} aria-hidden="true" />الإشعارات</Link></li>
          <li className="more-item more-item--plain"><span>المظهر</span><ThemeToggle /></li>
          <li>
            <button type="button" className="more-item more-item--danger" onClick={() => void logout()} disabled={pending}>
              <SignOut size={22} aria-hidden="true" />
              {pending ? "جارٍ الخروج…" : "تسجيل الخروج"}
            </button>
          </li>
        </ul>
      </Sheet>
    </>
  );
}
