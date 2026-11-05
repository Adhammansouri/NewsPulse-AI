// S10 §1: the designed surface for every tool error, and the AI rate-limit card. Markup, classes, inline styles
// and copy are States.dc.html (`errors[]`) and MobSystem.dc.html (quota, ratelimit); toolErrors.ts maps the error.
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAiCooldown } from "@/hooks/useAiCooldown";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSession } from "@/hooks/useSession";
import { OPENAI_BILLING_URL, SYSTEM_COPY, toolErrorKind, toolErrorMessage, isCooldownError } from "@/services/toolErrors";
import { countPhrase, toArabicDigits, type CountForms } from "@/utils/arabic";
import { Button } from "./Button";
import { cx } from "./cx";
import { Icon, type IconName } from "./Icon";
import { Notice } from "./Notice";
import { Sheet } from "./Sheet";

/** States `errors[]`: the icon tile sits on the surface colour inside the tinted notice. */
const IC_WRAP_STYLE = { background: "var(--surface)" } as const;
/** States conflict glyph: the history arrow without the clock hands. */
const RESTORE_PATH = "M3 12a9 9 0 1 0 3-6.7M3 4v5h5";

const MINUTE_FORMS: CountForms = { one: "دقيقة", two: "دقيقتين", few: "{n} دقائق", many: "{n} دقيقة" };
const REQUEST_FORMS: CountForms = { one: "طلب واحد", two: "طلبين", few: "{n} طلبات", many: "{n} طلب" };

/**
 * AI requests per window, mirrored from `MAX_ATTEMPTS` in newsplus-API/src/middleware/aiRateLimit.ts (24 per
 * 15 minutes, «ربع ساعة»). The API doesn't send the limit itself, only `Retry-After` / `X-RateLimit-Remaining`.
 */
export const AI_RATE_LIMIT_MAX = 24;

/** «المسودة اتعدّلت من مكان تاني»: the newest version on the server and the action that shows it. */
export type ConflictInfo = { version: number; onShow: () => void };

export type ErrorSurfaceProps = {
  error: unknown;
  /** «أعد المحاولة» (AI failure): sends the kept choice / instruction again. Disabled during the AI cooldown. */
  onRetry?: () => void;
  /** 409 on a draft: «اعرض ن{n}». Without it a conflict shows the API message. */
  conflict?: ConflictInfo | null;
  className?: string;
  style?: CSSProperties;
};

function StatesNotice({
  variant,
  icon,
  iconClass,
  title,
  text,
  action,
  className,
  style,
}: {
  variant: "error" | "warn" | "info";
  icon: IconName | { path: string };
  iconClass?: string;
  title?: string;
  text: ReactNode;
  action?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Notice
      variant={variant}
      role="alert"
      className={className}
      style={{ alignItems: "center", ...style }}
      icon={
        <span className={cx("ic-wrap", iconClass)} style={IC_WRAP_STYLE}>
          {typeof icon === "string" ? (
            <Icon name={icon} />
          ) : (
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <path d={icon.path} />
            </svg>
          )}
        </span>
      }
      textClassName="col grow"
      action={action}
    >
      {title && <b style={{ fontWeight: 600 }}>{title}</b>}
      <span className="t-small">{text}</span>
    </Notice>
  );
}

