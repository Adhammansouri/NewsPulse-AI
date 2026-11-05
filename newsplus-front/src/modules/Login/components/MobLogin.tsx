import { useId, type Ref } from "react";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { DESK_COPY, MOB_COPY } from "../copy";
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

const FORM_ID = "ml-form";

/** Bottom CTA: the board's `m-cta`, plus the safe-area inset (GLOBAL-RULES §6). */
const CTA_STYLE = { borderTop: 0, paddingBottom: "calc(26px + env(safe-area-inset-bottom))" };

const HERO_GLOW = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 85% 0%, rgb(14 165 233 / .35), transparent 55%), radial-gradient(circle at 0% 100%, rgb(13 155 138 / .35), transparent 55%)",
} as const;

/** MobLogin board (< 1024px): top bar, navy hero, fields, bottom CTA. */
export function MobLogin({
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
  const t = MOB_COPY[locale];
  // MobLogin draws no loading / signed-in button: it takes DeskLogin's.
  const desk = DESK_COPY[locale];
  const dir = locale === "en" ? "ltr" : "rtl";
  const { font, displayFont } = loginFonts(locale);
  const alertId = useId();

  return (
    <div
      className="np m"
      data-theme={theme}
      dir={dir}
      lang={locale}
      style={{ background: "var(--surface)", direction: dir, fontFamily: font }}
    >
      <LoginGradient />
      <div className="row" style={{ padding: "14px 16px 0", justifyContent: "space-between" }}>
        <span className="row">
          <img src="/logo-icon.png" alt="" style={{ width: "34px", height: "34px", borderRadius: "10px" }} />
          <b style={{ fontSize: "17px" }}>Newsplus</b>
        </span>
        <span className="row" style={{ gap: "2px" }}>
          <IconButton label={t.dark} icon="moon" aria-pressed={isDark} onClick={onToggleTheme} />
          <Button variant="ghost" size="sm" onClick={onToggleLang}>
            {t.switchLang}
          </Button>
        </span>
      </div>

      {view === "login" ? (
        <>
          <form
            id={FORM_ID}
            className="m-scroll col"
            style={{ padding: "16px 20px", gap: "16px" }}
            onSubmit={form.submit}
            noValidate
          >
            <div
              className="col"
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "24px",
                padding: "20px 20px 14px",
                background: "#0c2340",
                color: "#fff",
                gap: "6px",
              }}
            >
              <div style={HERO_GLOW} />
              <p
                style={{
                  position: "relative",
                  fontFamily: displayFont,
                  fontSize: "21px",
                  lineHeight: 1.45,
                  fontWeight: 700,
                }}
              >
                {t.hero}
              </p>
              <LoginPulse preset="320x34" />
            </div>
            <header className="col" style={{ gap: "2px" }}>
              <h1 className="t-display" style={{ fontFamily: displayFont }}>
                {t.title}
              </h1>
              <p className="t-small">{t.subtitle}</p>
            </header>
            <LoginAlert form={form} t={t} id={alertId} />
            <CredentialFields form={form} t={t} alertId={alertId} mobile />
            <div className="row" style={{ justifyContent: "space-between", fontSize: "14px" }}>
              <RememberCheck form={form} label={t.remember} />
              <a
                ref={forgotTriggerRef as Ref<HTMLAnchorElement>}
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  onForgot();
                }}
                style={{ fontWeight: 600 }}
              >
                {t.forgot}
              </a>
            </div>
          </form>
          <div className="m-cta" style={CTA_STYLE}>
            {form.isLocked && <p className="m-cta__hint num">{t.lockedIn(lockClock(form, locale))}</p>}
            <Button
              ref={form.submitRef}
              type="submit"
              form={FORM_ID}
              variant="ink"
              size="lg"
              block
              disabled={form.isLocked}
              aria-disabled={form.isBusy || undefined}
              aria-busy={form.phase === "loading" || undefined}
            >
              <SubmitContent
                form={form}
                label={form.phase === "loading" ? desk.loading : t.submit}
                okLabel={desk.ok(form.displayName)}
              />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="m-scroll col enter" style={{ padding: "28px 20px", gap: "18px" }}>
            <span className="ic-wrap ic-wrap--teal" style={{ width: "56px", height: "56px", borderRadius: "18px" }}>
              <Icon name="lock" size="lg" />
            </span>
            <header className="col" style={{ gap: "6px" }}>
              <h1 className="t-display" style={{ fontFamily: displayFont }}>
                {t.forgotTitle}
              </h1>
              <p className="t-small">{t.forgotText}</p>
            </header>
            <div className="m-list">
              <div className="m-item">
                <span className="avatar" style={{ border: 0 }}>
                  {t.adminInitial}
                </span>
                <span className="m-item__label">
                  {t.adminName}
                  {adminEmail && <small dir="ltr">{adminEmail}</small>}
                </span>
              </div>
            </div>
          </div>
          <div className="m-cta" style={CTA_STYLE}>
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
        </>
      )}
    </div>
  );
}
