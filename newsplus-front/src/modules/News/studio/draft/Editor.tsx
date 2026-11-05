// S06 §5: the editor — its thread (Main / DeskDraft aside, MobDraft inline), the revise dock, the memory
// suggestion (DeskDraft ai-panel, MobDraft-memory float, edited as on MobArchive-memory) and the revise error
// (MobDraft-error). Markup and inline styles are the boards' own.
import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import type { EditorialMemoryRule } from "@newsplus/shared";
import { useAiCooldown } from "@/hooks/useAiCooldown";
import { isSystemHandledError, toolErrorKind, toolErrorMessage } from "@/services/toolErrors";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { cx } from "@/ui/cx";
import { Icon } from "@/ui/Icon";
import { ErrorSurface, type ConflictInfo } from "@/ui/ErrorSurface";
import { Notice } from "@/ui/Notice";
import { PulseLine } from "@/ui/PulseLine";
import { RuleEditField } from "../archive/ArchiveParts";
import { DRAFT_COPY } from "./copy";
import type { ThreadTurn } from "./thread";

/** DeskDraft's `msg--sys` glyph: the history arrow without the clock hands. */
function RestoreGlyph() {
  return (
    <svg className="ic ic--sm" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
    </svg>
  );
}

export function Thread({
  turns,
  pending,
  revising,
  mobile,
}: {
  turns: ThreadTurn[];
  /** The request on its way (shown until the editor answers). */
  pending: string | null;
  revising: boolean;
  mobile: boolean;
}) {
  // Main draws its messages with `fade-in`; MobDraft doesn't.
  const fade = !mobile && "fade-in";
  return (
    <>
      {turns.map((turn) =>
        turn.kind === "sys" ? (
          <p key={turn.key} className="msg--sys msg">
            <RestoreGlyph />
            {turn.text}
          </p>
        ) : (
          <p key={turn.key} className={cx("msg", `msg--${turn.kind}`, fade)}>
            {turn.text}
          </p>
        ),
      )}
      {pending && <p className={cx("msg msg--me", fade)}>{pending}</p>}
      {revising && (
        <div className="msg msg--ai row" style={{ gap: "10px" }} role="status">
          <PulseLine preset={mobile ? "60x20" : "64x20"} />
          {DRAFT_COPY.revising}
        </div>
      )}
    </>
  );
}

export type QuickChip = { key: string; label: string; run: () => void };

export function ReviseDock({
  value,
  onChange,
  onSubmit,
  chips,
  busy,
  mobile,
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  chips: QuickChip[];
  /** The editor is answering: the dock waits (MobDraft-revising dims it). */
  busy: boolean;
  mobile: boolean;
  style?: CSSProperties;
}) {
  // S10: during the AI cooldown the dock keeps its text but sends nothing (send + chips disabled).
  const cooldown = useAiCooldown();
  const blocked = busy || cooldown.active;

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter is a new line.
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!blocked) onSubmit();
  }

  const chipNodes = chips.map((chip) => (
    <Chip
      key={chip.key}
      size="sm"
      ai
      aria-disabled={blocked || undefined}
      onClick={() => {
        if (!blocked) chip.run();
      }}
    >
      {chip.label}
    </Chip>
  ));

  return (
    <form
      className="dock"
      style={style}
      onSubmit={(event) => {
        event.preventDefault();
        if (!blocked) onSubmit();
      }}
    >
      {mobile ? (
        <div className="scroll-x">{chipNodes}</div>
      ) : (
        <div className="row" style={{ flexWrap: "wrap", gap: "6px" }}>
          {chipNodes}
        </div>
      )}
      <label className="dock__input" style={mobile && busy ? { opacity: 0.5 } : undefined}>
        <span className="sr">{DRAFT_COPY.askEdit}</span>
        <textarea
          rows={1}
          placeholder={mobile ? (busy ? DRAFT_COPY.placeholderBusy : DRAFT_COPY.placeholderMob) : DRAFT_COPY.placeholderDesk}
          value={value}
          disabled={mobile && busy}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          className="send"
          type="button"
          aria-label={DRAFT_COPY.send}
          aria-disabled={blocked || undefined}
          onClick={() => {
            if (!blocked) onSubmit();
          }}
        >
          <Icon name="send" />
        </button>
      </label>
    </form>
  );
}

type MemoryActions = {
  busy: boolean;
  onSave: (id: string, instruction?: string) => void;
  onDismiss: (id: string) => void;
};

