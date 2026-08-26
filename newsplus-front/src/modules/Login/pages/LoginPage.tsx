import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import { loginWithCredentials, requestPasswordReset } from "@/services/authService";
import { isApiError } from "@/services/apiError";
import { getSession } from "@/services/sessionStore";
import { LOGIN_COPY, type LoginLocale } from "../copy";
import "../login.css";

const REMEMBER_KEY = "newsplus-login-remember";
const REMEMBER_ID_KEY = "newsplus-login-identifier";
const LANG_KEY = "newsplus-login-lang";

type SubmitState = "idle" | "loading" | "success";
type AuthView = "login" | "forgot";
type ShakeMap = Record<string, boolean>;

function readRememberedIdentifier() {
  try {
    if (localStorage.getItem(REMEMBER_KEY) !== "1") return "";
    return localStorage.getItem(REMEMBER_ID_KEY) || "";
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

function persistLocale(locale: LoginLocale) {
  try {
    localStorage.setItem(LANG_KEY, locale);
  } catch {
    /* private mode */
  }
}

function runLanguageTransition(update: () => void) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const formWrap = document.querySelector(".np-login__form-wrap");

  if (prefersReduced || !formWrap) {
    update();
    return;
  }

  let phase: "out" | "in" = "out";
  const onAnimEnd = (event: Event) => {
    const anim = event as AnimationEvent;
    if (anim.target !== formWrap) return;
    if (anim.animationName !== "np-login-lang-out" && anim.animationName !== "np-login-lang-in") {
      return;
    }

    if (phase === "out") {
      phase = "in";
      update();
      formWrap.classList.remove("is-lang-out");
      formWrap.classList.add("is-lang-in");
      return;
    }

    formWrap.classList.remove("is-lang-in");
    formWrap.removeEventListener("animationend", onAnimEnd);
  };

  formWrap.addEventListener("animationend", onAnimEnd);
  formWrap.classList.remove("is-lang-in");
  formWrap.classList.add("is-lang-out");
}

function IconEye({ off = false }: { off?: boolean }) {
  return (
    <svg className="np-login__toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {off ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c5 0 9.3 3.1 11 7-0.6 1.4-1.5 2.7-2.6 3.7" />
          <path d="M6.1 6.1C4.2 7.4 2.7 9.2 1.9 12c1.7 3.9 6 7 10.1 7 1.4 0 2.8-.3 4-.8" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="np-login__submit-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg className="np-login__alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LangToggleIcon({ target }: { target: LoginLocale }) {
  return (
    <span className="np-login__lang-swap" aria-hidden="true">
      <span className={`np-login__lang-face np-login__lang-face--en${target === "en" ? " is-active" : ""}`}>
        EN
      </span>
      <span className={`np-login__lang-face np-login__lang-face--ar${target === "ar" ? " is-active" : ""}`}>
        ع
      </span>
    </span>
  );
}

function LoginLockup({ variant }: { variant: "brand" | "mobile" }) {
  const isBrand = variant === "brand";

  return (
    <span className={`np-login__lockup np-login__lockup--${variant}`}>
      <span className="np-login__lockup-glow" aria-hidden="true" />
      <img
        className="np-login__lockup-img"
        src="/logo-icon.png"
        alt="Newsplus"
        width={isBrand ? 192 : 88}
        height={isBrand ? 192 : 88}
        decoding="async"
      />
    </span>
  );
}

function StackedField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoFocus = false,
  autoComplete,
  dir = "auto",
  hasError = false,
  shaking = false,
  toggle,
  inputClassName = "",
  placeholder = "",
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  autoComplete?: string;
  dir?: "auto" | "ltr" | "rtl";
  hasError?: boolean;
  shaking?: boolean;
  toggle?: ReactNode;
  inputClassName?: string;
  placeholder?: string;
}) {
  return (
    <div className="np-login__field">
      <label className="np-login__label" htmlFor={id}>
        {label}
      </label>
      <div className="np-login__control">
        <input
          id={id}
          type={type}
          className={[
            "np-login__input",
            hasError ? "np-login__input--error" : "",
            shaking ? "np-login__input--shake" : "",
            inputClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          dir={dir}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          aria-invalid={hasError || undefined}
        />
        {toggle}
      </div>
    </div>
  );
}

function resolveLoginError(error: unknown, copy: (typeof LOGIN_COPY)[LoginLocale]) {
  if (error instanceof TypeError) return copy.networkError;
  if (isApiError(error) && error.status === 401) return copy.invalidCredentials;
  if (isApiError(error) && error.status === 429) return copy.tooManyRequests;
  return copy.loginFailed;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [locale, setLocale] = useState<LoginLocale>(readStoredLocale);
  const { isDark } = useTheme();
  const copy = LOGIN_COPY[locale];
  const isRTL = locale === "ar";
  const fieldDir = isRTL ? "rtl" : "ltr";

  const [usernameOrPhone, setUsernameOrPhone] = useState(readRememberedIdentifier);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [authView, setAuthView] = useState<AuthView>("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [alertShake, setAlertShake] = useState(false);
  const [shakeFields, setShakeFields] = useState<ShakeMap>({});

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${copy.title} — Newsplus`;
    return () => {
      document.title = previousTitle;
    };
  }, [copy.title]);

  useEffect(() => {
    const html = document.documentElement;
    const previousLang = html.lang;
    const previousDir = html.getAttribute("dir");
    html.lang = locale;
    html.dir = isRTL ? "rtl" : "ltr";
    return () => {
      html.lang = previousLang;
      if (previousDir) html.setAttribute("dir", previousDir);
      else html.removeAttribute("dir");
    };
  }, [locale, isRTL]);

  useEffect(() => {
    if (!error) return undefined;
    setAlertShake(false);
    const kick = requestAnimationFrame(() => setAlertShake(true));
    const timer = window.setTimeout(() => setAlertShake(false), 600);
    return () => {
      cancelAnimationFrame(kick);
      window.clearTimeout(timer);
    };
  }, [error]);

  useEffect(() => {
    setError("");
    setMessage("");
  }, [locale]);

  function triggerFieldShake(fieldIds: string[]) {
    const next: ShakeMap = {};
    fieldIds.forEach((id) => {
      next[id] = false;
    });
    setShakeFields(next);
    requestAnimationFrame(() => {
      const active: ShakeMap = {};
      fieldIds.forEach((id) => {
        active[id] = true;
      });
      setShakeFields(active);
    });
    window.setTimeout(() => setShakeFields({}), 600);
  }

  function persistRememberPreference(identifier: string) {
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, "1");
        localStorage.setItem(REMEMBER_ID_KEY, identifier);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(REMEMBER_ID_KEY);
      }
    } catch {
      /* private mode */
    }
  }

  function handleLanguageToggle() {
    const nextLang: LoginLocale = isRTL ? "en" : "ar";
    const btn = document.querySelector(".np-login__lang-toggle");
    const clearFlip = () => btn?.classList.remove("is-flipping");
    btn?.classList.add("is-flipping");
    btn?.addEventListener("animationend", clearFlip, { once: true });

    runLanguageTransition(() => {
      setLocale(nextLang);
      persistLocale(nextLang);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitState === "loading" || submitState === "success") return;

    setError("");
    setMessage("");
    setSubmitState("idle");

    if (!usernameOrPhone.trim()) {
      triggerFieldShake(["identifier"]);
      setError(copy.identifierRequired);
      return;
    }

    const identifier = usernameOrPhone.trim();
    const normalizedPassword = password.trim();

    if (!normalizedPassword) {
      triggerFieldShake(["password"]);
      setError(copy.passwordRequired);
      return;
    }

    setLoading(true);
    setSubmitState("loading");
    persistRememberPreference(identifier);

    try {
      await loginWithCredentials(identifier, normalizedPassword, rememberMe);
      setSubmitState("success");
      await new Promise((resolve) => window.setTimeout(resolve, 750));
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(from && from !== "/login" ? from : "/", { replace: true });
    } catch (error) {
      triggerFieldShake(["identifier", "password"]);
      setError(resolveLoginError(error, copy));
      setLoading(false);
      setSubmitState("idle");
    }
  }

  async function handleForgotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const email = forgotEmail.trim();
    if (!email || !email.includes("@")) {
      triggerFieldShake(["forgotEmail"]);
      setError(copy.emailInvalid);
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email);
      setMessage(copy.resetSent);
    } catch (error) {
      triggerFieldShake(["forgotEmail"]);
      setError(error instanceof TypeError ? copy.networkError : copy.emailInvalid);
    } finally {
      setLoading(false);
    }
  }

  const isForgot = authView === "forgot";
  const title = isForgot ? copy.forgotTitle : copy.title;
  const subtitle = isForgot ? copy.forgotSubtitle : copy.subtitle;
  const submitLabels = {
    idle: copy.submitIdle,
    loading: copy.submitLoading,
    success: copy.submitSuccess,
  };
  const languageToggleLabel = isRTL ? copy.switchToEnglish : copy.switchToArabic;
  const languageTarget: LoginLocale = isRTL ? "en" : "ar";

  if (getSession()) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
    return <Navigate to={from && from !== "/login" ? from : "/"} replace />;
  }

  return (
    <div className={`np-login${isDark ? " is-dark" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className="np-login__bg-fade" aria-hidden="true">
        <div className="np-login__bg-fade-layer np-login__bg-fade-layer--light" />
        <div className="np-login__bg-fade-layer np-login__bg-fade-layer--dark" />
      </div>
      <div className="np-login__mobile-ambient" aria-hidden="true" />

      <div
        className={`np-login__chrome${isRTL ? " is-rtl" : " is-ltr"}`}
        role="toolbar"
        aria-label={copy.chromeLabel}
      >
        <ThemeToggle variant="login" />
        <span className="np-login__chrome-divider" aria-hidden="true" />
        <button
          type="button"
          className="np-login__chrome-btn np-login__lang-toggle"
          onClick={handleLanguageToggle}
          aria-label={languageToggleLabel}
          title={languageToggleLabel}
        >
          <LangToggleIcon target={languageTarget} />
        </button>
      </div>

      <div className="np-login__shell">
        <aside className="np-login__brand" aria-label={copy.brand}>
          <div className="np-login__brand-inner">
            <LoginLockup variant="brand" />
          </div>
        </aside>

        <main className="np-login__panel" dir={isRTL ? "rtl" : "ltr"}>
          <div className="np-login__mobile-stack">
            <div className="np-login__mobile-brand">
              <LoginLockup variant="mobile" />
            </div>

            <div className="np-login__form-wrap">
              <header className="np-login__header">
                <h1 className="np-login__title">{title}</h1>
                <p className="np-login__subtitle">{subtitle}</p>
                {import.meta.env.DEV && !isForgot ? (
                  <p className="np-login__dev-hint">{copy.devHint}</p>
                ) : null}
              </header>

              {error ? (
                <div className={`np-login__alert${alertShake ? " np-login__alert--shake" : ""}`} role="alert">
                  <IconAlert />
                  <span>{error}</span>
                </div>
              ) : null}

              {message ? (
                <div className="np-login__alert np-login__alert--ok" role="status">
                  <IconAlert />
                  <span>{message}</span>
                </div>
              ) : null}

              {!isForgot ? (
                <form className="np-login__form" onSubmit={handleSubmit} noValidate>
                  <StackedField
                    id="np-login-identifier"
                    label={copy.identifierLabel}
                    value={usernameOrPhone}
                    onChange={(event) => setUsernameOrPhone(event.target.value)}
                    autoFocus
                    autoComplete="username"
                    dir={fieldDir}
                    placeholder={copy.identifierPlaceholder}
                    hasError={Boolean(error) && !usernameOrPhone.trim()}
                    shaking={Boolean(shakeFields.identifier)}
                  />

                  <StackedField
                    id="np-login-password"
                    label={copy.passwordLabel}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    dir={fieldDir}
                    inputClassName="np-login__input--password"
                    placeholder={copy.passwordPlaceholder}
                    hasError={Boolean(error) && !password.trim()}
                    shaking={Boolean(shakeFields.password)}
                    toggle={(
                      <button
                        type="button"
                        className="np-login__toggle"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                      >
                        <IconEye off={showPassword} />
                      </button>
                    )}
                  />

                  <div className="np-login__row">
                    <label className="np-login__remember">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                      />
                      {copy.rememberMe}
                    </label>
                    <button
                      type="button"
                      className="np-login__forgot"
                      onClick={() => {
                        setAuthView("forgot");
                        setError("");
                        setMessage("");
                        setSubmitState("idle");
                        setForgotEmail(usernameOrPhone.includes("@") ? usernameOrPhone.trim() : "");
                      }}
                      disabled={loading}
                    >
                      {copy.forgotPassword}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="np-login__submit"
                    data-state={submitState}
                    disabled={submitState === "loading" || submitState === "success"}
                  >
                    <span className="np-login__submit-icon" aria-hidden="true">
                      {submitState === "success" ? <IconCheck /> : null}
                      {submitState === "loading" ? <span className="np-login__submit-spinner" /> : null}
                    </span>
                    <span>{submitLabels[submitState]}</span>
                  </button>
                </form>
              ) : (
                <>
                  <form className="np-login__form" onSubmit={handleForgotSubmit} noValidate>
                    <StackedField
                      id="np-forgot-email"
                      label={copy.emailLabel}
                      type="email"
                      value={forgotEmail}
                      onChange={(event) => setForgotEmail(event.target.value)}
                      autoFocus
                      autoComplete="email"
                      dir="ltr"
                      placeholder={copy.emailPlaceholder}
                      hasError={Boolean(error) && (!forgotEmail.trim() || !forgotEmail.includes("@"))}
                      shaking={Boolean(shakeFields.forgotEmail)}
                    />
                    <button type="submit" className="np-login__submit" disabled={loading}>
                      {loading ? copy.sending : copy.sendResetLink}
                    </button>
                  </form>
                  <p className="np-login__auth-switch">
                    {copy.rememberPassword}{" "}
                    <button
                      type="button"
                      className="np-login__auth-switch-link"
                      onClick={() => {
                        setAuthView("login");
                        setError("");
                        setMessage("");
                      }}
                      disabled={loading}
                    >
                      {copy.backToLogin}
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
