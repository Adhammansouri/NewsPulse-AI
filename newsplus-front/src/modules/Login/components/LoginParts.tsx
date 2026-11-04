import { useState, type CSSProperties } from "react";
import { Check } from "@/ui/Check";
import { Field, FieldInput } from "@/ui/Field";
import { Icon, type IconName } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { Notice, type NoticeVariant } from "@/ui/Notice";
import { PULSE_LINE_PRESETS } from "@/ui/PulseLine";
import { formatCountdown, type DeskCopy, type LoginLocale, type MobCopy } from "../copy";
import type { LoginForm } from "../useLoginForm";

/**
 * The login boards draw every pulse line (navy hero, loading button) with their own gradient
 * (#2dd4bf → #38bdf8) in both themes. AppRoot's `#np-ai-grad` comes first in the document and is the
 * darker light-theme pair, so the login keeps the boards' stops under its own id (as the S02 splash does).
 */
const LOGIN_GRADIENT_ID = "np-login-grad";

export function LoginGradient() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id={LOGIN_GRADIENT_ID} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

type PulsePreset = {
  fluid: boolean;
  w: number;
  h: number;
  d: string;
  base: boolean;
  baseStyle?: CSSProperties;
  svgStyle?: CSSProperties;
};

const DASH_STYLE = { stroke: `url(#${LOGIN_GRADIENT_ID})` };

/** `svg.pulse-line` of the login boards: DeskLogin hero 520×56, MobLogin hero 320×34, loading button 54×20. */
export function LoginPulse({ preset }: { preset: "520x56" | "320x34" | "54x20" }) {
  const p: PulsePreset = PULSE_LINE_PRESETS[preset];
  return (
    <svg
      className="pulse-line"
      width={p.fluid ? "100%" : p.w}
      height={p.h}
      viewBox={`0 0 ${p.w} ${p.h}`}
      preserveAspectRatio={p.fluid ? "none" : undefined}
      aria-hidden="true"
      style={p.svgStyle}
    >
      {p.base && <path className="base" d={p.d} style={p.baseStyle} />}
      <path d={p.d} style={DASH_STYLE} />
    </svg>
  );
}

/** Root font per language: English runs on IBM Plex Sans for UI and headings, as on the boards. */
export function loginFonts(locale: LoginLocale) {
  const en = locale === "en";
  return {
    font: en ? "'IBM Plex Sans', system-ui, sans-serif" : "var(--f-ui)",
    displayFont: en ? "'IBM Plex Sans', system-ui, sans-serif" : "var(--f-display)",
  };
}

type Alert = { variant: NoticeVariant; icon: IconName; color: string; text: string };

function alertFor(form: LoginForm, t: DeskCopy | MobCopy): Alert | null {
  if (form.phase === "error") return { variant: "error", icon: "error-circle", color: "var(--breaking)", text: t.invalid(form.attemptsLeft) };
  if (form.phase === "network") return { variant: "warn", icon: "wifi-off", color: "var(--warn)", text: t.network };
  if (form.phase === "locked") return { variant: "warn", icon: "warning", color: "var(--warn)", text: t.locked };
  return null;
}

/** `div.notice.arrive[role=alert]` for the error / network / locked states. */
export function LoginAlert({ form, t, id }: { form: LoginForm; t: DeskCopy | MobCopy; id: string }) {
  const alert = alertFor(form, t);
  if (!alert) return null;
  return (
    <Notice
      key={form.outcome}
      id={id}
      variant={alert.variant}
      className="arrive"
      role="alert"
      icon={<Icon name={alert.icon} style={{ color: alert.color, marginTop: "2px" }} />}
    >
      {alert.text}
    </Notice>
  );
}

type FieldsProps = {
  form: LoginForm;
  t: DeskCopy | MobCopy;
  /** Id of the alert the fields point at while the credentials are rejected. */
  alertId: string;
  mobile: boolean;
};

const MOB_FIELD_STYLE = { minHeight: "50px" };
const DESK_SHOW_STYLE = { width: "32px", height: "32px", marginInlineEnd: "-8px" };
const MOB_SHOW_STYLE = { marginInlineEnd: "-10px" };

/** Identifier + password columns (label, `.field`, `p.hint`), ids `l-*` on desktop and `ml-*` on mobile. */
export function CredentialFields({ form, t, alertId, mobile }: FieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const prefix = mobile ? "ml" : "l";
  const describedBy = form.phase === "error" ? alertId : undefined;
  const fieldStyle = mobile ? MOB_FIELD_STYLE : undefined;

  return (
    <>
      <div className="col" style={{ gap: "8px" }}>
        <label className="t-label" htmlFor={`${prefix}-id`}>
          {t.idLabel}
        </label>
        <Field
          state={form.idInvalid ? "error" : undefined}
          hint={form.idMissing ? t.idRequired : undefined}
          style={fieldStyle}
        >
          <Icon name="user" />
          <FieldInput
            ref={form.idRef}
            id={`${prefix}-id`}
            autoComplete="username"
            value={form.identifier}
            onChange={(event) => form.setIdentifier(event.target.value)}
            placeholder={t.idPh}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-describedby={describedBy}
          />
        </Field>
      </div>
      <div className="col" style={{ gap: "8px" }}>
        <label className="t-label" htmlFor={`${prefix}-pw`}>
          {t.pwLabel}
        </label>
        <Field
          state={form.pwInvalid ? "error" : undefined}
          hint={form.pwMissing ? t.pwRequired : undefined}
          style={fieldStyle}
        >
          <Icon name="lock" />
          <FieldInput
            ref={form.pwRef}
            id={`${prefix}-pw`}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => form.setPassword(event.target.value)}
            placeholder={t.pwPh}
            aria-describedby={describedBy}
          />
          <IconButton
            label={t.show}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((shown) => !shown)}
            style={mobile ? MOB_SHOW_STYLE : DESK_SHOW_STYLE}
          >
            <Icon name="eye" size="sm" />
          </IconButton>
        </Field>
      </div>
    </>
  );
}

/** `.np :focus-visible` (np4.css), carried to the visual box of the visually hidden checkbox. */
const CHECK_FOCUS_STYLE = { outline: "2px solid var(--cyan-dot)", outlineOffset: "2px" };

/** «تذكّرني» — a native checkbox (`.sr`) behind the board's `span.check`. */
export function RememberCheck({ form, label }: { form: LoginForm; label: string }) {
  const [focusVisible, setFocusVisible] = useState(false);
  return (
    <label className="row" style={{ gap: "8px" }}>
      <input
        type="checkbox"
        className="sr"
        checked={form.remember}
        onChange={(event) => form.setRemember(event.target.checked)}
        onFocus={(event) => setFocusVisible(event.currentTarget.matches(":focus-visible"))}
        onBlur={() => setFocusVisible(false)}
      />
      <Check checked={form.remember} style={focusVisible ? CHECK_FOCUS_STYLE : undefined} />
      {label}
    </label>
  );
}

/** Submit label: pulse while signing in, check + welcome once signed in. */
export function SubmitContent({ form, label, okLabel }: { form: LoginForm; label: string; okLabel: string }) {
  return (
    <>
      {form.phase === "loading" && <LoginPulse preset="54x20" />}
      {form.phase === "ok" && <Icon name="check" style={{ color: "#5eead4" }} />}
      {form.phase === "ok" ? okLabel : label}
    </>
  );
}

/** «m:ss» left on the lock, in the copy's digits. */
export function lockClock(form: LoginForm, locale: LoginLocale) {
  return formatCountdown(form.secondsLeft, locale);
}

