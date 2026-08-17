import { useEffect, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { BrandMark } from "@/components/shared/BrandMark";

import { ThemeToggle } from "@/components/shared/ThemeToggle";

import { useSession } from "@/hooks/useSession";

import { logout } from "@/services/authService";

import { HEADER_CTA, HEADER_LOGIN, HEADER_LOGOUT, NAV_ITEMS } from "@/utils/constants";



function isActivePath(pathname: string, href: string) {

  if (href === "/") return pathname === "/";

  return pathname.startsWith(href);

}



export function Header() {

  const { pathname } = useLocation();

  const navigate = useNavigate();

  const session = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);



  async function handleLogout() {

    await logout();

    navigate("/login", { replace: true });

  }



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

    <header className="brand-header-sticky">

      <div className="brand-header-shell">

        <Link

          to="/"

          className="shrink-0 rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2"

          aria-label="Newsplus — الصفحة الرئيسية"

        >

          <BrandMark size="sm" />

        </Link>



        <nav className="hidden flex-1 items-center justify-center md:flex" aria-label="التنقل الرئيسي">

          <div className="brand-header-nav">

            {NAV_ITEMS.map((item) => {

              const active = isActivePath(pathname, item.href);

              return (

                <Link

                  key={item.href}

                  to={item.href}

                  className={active ? "brand-header-nav-link brand-header-nav-link--active" : "brand-header-nav-link"}

                  aria-current={active ? "page" : undefined}

                >

                  {item.label}

                </Link>

              );

            })}

          </div>

        </nav>



        <div className="hidden shrink-0 items-center gap-2 md:flex">

          <ThemeToggle />

          {session ? (

            <button type="button" className="brand-header-ghost-btn" onClick={() => void handleLogout()}>

              {HEADER_LOGOUT.label}

            </button>

          ) : (

            <Link to={HEADER_LOGIN.href} className="brand-header-ghost-btn">

              {HEADER_LOGIN.label}

            </Link>

          )}

          <Link to={HEADER_CTA.href} className="brand-btn brand-btn-pill">

            {HEADER_CTA.label}

          </Link>

        </div>



        <button

          type="button"

          className="brand-header-icon-btn brand-header-icon-btn--neutral ms-auto md:hidden"

          aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}

          aria-expanded={mobileOpen}

          aria-controls="mobile-nav"

          onClick={() => setMobileOpen((open) => !open)}

        >

          {mobileOpen ? (

            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">

              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

            </svg>

          ) : (

            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">

              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

            </svg>

          )}

        </button>

      </div>



      {mobileOpen && (

        <>

          <button

            type="button"

            className="fixed inset-0 z-40 bg-[color-mix(in_srgb,var(--color-navy-900)_18%,transparent)] md:hidden"

            aria-label="إغلاق القائمة"

            onClick={() => setMobileOpen(false)}

          />

          <nav

            id="mobile-nav"

            className="brand-header-mobile-sheet relative z-50 md:hidden"

            aria-label="التنقل الرئيسي"

          >

            <div className="brand-header-nav w-full flex-col gap-1">

              {NAV_ITEMS.map((item) => {

                const active = isActivePath(pathname, item.href);

                return (

                  <Link

                    key={item.href}

                    to={item.href}

                    className={[

                      "brand-header-nav-link w-full justify-start",

                      active ? "brand-header-nav-link--active" : "",

                    ].join(" ")}

                    aria-current={active ? "page" : undefined}

                  >

                    {item.label}

                  </Link>

                );

              })}

            </div>



            <div className="mt-3 flex flex-col gap-2">
              <div className="flex justify-center">
                <ThemeToggle />
              </div>
              {session ? (

                <button

                  type="button"

                  className="brand-header-ghost-btn w-full"

                  onClick={() => void handleLogout()}

                >

                  {HEADER_LOGOUT.label}

                </button>

              ) : (

                <Link to={HEADER_LOGIN.href} className="brand-header-ghost-btn w-full">

                  {HEADER_LOGIN.label}

                </Link>

              )}

              <Link to={HEADER_CTA.href} className="brand-btn brand-btn-pill w-full">

                {HEADER_CTA.label}

              </Link>

            </div>

          </nav>

        </>

      )}

    </header>

  );

}

