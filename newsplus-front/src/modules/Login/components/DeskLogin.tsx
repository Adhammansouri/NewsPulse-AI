import { useId, type Ref } from "react";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { DESK_COPY, WIRE_ROWS } from "../copy";
import type { LoginLayoutProps } from "./layout";
import {
  CredentialFields,
  LoginAlert,
  LoginGradient,
  LoginPulse,
  RememberCheck,
  SubmitContent,
  lockClock,
  loginFonts,
} from "./LoginParts";

const ASIDE_STYLE = {
  flex: "1 1 520px",
  position: "relative",
  overflow: "hidden",
  background: "#0c2340",
  color: "#e8eef5",
  padding: "56px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
} as const;

const ASIDE_GLOW = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 80% 10%, rgb(14 165 233 / .22), transparent 45%), radial-gradient(circle at 10% 90%, rgb(13 155 138 / .25), transparent 50%)",
} as const;

const WIRE_DOT = {
  position: "absolute",
  insetInlineStart: "14px",
  top: "20px",
  width: "11px",
  height: "11px",
  borderRadius: "50%",
} as const;

/** DeskLogin board (≥ 1024px): form side + navy brand side. */
export function DeskLogin({
  locale,
  theme,
  isDark,
  onToggleTheme,
  onToggleLang,
  form,
  view,
  onForgot,
  onBack,
  adminEmail,
  forgotTriggerRef,
  forgotFocusRef,
}: LoginLayoutProps) {
  const t = DESK_COPY[locale];
  const dir = locale === "en" ? "ltr" : "rtl";
  const { font, displayFont } = loginFonts(locale);
  const alertId = useId();
  const clock = lockClock(form, locale);

  const label =
    form.phase === "loading" ? t.loading : form.isLocked ? t.wait(clock) : t.idle;

  return (
    <div
      className="np"
      data-theme={theme}
      dir={dir}
      lang={locale}
      style={{
        display: "flex",
        flexWrap: "wrap",
        width: "100%",
        minHeight: "100dvh",
        background: "var(--surface)",
        direction: dir,
        fontFamily: font,
      }}
    >
      <LoginGradient />
      <main className="col" style={{ flex: "1 1 520px", padding: "30px 48px" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="row">
            <img src="/logo-icon.png" alt="" style={{ width: "40px", height: "40px", borderRadius: "11px" }} />
            <span className="t-title">Newsplus</span>
          </span>
          <div className="row" style={{ gap: "4px" }}>
            <IconButton label={t.dark} icon="moon" aria-pressed={isDark} onClick={onToggleTheme} />
            <Button variant="ghost" size="sm" lang={t.otherLang} onClick={onToggleLang}>
              {t.switchLang}
            </Button>
          </div>
        </div>

        <div className="grow" style={{ display: "grid", placeItems: "center" }}>
          {view === "login" ? (
            <form
              className="col enter"
              style={{ width: "100%", maxWidth: "380px", gap: "18px" }}
              onSubmit={form.submit}
              noValidate
            >
              <header className="col" style={{ gap: "6px", marginBottom: "6px" }}>
                <h1 className="t-hero" style={{ fontSize: "32px", fontFamily: displayFont }}>
                  {t.title}
                </h1>
                <p className="t-small">{t.subtitle}</p>
              </header>
              <LoginAlert form={form} t={t} id={alertId} />
              <CredentialFields form={form} t={t} alertId={alertId} mobile={false} />
              <div className="row" style={{ justifyContent: "space-between", fontSize: "14px" }}>
                <RememberCheck form={form} label={t.remember} />
                <Button
                  ref={forgotTriggerRef as Ref<HTMLButtonElement>}
                  variant="ghost"
                  size="sm"
                  onClick={onForgot}
                  style={{ color: "var(--teal)", padding: "0 6px" }}
                >
                  {t.forgot}
                </Button>
              </div>
              <Button
                ref={form.submitRef}
                type="submit"
                variant="ink"
                size="lg"
                block
                disabled={form.isLocked}
                aria-disabled={form.isBusy || undefined}
                aria-busy={form.phase === "loading" || undefined}
              >
                <SubmitContent form={form} label={label} okLabel={t.ok(form.displayName)} />
              </Button>
              {form.isLocked && (
                <p className="t-meta num" style={{ textAlign: "center" }}>
                  {t.lockedIn(clock)}
                </p>
              )}
            </form>
          ) : (
            <div className="col enter" style={{ width: "100%", maxWidth: "380px", gap: "18px" }}>
              <span className="ic-wrap ic-wrap--teal" style={{ width: "52px", height: "52px", borderRadius: "16px" }}>
                <Icon name="lock" size="lg" />
              </span>
              <header className="col" style={{ gap: "6px" }}>
                <h1 className="t-hero" style={{ fontSize: "30px", fontFamily: displayFont }}>
                  {t.forgotTitle}
                </h1>
                <p className="t-small">{t.forgotText}</p>
              </header>
              <div
                className="panel panel--flat row"
                style={{ gap: "12px", padding: "14px 16px", background: "var(--surface-2)" }}
              >
                <span className="avatar" style={{ border: 0 }}>
                  {t.adminInitial}
                </span>
                <span className="col grow">
                  <span style={{ fontWeight: 600 }}>{t.adminName}</span>
                  {adminEmail && (
                    <span className="t-meta" dir="ltr">
                      {adminEmail}
                    </span>
                  )}
                </span>
              </div>
              {adminEmail && (
                <a
                  ref={forgotFocusRef as Ref<HTMLAnchorElement>}
                  className="btn btn--ink btn--block btn--lg"
                  href={`mailto:${adminEmail}`}
                >
                  {t.contact}
                </a>
              )}
              <Button
                ref={adminEmail ? undefined : (forgotFocusRef as Ref<HTMLButtonElement>)}
                variant="ghost"
                block
                onClick={onBack}
              >
                {t.back}
              </Button>
            </div>
          )}
        </div>

        <p className="t-meta" style={{ textAlign: "center" }}>
          {t.footer}
        </p>
      </main>

      <aside aria-hidden="true" style={ASIDE_STYLE}>
        <div style={ASIDE_GLOW} />
        <div className="col" style={{ position: "relative", gap: "14px", maxWidth: "480px" }}>
          <p style={{ fontFamily: displayFont, fontSize: "40px", lineHeight: 1.35, fontWeight: 700 }}>{t.hero}</p>
          <p style={{ fontSize: "16.5px", lineHeight: 1.85, color: "#a9b8c9" }}>{t.heroText}</p>
        </div>
        <div className="col" style={{ position: "relative", gap: "14px" }}>
          <LoginPulse preset="520x56" />
          <div
            className="col"
            style={{
              borderRadius: "20px",
              background: "rgb(255 255 255 / .04)",
              border: "1px solid rgb(255 255 255 / .09)",
              overflow: "hidden",
            }}
          >
            {WIRE_ROWS[locale].map((w) => (
              <div
                key={w.t}
                style={{
                  position: "relative",
                  padding: "14px 20px",
                  paddingInlineStart: "38px",
                  borderBottom: "1px solid rgb(255 255 255 / .07)",
                  opacity: w.op,
                }}
              >
                <span style={{ ...WIRE_DOT, background: w.dot }} />
                <p style={{ fontSize: "12.5px", color: "#8296ab" }}>{w.meta}</p>
                <p style={{ fontSize: "15px", fontWeight: 600, lineHeight: 1.6 }}>{w.t}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
