import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeSlash, Translate, WarningCircle, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { BrandMark } from "@/components/shared/BrandMark";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { isApiError } from "@/services/apiError";
import { loginWithCredentials, requestPasswordReset } from "@/services/authService";
import { getSession } from "@/services/sessionStore";
import { LOGIN_COPY, type LoginLocale } from "../copy";
import "../login.css";

const REMEMBER_KEY = "newsplus-login-remember";
const REMEMBER_ID_KEY = "newsplus-login-identifier";
const LANG_KEY = "newsplus-login-lang";

type SubmitState = "idle" | "loading" | "success";
type AuthView = "login" | "forgot";

function readRememberedIdentifier() {
  try {
    return localStorage.getItem(REMEMBER_KEY) === "1" ? localStorage.getItem(REMEMBER_ID_KEY) || "" : "";
  } catch {
    return "";
  }
}

function readStoredLocale(): LoginLocale {
  try {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

function resolveLoginError(error: unknown, copy: (typeof LOGIN_COPY)[LoginLocale]) {
  if (error instanceof TypeError) return copy.networkError;
  if (isApiError(error) && error.status === 401) return copy.invalidCredentials;
  if (isApiError(error) && error.status === 429) return copy.tooManyRequests;
  return copy.loginFailed;
}

/** Wire art: abstract headlines arriving on a live feed. Decorative only. */
function WireArt() {
  return (
    <div className="login-wire" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="login-wire-row" style={{ "--i": row } as React.CSSProperties}>
          <span className="login-wire-dot" />
          <span className="login-wire-lines">
            <i style={{ width: `${88 - row * 9}%` }} />
            <i style={{ width: `${58 - row * 5}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [locale, setLocale] = useState<LoginLocale>(readStoredLocale);
  const copy = LOGIN_COPY[locale];
  const isRTL = locale === "ar";

  const [identifier, setIdentifier] = useState(readRememberedIdentifier);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [view, setView] = useState<AuthView>("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const [shakeKey, setShakeKey] = useState(0);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
  const destination = from && !from.startsWith("/login") ? from : "/";

  useEffect(() => {
    const previous = document.title;
    document.title = `${copy.title} — Newsplus`;
    return () => {
      document.title = previous;
    };
  }, [copy.title]);

  useEffect(() => {
    const html = document.documentElement;
    const prevLang = html.lang;
    const prevDir = html.getAttribute("dir");
    html.lang = locale;
    html.dir = isRTL ? "rtl" : "ltr";
    return () => {
      html.lang = prevLang;
      if (prevDir) html.setAttribute("dir", prevDir);
      else html.removeAttribute("dir");
    };
  }, [locale, isRTL]);

  useEffect(() => {
    setError("");
    setMessage("");
  }, [locale]);

  function fail(text: string, fields: string[]) {
    setError(text);
    setInvalid(Object.fromEntries(fields.map((id) => [id, true])));
    setShakeKey((n) => n + 1);
  }

  function toggleLocale() {
    const next: LoginLocale = isRTL ? "en" : "ar";
    setLocale(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* private mode */
    }
  }

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    if (submitState !== "idle") return;
    setError("");
    setMessage("");
    setInvalid({});

    const id = identifier.trim();
    const secret = password.trim();
    if (!id) return fail(copy.identifierRequired, ["identifier"]);
    if (!secret) return fail(copy.passwordRequired, ["password"]);

    setSubmitState("loading");
    try {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, "1");
        localStorage.setItem(REMEMBER_ID_KEY, id);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(REMEMBER_ID_KEY);
      }
    } catch {
      /* private mode */
    }

    try {
      await loginWithCredentials(id, secret, remember);
      setSubmitState("success");
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      navigate(destination, { replace: true });
    } catch (cause) {
      setSubmitState("idle");
      fail(resolveLoginError(cause, copy), ["identifier", "password"]);
    }
  }

  async function onForgot(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setInvalid({});
    const email = forgotEmail.trim();
    if (!email || !email.includes("@")) return fail(copy.emailInvalid, ["email"]);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setMessage(copy.resetSent);
    } catch (cause) {
      fail(cause instanceof TypeError ? copy.networkError : copy.emailInvalid, ["email"]);
    } finally {
      setLoading(false);
    }
  }

  if (getSession()) return <Navigate to={destination} replace />;

  const isForgot = view === "forgot";
  const submitLabel = { idle: copy.submitIdle, loading: copy.submitLoading, success: copy.submitSuccess }[submitState];

  return (
    <div className="login" dir={isRTL ? "rtl" : "ltr"}>
      <div className="login-chrome" role="toolbar" aria-label={copy.chromeLabel}>
        <ThemeToggle />
        <button type="button" className="icon-btn" onClick={toggleLocale} aria-label={isRTL ? copy.switchToEnglish : copy.switchToArabic} title={isRTL ? copy.switchToEnglish : copy.switchToArabic}>
          <Translate size={20} weight="bold" aria-hidden="true" />
        </button>
      </div>

      <main className="login-panel">
        <div key={`${locale}-${view}`} className="login-card">
          <BrandMark size={44} className="login-brand" />

          <header className="login-head">
            <h1>{isForgot ? copy.forgotTitle : copy.title}</h1>
            <p>{isForgot ? copy.forgotSubtitle : copy.subtitle}</p>
            {import.meta.env.DEV && !isForgot ? <p className="login-dev">{copy.devHint}</p> : null}
          </header>

          {error ? (
            <div key={shakeKey} className="notice is-error login-alert" role="alert">
              <WarningCircle size={20} weight="fill" aria-hidden="true" />
              <div>{error}</div>
            </div>
          ) : null}
          {message ? (
            <div className="notice is-ok" role="status">
              <CheckCircle size={20} weight="fill" aria-hidden="true" />
              <div>{message}</div>
            </div>
          ) : null}

          {!isForgot ? (
            <form className="login-form" onSubmit={onLogin} noValidate>
              <div className="field">
                <label className="field-label" htmlFor="login-identifier">{copy.identifierLabel}</label>
                <input
                  id="login-identifier"
                  className="input"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder={copy.identifierPlaceholder}
                  autoComplete="username"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  autoFocus
                  dir="auto"
                  aria-invalid={invalid.identifier || undefined}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="login-password">{copy.passwordLabel}</label>
                <div className="input-wrap">
                  <input
                    id="login-password"
                    className="input login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={copy.passwordPlaceholder}
                    autoComplete="current-password"
                    dir="auto"
                    aria-invalid={invalid.password || undefined}
                  />
                  <button type="button" className="icon-btn is-sm input-end" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? copy.hidePassword : copy.showPassword} aria-pressed={showPassword}>
                    {showPassword ? <EyeSlash size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="login-row">
                <label className="check">
                  <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                  {copy.rememberMe}
                </label>
                <button
                  type="button"
                  className="login-link"
                  onClick={() => {
                    setView("forgot");
                    setError("");
                    setMessage("");
                    setInvalid({});
                    setForgotEmail(identifier.includes("@") ? identifier.trim() : "");
                  }}
                >
                  {copy.forgotPassword}
                </button>
              </div>

              <button type="submit" className={`btn btn-primary btn-lg btn-block login-submit is-${submitState}`} disabled={submitState !== "idle"}>
                {submitState === "loading" ? <span className="spinner" aria-hidden="true" /> : null}
                {submitState === "success" ? (
                  <svg className="check-draw" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                ) : null}
                {submitLabel}
              </button>
            </form>
          ) : (
            <>
              <form className="login-form" onSubmit={onForgot} noValidate>
                <div className="field">
                  <label className="field-label" htmlFor="forgot-email">{copy.emailLabel}</label>
                  <input id="forgot-email" className="input" type="email" dir="ltr" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} placeholder={copy.emailPlaceholder} autoComplete="email" autoFocus aria-invalid={invalid.email || undefined} />
                </div>
                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                  {loading ? <span className="spinner" aria-hidden="true" /> : null}
                  {loading ? copy.sending : copy.sendResetLink}
                </button>
              </form>
              <p className="login-switch">
                {copy.rememberPassword}{" "}
                <button
                  type="button"
                  className="login-link"
                  onClick={() => {
                    setView("login");
                    setError("");
                    setMessage("");
                    setInvalid({});
                  }}
                >
                  <ArrowRight size={14} weight="bold" className="login-back-icon" aria-hidden="true" />
                  {copy.backToLogin}
                </button>
              </p>
            </>
          )}
        </div>
      </main>

      <aside className="login-art" aria-label={copy.brand}>
        <div className="login-art-inner">
          <h2>{copy.artTitle}</h2>
          <p>{copy.artLine}</p>
          <WireArt />
        </div>
      </aside>
    </div>
  );
}
