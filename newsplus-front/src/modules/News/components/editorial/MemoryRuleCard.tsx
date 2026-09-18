import { useState } from "react";
import type { EditorialMemoryRule } from "@newsplus/shared";

export function MemoryRuleCard({
  rule,
  busy,
  compact = false,
  onSave,
  onEdit,
  onDismiss,
}: {
  rule: EditorialMemoryRule;
  busy: boolean;
  compact?: boolean;
  onSave?: () => void;
  onEdit?: (instruction: string) => void;
  onDismiss?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rule.instruction);
  const pending = rule.status === "pending";

  return (
    <article className={`news-memory-card ${pending ? "is-pending" : ""} ${compact ? "is-compact" : ""}`}>
      {compact && !pending ? null : (
        <p className="news-field-label">{pending ? "قاعدة مقترحة للفريق" : "ذاكرة الفريق"}</p>
      )}
      {editing ? (
        <textarea
          value={draft}
          disabled={busy}
          rows={3}
          onChange={(event) => setDraft(event.target.value)}
        />
      ) : (
        <p className="news-memory-copy">{rule.instruction}</p>
      )}
      {rule.rationale && !compact ? <p className="news-memory-why">{rule.rationale}</p> : null}
      <div className="news-summary-tools">
        {pending && onSave ? (
          editing ? (
            <button
              type="button"
              className="news-btn-secondary"
              disabled={busy || draft.trim().length < 18}
              onClick={() => onEdit?.(draft.trim())}
            >
              حفظ التعديل
            </button>
          ) : (
            <button type="button" className="news-btn-secondary" disabled={busy} onClick={onSave}>
              حفظ للفريق
            </button>
          )
        ) : null}
        {pending && onEdit ? (
          <button
            type="button"
            className="news-btn-secondary"
            disabled={busy}
            onClick={() => setEditing((current) => !current)}
          >
            {editing ? "إلغاء" : "تعديل"}
          </button>
        ) : null}
        {onDismiss ? (
          <button type="button" className="news-btn-secondary" disabled={busy} onClick={onDismiss}>
            {pending ? "تجاهل" : "تعطيل"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
