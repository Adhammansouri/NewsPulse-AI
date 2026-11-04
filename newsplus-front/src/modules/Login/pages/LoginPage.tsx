import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, type To } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTheme } from "@/hooks/useTheme";
import { getSession } from "@/services/sessionStore";
import { DeskLogin } from "../components/DeskLogin";
import type { LoginLayoutProps, LoginView } from "../components/layout";
import { MobLogin } from "../components/MobLogin";
import { DESK_COPY, type LoginLocale } from "../copy";
import { useLoginForm } from "../useLoginForm";

const LANG_KEY = "newsplus-login-lang";
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? "").trim();

function readStoredLocale(): LoginLocale {
  try {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

function persistLocale(locale: LoginLocale) {
  try {
    localStorage.setItem(LANG_KEY, locale);
  } catch {
    /* private mode */
  }
}

type FromState = { from?: { pathname?: string; search?: string; hash?: string } } | null;

/** Where RequireAuth sent the user from (`state.from`), or `/`. */
function redirectTarget(state: unknown): To {
  const from = (state as FromState)?.from;
  if (!from?.pathname || from.pathname === "/login") return "/";
  return { pathname: from.pathname, search: from.search ?? "", hash: from.hash ?? "" };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const target = redirectTarget(location.state);
  const isMobile = useIsMobile();
  const { theme, isDark, toggleTheme } = useTheme();
  const [locale, setLocale] = useState<LoginLocale>(readStoredLocale);
  const [view, setView] = useState<LoginView>("login");
  // Checked once: after signing in, the page stays up for the welcome label before it navigates.
  const [signedInOnArrival] = useState(() => Boolean(getSession()));
  const forgotTriggerRef = useRef<HTMLElement>(null);
  const forgotFocusRef = useRef<HTMLElement>(null);
  const viewChanged = useRef(false);

  const onSignedIn = useCallback(() => navigate(target, { replace: true }), [navigate, target]);
  const form = useLoginForm(onSignedIn);
  const title = DESK_COPY[locale].title;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} — Newsplus`;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);

  useEffect(() => {
    const html = document.documentElement;
    const previousLang = html.lang;
    const previousDir = html.getAttribute("dir");
    html.lang = locale;
    html.dir = locale === "en" ? "ltr" : "rtl";
    return () => {
      html.lang = previousLang;
      if (previousDir) html.setAttribute("dir", previousDir);
      else html.removeAttribute("dir");
    };
  }, [locale]);

  // Forgot view ⇄ form: focus the forgot view's first action, and back on «نسيت كلمة المرور؟».
  useEffect(() => {
    if (!viewChanged.current) return;
    (view === "forgot" ? forgotFocusRef : forgotTriggerRef).current?.focus();
  }, [view]);

  if (signedInOnArrival) return <Navigate to={target} replace />;

  const props: LoginLayoutProps = {
    locale,
    theme,
    isDark,
    onToggleTheme: toggleTheme,
    onToggleLang: () => {
      const next: LoginLocale = locale === "ar" ? "en" : "ar";
      setLocale(next);
      persistLocale(next);
    },
    form,
    view,
    onForgot: () => {
      viewChanged.current = true;
      setView("forgot");
    },
    onBack: () => {
      viewChanged.current = true;
      setView("login");
    },
    adminEmail: ADMIN_EMAIL,
    forgotTriggerRef,
    forgotFocusRef,
  };

  return isMobile ? <MobLogin {...props} /> : <DeskLogin {...props} />;
}
