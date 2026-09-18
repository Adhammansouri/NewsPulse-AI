import { useEffect, useId, useRef, useState } from "react";
import { Bell, CaretLeft, List, X } from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";
import { BrandMark } from "@/components/shared/BrandMark";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useSession } from "@/hooks/useSession";
import { BRAND_NAV_ICONS, isActiveNavPath } from "@/utils/brandNav";
import { HEADER_LOGIN, NAV_ITEMS } from "@/utils/constants";

export function Header() {
  const { pathname } = useLocation();
  const session = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerEntered, setDrawerEntered] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const mobileNavId = useId();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      setDrawerEntered(false);
      return;
    }

    setDrawerMounted(true);
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setDrawerEntered(true);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen || !drawerMounted) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(() => setDrawerMounted(false), reduceMotion ? 0 : 360);

    return () => window.clearTimeout(timeout);
  }, [drawerMounted, mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = drawerMounted ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerMounted]);

  useEffect(() => {
    if (!mobileOpen || !drawerEntered) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    const current = sheetRef.current?.querySelector<HTMLElement>("[aria-current='page']");
    (current ?? closeBtnRef.current)?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      menuBtnRef.current?.focus();
    };
  }, [drawerEntered, mobileOpen]);

  const drawerClass = drawerEntered ? "brand-header-drawer is-open" : "brand-header-drawer";
  const scrimClass = drawerEntered ? "brand-header-scrim is-open" : "brand-header-scrim";

  return (
    <header className="brand-header-sticky">
      <a href="#main-content" className="brand-skip-link">
        تخطي إلى المحتوى
      </a>

      <div className="brand-header-shell">
        <Link to="/" className="brand-header-mark" aria-label="Newsplus الصفحة الرئيسية">
          <BrandMark size="sm" />
        </Link>

        <button
          ref={menuBtnRef}
          type="button"
          className="brand-header-icon-btn brand-header-menu-btn"
          aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={mobileOpen}
          aria-controls={mobileNavId}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <List size={20} weight="bold" aria-hidden="true" />
        </button>
      </div>

      {drawerMounted ? (
        <>
          <button type="button" className={scrimClass} aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)} />
          <nav
            ref={sheetRef}
            id={mobileNavId}
            className={drawerClass}
            aria-label="القائمة"
            role="dialog"
            aria-modal="true"
          >
            <div className="brand-header-drawer__accent" aria-hidden="true" />

            <div className="brand-header-drawer__top">
              <Link to="/" className="brand-header-mark" aria-label="Newsplus الصفحة الرئيسية">
                <BrandMark size="sm" />
              </Link>
              <button
                ref={closeBtnRef}
                type="button"
                className="brand-header-icon-btn brand-header-drawer__close"
                aria-label="إغلاق القائمة"
                onClick={() => setMobileOpen(false)}
              >
                <X size={20} weight="bold" aria-hidden="true" />
              </button>
            </div>

            <div className="brand-header-drawer__body">
              <div className="brand-header-drawer__menu">
                {NAV_ITEMS.map((item, index) => {
                  const active = isActiveNavPath(pathname, item.href);
                  const Icon = BRAND_NAV_ICONS[item.href];
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={[
                        "brand-header-drawer-link",
                        active ? "brand-header-drawer-link--active" : "",
                      ].join(" ")}
                      style={{ "--i": index } as React.CSSProperties}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="brand-header-drawer-link__icon" aria-hidden="true">
                        <Icon size={20} weight={active ? "fill" : "regular"} />
                      </span>
                      <span className="brand-header-drawer-link__label">{item.label}</span>
                      <CaretLeft className="brand-header-drawer-link__chevron" size={16} weight="bold" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="brand-header-drawer__footer">
              <div className="brand-header-drawer__prefs">
                <span className="brand-header-drawer__prefs-label">المظهر</span>
                <div className="brand-header-drawer__prefs-actions">
                  <ThemeToggle />
                </div>
              </div>
              {session ? (
                <Link
                  to="/notifications"
                  className={[
                    "brand-header-drawer-link",
                    pathname === "/notifications" ? "brand-header-drawer-link--active" : "",
                  ].join(" ")}
                  aria-current={pathname === "/notifications" ? "page" : undefined}
                >
                  <span className="brand-header-drawer-link__icon" aria-hidden="true">
                    <Bell size={20} weight={pathname === "/notifications" ? "fill" : "regular"} />
                  </span>
                  <span className="brand-header-drawer-link__label">إدارة الإشعارات</span>
                  <CaretLeft className="brand-header-drawer-link__chevron" size={16} weight="bold" aria-hidden="true" />
                </Link>
              ) : null}
              {!session ? (
                <Link to={HEADER_LOGIN.href} className="brand-header-ghost-btn brand-header-ghost-btn--block">
                  {HEADER_LOGIN.label}
                </Link>
              ) : null}
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
