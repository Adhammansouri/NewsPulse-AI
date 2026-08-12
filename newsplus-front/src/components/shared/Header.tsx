import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HEADER_CTA, NAV_ITEMS } from "@/utils/constants";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function navLinkClass(active: boolean) {
  return [
    "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2",
    active
      ? "bg-white text-navy-900 shadow-sm ring-1 ring-slate-200/80"
      : "text-slate-600 hover:bg-white/70 hover:text-navy-900",
  ].join(" ");
}

const ctaClass =
  "inline-flex shrink-0 items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2";

export function Header() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/85">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-l from-teal-600 via-cyan-500 to-teal-600" />

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2"
          aria-label="Newsplus — الصفحة الرئيسية"
        >
          <img
            src="/icons/logo-icon.png"
            alt=""
            width={36}
            height={36}
            className="rounded-lg shadow-sm ring-1 ring-slate-200/60 transition group-hover:ring-teal-600/30"
          />
          <img
            src="/logo-horizontal.png"
            alt="Newsplus"
            width={132}
            height={28}
            className="hidden h-7 w-auto sm:block"
          />
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <nav
            className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 ring-1 ring-slate-200/60"
            aria-label="التنقل الرئيسي"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={navLinkClass(active)}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link to={HEADER_CTA.href} className={ctaClass}>
            {HEADER_CTA.label}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-navy-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2 md:hidden"
          aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-16 z-40 bg-navy-900/20 backdrop-blur-[1px] md:hidden"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileOpen(false)}
          />
          <nav
            id="mobile-nav"
            className="relative z-50 border-t border-slate-200 bg-white px-4 py-3 shadow-md md:hidden"
            aria-label="التنقل الرئيسي"
          >
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={[
                      "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-teal-600/10 text-teal-600"
                        : "text-slate-600 hover:bg-slate-50 hover:text-navy-900",
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <Link to={HEADER_CTA.href} className={`${ctaClass} mt-2 w-full py-3`}>
                {HEADER_CTA.label}
              </Link>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