/** DeskDraft: «المحرّر تعلّم قاعدة جديدة» in the editor's thread. */
export function MemoryPanel({ rule, busy, onSave, onDismiss }: MemoryActions & { rule: EditorialMemoryRule }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="ai-panel fade-in" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "none" }}>
      {editing ? (
        <RuleEditField rule={rule} busy={busy} autoFocus onCancel={() => setEditing(false)} onSave={(instruction) => onSave(rule.id, instruction)} />
      ) : (
        <>
          <div className="row">
            <Icon name="memory" size="sm" style={{ color: "var(--cyan)" }} />
            <span className="t-label t-ai">{DRAFT_COPY.learned}</span>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.7 }}>{rule.instruction}</p>
          {rule.rationale && <p className="t-meta">{rule.rationale}</p>}
          <MemoryButtons busy={busy} grow={false} onSave={() => onSave(rule.id)} onEdit={() => setEditing(true)} onDismiss={() => onDismiss(rule.id)} />
        </>
      )}
    </div>
  );
}

/** MobDraft-memory: the suggestion floats above the dock. */
export function MemoryFloat({ rule, busy, onSave, onDismiss }: MemoryActions & { rule: EditorialMemoryRule }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="m-float ai-panel" style={{ bottom: "140px" }} role="region" aria-label={DRAFT_COPY.learned}>
      {editing ? (
        <RuleEditField rule={rule} busy={busy} autoFocus onCancel={() => setEditing(false)} onSave={(instruction) => onSave(rule.id, instruction)} />
      ) : (
        <>
          <div className="row">
            <span className="ic-wrap ic-wrap--ai" style={{ width: "30px", height: "30px", borderRadius: "9px" }}>
              <Icon name="memory" size="sm" />
            </span>
            <b className="t-ai" style={{ fontWeight: 600 }}>
              {DRAFT_COPY.learned}
            </b>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.7 }}>{rule.instruction}</p>
          <MemoryButtons busy={busy} grow onSave={() => onSave(rule.id)} onEdit={() => setEditing(true)} onDismiss={() => onDismiss(rule.id)} />
        </>
      )}
    </div>
  );
}

function MemoryButtons({
  busy,
  grow,
  onSave,
  onEdit,
  onDismiss,
}: {
  busy: boolean;
  /** MobDraft-memory: «احفظ للفريق» fills the row. */
  grow: boolean;
  onSave: () => void;
  onEdit: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="row" style={{ gap: "6px" }}>
      <Button variant="ai" size="sm" className={grow ? "grow" : undefined} disabled={busy} onClick={onSave}>
        {DRAFT_COPY.saveForTeam}
      </Button>
      <Button variant="ghost" size="sm" disabled={busy} onClick={onEdit}>
        {DRAFT_COPY.edit}
      </Button>
      <Button variant="ghost" size="sm" disabled={busy} onClick={onDismiss}>
        {DRAFT_COPY.dismiss}
      </Button>
    </div>
  );
}

/**
 * MobDraft-error: the request is kept and «أعد المحاولة» sends it again (disabled during the AI cooldown).
 * S10: every other case is the shared ErrorSurface — quota, «المسودة اتعدّلت من مكان تاني» (409) with
 * `conflict`, nothing for a 401 / 429 (the session dialog / the cooldown card).
 */
export function ReviseError({
  error,
  instruction,
  onRetry,
  conflict,
  style,
}: {
  error: unknown;
  instruction: string;
  onRetry: () => void;
  /** 409: the newest version and «اعرض ن{n}» (null while it is being fetched). */
  conflict?: ConflictInfo | null;
  style?: CSSProperties;
}) {
  const cooldown = useAiCooldown();
  const kind = toolErrorKind(error);
  if (kind === "conflict" && !conflict) return null;
  if (kind !== "ai-failed") return <ErrorSurface error={error} onRetry={onRetry} conflict={conflict} className="arrive" style={style} />;
  return (
    <Notice
      variant="error"
      role="alert"
      className="arrive"
      style={{ alignItems: "center", ...style }}
      textClassName="col grow"
      action={
        <Button variant="quiet" size="sm" disabled={cooldown.active} onClick={onRetry}>
          {DRAFT_COPY.retry}
        </Button>
      }
    >
      <b style={{ fontWeight: 600 }}>{DRAFT_COPY.reviseFailed}</b>
      <span className="t-small">{DRAFT_COPY.reviseFailedText(instruction)}</span>
    </Notice>
  );
}

/** Restoring a version, a memory decision or reopening the conversation failed (no board: the API's message). */
export function DraftError({ error, style }: { error: unknown; style?: CSSProperties }): ReactNode {
  // S10: a 401 / AI 429 has its own app-wide surface; the quota keeps its designed one.
  if (!error || isSystemHandledError(error)) return null;
  if (toolErrorKind(error) === "quota") return <ErrorSurface error={error} className="arrive" style={style} />;
  return (
    <Notice variant="error" role="alert" className="arrive" style={{ alignItems: "center", ...style }} textClassName="col grow">
      <span className="t-small">{toolErrorMessage(error)}</span>
    </Notice>
  );
}
