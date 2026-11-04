// A generation that failed, shown above the formats with the editor's choice kept. Copy and markup are the
// States board's `errors[]` notices («المحرّر ما قدرش يكمّل» / «رصيد OpenAI خلص»); S10 owns the full
// system-state pass (rate limit, admin-only billing link, mobile quota sheet).
import type { CSSProperties } from "react";
import { OPENAI_BILLING_URL } from "@/components/QuotaNotice";
import { isOpenAIQuotaError } from "@/services/toolErrors";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Notice } from "@/ui/Notice";
import { STUDIO_COPY } from "./formats";

const ICON_WRAP_STYLE = { background: "var(--surface)" } as const;

export function StudioError({ error, onRetry, style }: { error: unknown; onRetry: () => void; style?: CSSProperties }) {
  if (isOpenAIQuotaError(error)) {
    return (
      <Notice
        variant="warn"
        role="alert"
        style={{ alignItems: "center", ...style }}
        icon={
          <span className="ic-wrap ic-wrap--warn" style={ICON_WRAP_STYLE}>
            <Icon name="card" />
          </span>
        }
        textClassName="col grow"
        action={
          <a className="btn btn--quiet btn--sm" href={OPENAI_BILLING_URL} target="_blank" rel="noopener">
            {STUDIO_COPY.quotaCta}
          </a>
        }
      >
        <b style={{ fontWeight: 600 }}>{STUDIO_COPY.quotaTitle}</b>
        <span className="t-small">{STUDIO_COPY.quotaText}</span>
      </Notice>
    );
  }
  return (
    <Notice
      variant="error"
      role="alert"
      style={{ alignItems: "center", ...style }}
      icon={
        <span className="ic-wrap ic-wrap--breaking" style={ICON_WRAP_STYLE}>
          <Icon name="warning" />
        </span>
      }
      textClassName="col grow"
      action={
        <Button variant="quiet" size="sm" onClick={onRetry}>
          {STUDIO_COPY.retry}
        </Button>
      }
    >
      <b style={{ fontWeight: 600 }}>{STUDIO_COPY.failedTitle}</b>
      <span className="t-small">{STUDIO_COPY.failedText}</span>
    </Notice>
  );
}