/** «المحرّر ما قدرش يكمّل» + «أعد المحاولة» (States errors[1]); the choice / instruction stays on screen. */
export function AiFailedNotice({
  onRetry,
  title = SYSTEM_COPY.failedTitle,
  text = SYSTEM_COPY.failedText,
  className,
  style,
}: {
  onRetry?: () => void;
  title?: string;
  text?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const cooldown = useAiCooldown();
  return (
    <StatesNotice
      variant="error"
      icon="warning"
      iconClass="ic-wrap--breaking"
      title={title}
      text={text}
      className={className}
      style={style}
      action={
        onRetry && (
          <Button variant="quiet" size="sm" disabled={cooldown.active} onClick={onRetry}>
            {SYSTEM_COPY.retry}
          </Button>
        )
      }
    />
  );
}

/**
 * OpenAI quota. Desktop: `notice--warn` «رصيد OpenAI خلص» (States errors[2]). Mobile: the MobSystem-quota sheet,
 * open until «تمام» / Esc / the scrim. «اشحن الرصيد» (billing) only for admins; editors read «بلّغ مسؤول النظام».
 */
export function QuotaSurface({ className, style }: { className?: string; style?: CSSProperties }) {
  const isMobile = useIsMobile();
  const session = useSession();
  const isAdmin = session?.user.role === "admin";
  const titleId = useId();
  const [open, setOpen] = useState(true);

  if (!isMobile) {
    return (
      <StatesNotice
        variant="warn"
        icon="card"
        iconClass="ic-wrap--warn"
        title={SYSTEM_COPY.quotaTitle}
        text={SYSTEM_COPY.quotaText}
        className={className}
        style={style}
        action={
          isAdmin ? (
            <a className="btn btn--quiet btn--sm" href={OPENAI_BILLING_URL} target="_blank" rel="noreferrer">
              {SYSTEM_COPY.quotaCta}
            </a>
          ) : (
            <span className="t-meta">{SYSTEM_COPY.quotaReport}</span>
          )
        }
      />
    );
  }

  const root = open ? document.querySelector<HTMLElement>("div.np") : null;
  if (!root) return null;
  return createPortal(
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      role="alertdialog"
      aria-labelledby={titleId}
      className="col"
      style={{ padding: "0 20px 28px", gap: "12px", alignItems: "center", textAlign: "center" }}
    >
      <span className="empty__art" style={{ background: "var(--warn-soft)", color: "var(--warn)", margin: "8px 0 0" }}>
        <Icon name="card" size="xl" />
      </span>
      <h2 id={titleId} className="t-title">
        {SYSTEM_COPY.quotaTitle}
      </h2>
      <p className="t-small" style={{ maxWidth: "300px" }}>
        {SYSTEM_COPY.quotaSheetText}
      </p>
      {isAdmin ? (
        <a className="btn btn--ink btn--block btn--lg" href={OPENAI_BILLING_URL} target="_blank" rel="noreferrer">
          {SYSTEM_COPY.quotaCta}
        </a>
      ) : (
        <p className="t-small">{SYSTEM_COPY.quotaReport}</p>
      )}
      <button className="btn btn--ghost btn--block" type="button" onClick={() => setOpen(false)}>
        {SYSTEM_COPY.ok}
      </button>
    </Sheet>,
    root,
  );
}

/** «المسودة اتعدّلت من مكان تاني» + «اعرض ن{n}» (States errors[6]). */
export function ConflictNotice({ conflict, className, style }: { conflict: ConflictInfo; className?: string; style?: CSSProperties }) {
  const n = toArabicDigits(conflict.version);
  return (
    <StatesNotice
      variant="info"
      icon={{ path: RESTORE_PATH }}
      title={SYSTEM_COPY.conflictTitle}
      text={`فيه نسخة أحدث (ن${n}). حدّث وشوفها قبل ما تطلب تعديل.`}
      className={className}
      style={style}
      action={
        <Button variant="quiet" size="sm" onClick={conflict.onShow}>
          {`اعرض ن${n}`}
        </Button>
      }
    />
  );
}

/**
 * S10 §1 — one component for every failed tool call:
 * AI failure (5xx / no answer) → `notice--error` + «أعد المحاولة» · quota → `notice--warn` (desktop) / sheet (mobile)
 * · 409 → `notice--info` «اعرض ن{n}» · 401 → nothing (the «الجلسة انتهت» dialog) · 429 → nothing (the cooldown card)
 * · any other refusal → `notice--error` with the API's message.
 */
export function ErrorSurface({ error, onRetry, conflict, className, style }: ErrorSurfaceProps) {
  if (!error) return null;
  const kind = toolErrorKind(error);
  if (kind === "session") return null;
  if (kind === "rate-limit" && isCooldownError(error)) return null;
  if (kind === "quota") return <QuotaSurface key={errorKey(error)} className={className} style={style} />;
  if (kind === "conflict" && conflict) return <ConflictNotice conflict={conflict} className={className} style={style} />;
  if (kind === "ai-failed") return <AiFailedNotice onRetry={onRetry} className={className} style={style} />;
  return (
    <StatesNotice
      variant="error"
      icon="warning"
      iconClass="ic-wrap--breaking"
      text={toolErrorMessage(error)}
      className={className}
      style={style}
    />
  );
}

/** A new error object reopens the quota sheet («تمام» closes it for that error only). */
const keys = new WeakMap<object, number>();
let nextKey = 0;
function errorKey(error: unknown): number {
  if (typeof error !== "object" || error === null) return 0;
  let key = keys.get(error);
  if (key === undefined) {
    nextKey += 1;
    key = nextKey;
    keys.set(error, key);
  }
  return key;
}

/* ---------- AI rate limit ---------- */

/** «٤:٠٠» — minutes and seconds left, Arabic-Indic digits. */
function clockLeft(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return toArabicDigits(`${m}:${String(s).padStart(2, "0")}`);
}

/** The ring's circumference on the board (r = 22 → 2π·22 ≈ 138). */
const RING_LENGTH = 138;

/** Desktop: the same card bottom-centre of the studio, at its width on the 390px board (390 − 2 × 12). */
const DESKTOP_FLOAT_STYLE: CSSProperties = { insetInline: 0, width: "366px", marginInline: "auto", bottom: "24px" };

/**
 * MobSystem-ratelimit «استراحة قصيرة للمحرّر»: `m-float` with the countdown ring, driven by the server's
 * `Retry-After` (useAiCooldown). Renders nothing outside a cooldown. Mobile: mounted once at the app root (above
 * the tab bar). Desktop: render it inside the positioned studio / tool area; it sits bottom-centre there.
 */
export function AiCooldownCard() {
  const { active, remaining, total } = useAiCooldown();
  const isMobile = useIsMobile();
  if (!active) return null;
  const minutes = Math.max(1, Math.ceil(remaining / 60));
  const offset = total > 0 ? Math.round(RING_LENGTH * (1 - remaining / total)) : 0;
  return (
    <div
      className="m-float row"
      role="status"
      aria-live="polite"
      style={isMobile ? { gap: "14px", alignItems: "center" } : { gap: "14px", alignItems: "center", ...DESKTOP_FLOAT_STYLE }}
    >
      <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true" style={{ flex: "none" }}>
        <circle cx="26" cy="26" r="22" fill="none" stroke="var(--line)" strokeWidth="4" />
        <circle
          cx="26"
          cy="26"
          r="22"
          fill="none"
          stroke="url(#np-ai-grad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={offset}
          transform="rotate(-90 26 26)"
        />
        <text x="26" y="31" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">
          {clockLeft(remaining)}
        </text>
      </svg>
      <span className="col grow">
        <b style={{ fontWeight: 600 }}>{SYSTEM_COPY.rateTitle}</b>
        <span className="t-small">
          {`استخدمت ${countPhrase(AI_RATE_LIMIT_MAX, REQUEST_FORMS)} في ربع ساعة. تقدر تكمّل بعد ${countPhrase(minutes, MINUTE_FORMS)}، والتصفّح شغال.`}
        </span>
      </span>
    </div>
  );
}
