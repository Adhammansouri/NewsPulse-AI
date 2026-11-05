// DeskUsage-custom: the custom period card under the header (`isCustom` branch of DeskUsage.dc.html).
// Dates show as «٢٠ أكتوبر ٢٠٢٦» (the board's readOnly inputs); the native date picker behind each one edits it.
import { useRef, type KeyboardEvent } from "react";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Panel } from "@/ui/Panel";
import { cx } from "@/ui/cx";
import { toArabicDigits } from "@/utils/arabic";
import { MAX_RANGE_DAYS, rangeError } from "../usageFormat";

const ERROR_ID = "u-range-error";

const RULE = `الأيام بتوقيت UTC والحد الأقصى ${toArabicDigits(MAX_RANGE_DAYS)} يوم.`;
const MESSAGES = {
  order: `تاريخ النهاية قبل تاريخ البداية. ${RULE}`,
  span: RULE,
} as const;

const DATE_FORMAT = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** `2026-10-20` → «٢٠ أكتوبر ٢٠٢٦» (UTC, like the API's days). */
function formatDay(iso: string) {
  const time = Date.parse(`${iso}T00:00:00Z`);
  return Number.isFinite(time) ? toArabicDigits(DATE_FORMAT.format(time)) : "";
}

const OPEN_KEYS = new Set(["Enter", " ", "ArrowDown"]);

function DateField({
  id,
  label,
  value,
  max,
  invalid,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  max: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const picker = pickerRef.current;
    if (!picker) return;
    try {
      picker.showPicker();
    } catch {
      picker.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!OPEN_KEYS.has(event.key)) return;
    event.preventDefault();
    openPicker();
  }

  return (
    <div className="col" style={{ gap: "6px" }}>
      <label className="t-label" htmlFor={id}>
        {label}
      </label>
      <div className={cx("field", invalid && "is-error")} style={{ width: "190px" }}>
        <Icon name="calendar" />
        <input
          id={id}
          value={formatDay(value)}
          readOnly
          aria-haspopup="dialog"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? ERROR_ID : undefined}
          onClick={openPicker}
          onKeyDown={handleKeyDown}
        />
        <input
          ref={pickerRef}
          type="date"
          className="sr"
          tabIndex={-1}
          aria-hidden="true"
          value={value}
          max={max}
          onChange={(event) => {
            if (event.target.value) onChange(event.target.value);
          }}
        />
      </div>
    </div>
  );
}

export type CustomDraft = { start: string; end: string; project: string };

export function CustomPeriod({
  draft,
  scopes,
  scopeDisabled,
  onChange,
  onApply,
}: {
  draft: CustomDraft;
  scopes: Array<{ value: string; label: string }>;
  scopeDisabled: boolean;
  onChange: (draft: CustomDraft) => void;
  onApply: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const error = rangeError(draft.start, draft.end, today);

  return (
    <Panel
      className="row arrive"
      style={{ padding: "16px 18px", gap: "14px", alignItems: "flex-end", flexWrap: "wrap", boxShadow: "var(--shadow-2)" }}
    >
      <DateField
        id="u-from"
        label="من"
        value={draft.start}
        max={today}
        invalid={false}
        onChange={(start) => onChange({ ...draft, start })}
      />
      <DateField
        id="u-to"
        label="إلى"
        value={draft.end}
        max={today}
        invalid={error !== null}
        onChange={(end) => onChange({ ...draft, end })}
      />
      <div className="col grow" style={{ gap: "6px", minWidth: "200px" }}>
        <span className="t-label">النطاق</span>
        <div className="field">
          <select
            aria-label="النطاق"
            value={draft.project}
            disabled={scopeDisabled}
            onChange={(event) => onChange({ ...draft, project: event.target.value })}
          >
            {scopes.map((scope) => (
              <option key={scope.value} value={scope.value}>
                {scope.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button variant="ink" disabled={error !== null} onClick={onApply}>
        طبّق الفترة
      </Button>
      {error && (
        <p id={ERROR_ID} className="hint hint--error" role="alert" style={{ width: "100%" }}>
          <Icon name="error-circle" size="sm" />
          {MESSAGES[error]}
        </p>
      )}
    </Panel>
  );
}
