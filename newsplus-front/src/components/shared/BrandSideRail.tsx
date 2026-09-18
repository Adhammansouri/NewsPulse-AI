import { Bell, CaretDoubleLeft, SignIn } from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";
import { BrandMark } from "@/components/shared/BrandMark";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { usePushNotifications, pushStatusDot } from "@/hooks/usePushNotifications";
import { useRailCollapsed } from "@/hooks/useRailCollapsed";
import { useSession } from "@/hooks/useSession";
import { BRAND_NAV_ICONS, isActiveNavPath } from "@/utils/brandNav";
import { HEADER_LOGIN, NAV_ITEMS } from "@/utils/constants";

const RAIL_ICON_BTN = "brand-side-rail__icon-btn";

export function BrandSideRail() {
  const { pathname } = useLocation();
  const session = useSession();
  const { collapsed, toggle } = useRailCollapsed();
  const { status, hasSubscription } = usePushNotifications();
  const notificationsActive = pathname === "/notifications";
  const dot = pushStatusDot(status, hasSubscription);

  return (
    <aside
      className={["brand-side-rail", collapsed ? "is-collapsed" : ""].join(" ")}
      aria-label="التنقل الرئيسي"
      data-collapsed={collapsed ? "true" : "false"}
    >
      <button
        type="button"
        className="brand-side-rail__collapse-btn"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
      >
        <CaretDoubleLeft size={16} weight="bold" className="brand-side-rail__collapse-icon" aria-hidden="true" />
      </button>

      <header className="brand-side-rail__masthead">
        <Link to="/" className="brand-side-rail__mark" aria-label="Newsplus الصفحة الرئيسية">
          <BrandMark size="sm" showTagline={!collapsed} iconOnly={collapsed} />
        </Link>
        <p className="brand-side-rail__kicker brand-side-rail__reveal-text">مكتب التحرير</p>
      </header>

      <nav className="brand-side-rail__nav" aria-labelledby="brand-side-rail-nav-label">
        <div className="brand-side-rail__nav-scroll">
          <p id="brand-side-rail-nav-label" className="brand-side-rail__section-label brand-side-rail__reveal-text">
            التنقل
          </p>
          <ul className="brand-side-rail__list">
            {NAV_ITEMS.map((item) => {
              const active = isActiveNavPath(pathname, item.href);
              const Icon = BRAND_NAV_ICONS[item.href];
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={["brand-side-rail-link", active ? "brand-side-rail-link--active" : ""].join(" ")}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="brand-side-rail-link__icon" aria-hidden="true">
                      <Icon size={20} weight={active ? "fill" : "regular"} />
                    </span>
                    <span className="brand-side-rail-link__label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <footer className="brand-side-rail__foot">
        <p className="brand-side-rail__section-label brand-side-rail__section-label--foot brand-side-rail__reveal-text">
          الإعدادات
        </p>
        <div className="brand-side-rail__settings" aria-label="إعدادات سريعة">
          <div
            className="brand-side-rail__setting brand-side-rail__setting--appearance"
            title={collapsed ? "المظهر" : undefined}
          >
            <span className="brand-side-rail__setting-label brand-side-rail__reveal-text">المظهر</span>
            <ThemeToggle className={RAIL_ICON_BTN} />
          </div>
          {session ? (
            <Link
              to="/notifications"
              className={[
                "brand-side-rail__setting",
                "brand-side-rail__setting--link",
                notificationsActive ? "brand-side-rail__setting--active" : "",
              ].join(" ")}
              aria-current={notificationsActive ? "page" : undefined}
              title={collapsed ? "الإشعارات" : undefined}
            >
              <span className="brand-side-rail__setting-icon brand-side-rail__setting-icon--notify" aria-hidden="true">
                <Bell size={20} weight={notificationsActive ? "fill" : "regular"} />
                <span className="brand-side-rail__status-dot brand-side-rail__status-dot--badge" data-status={dot} />
              </span>
              <span className="brand-side-rail__setting-label brand-side-rail__reveal-text">الإشعارات</span>
              <span className="brand-side-rail__setting-meta brand-side-rail__reveal-inline">
                <span className="brand-side-rail__status-dot" data-status={dot} aria-hidden="true" />
                <span className="sr-only">
                  {dot === "on" ? "مفعّلة" : dot === "blocked" ? "محظورة" : dot === "off" ? "غير مفعّلة" : "غير متاحة"}
                </span>
              </span>
            </Link>
          ) : null}
        </div>
        {!session ? (
          <Link
            to={HEADER_LOGIN.href}
            className="brand-side-rail__login brand-header-ghost-btn brand-header-ghost-btn--block"
            title={collapsed ? HEADER_LOGIN.label : undefined}
          >
            {collapsed ? (
              <SignIn size={20} weight="regular" aria-hidden="true" />
            ) : (
              HEADER_LOGIN.label
            )}
            {collapsed ? <span className="sr-only">{HEADER_LOGIN.label}</span> : null}
          </Link>
        ) : null}
      </footer>
    </aside>
  );
}
