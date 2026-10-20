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
    <article className={`memory ${pending ? "is-pending" : ""} ${compact ? "is-compact" : ""}`}>
      {compact && !pending ? null : <p className="doc-label">{pending ? "قاعدة مقترحة للفريق" : "ذاكرة الفريق"}</p>}
      {editing ? (
        <textarea className="textarea" value={draft} disabled={busy} rows={3} onChange={(event) => setDraft(event.target.value)} aria-label="نص القاعدة" />
      ) : (
        <p className="memory-copy">{rule.instruction}</p>
      )}
      {rule.rationale && !compact ? <p className="hint">{rule.rationale}</p> : null}
      <div className="memory-actions">
        {pending && onSave ? (
          editing ? (
            <button type="button" className="btn btn-primary btn-sm" disabled={busy || draft.trim().length < 18} onClick={() => onEdit?.(draft.trim())}>حفظ التعديل</button>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={onSave}>حفظ للفريق</button>
          )
        ) : null}
        {pending && onEdit ? (
          <button type="button" className="btn btn-quiet btn-sm" disabled={busy} onClick={() => setEditing((current) => !current)}>{editing ? "إلغاء" : "تعديل"}</button>
        ) : null}
        {onDismiss ? (
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={onDismiss}>{pending ? "تجاهل" : "تعطيل"}</button>
        ) : null}
      </div>
    </article>
  );
}
