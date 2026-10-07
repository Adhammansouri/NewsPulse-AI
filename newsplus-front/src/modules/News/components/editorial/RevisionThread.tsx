import { useEffect, useRef } from "react";
import type { EditorialMemoryRule, EditorialMessage, EditorialVersion, NewsSummarizeData } from "@newsplus/shared";
import { ChatCircleText, CircleNotch, PaperPlaneTilt } from "@phosphor-icons/react";
import { MemoryRuleCard } from "./MemoryRuleCard";

const VIDEO_ACTIONS = ["قوِّ الهوك", "اجعل الانتقال سؤالاً يفتح طبقة جديدة", "اختصر دون إضافات"] as const;
const CAROUSEL_ACTIONS = ["قصّر العناوين دون إضافة وقائع", "أبقِ الوقائع وشدّ الهوك"] as const;
const DESK_ACTIONS = ["اختصر دون إضافات", "انسب الادعاءات إلى أصحابها ولا تتبنَّها"] as const;

type ChatTurn =
  | { kind: "user" | "assistant"; id: string; content: string }
  | { kind: "system"; id: string; content: string };

function isOpeningPrompt(message: EditorialMessage, index: number) {
  return index === 0 && message.role === "user";
}

function isOpeningDraftNote(message: EditorialMessage, index: number) {
  return index === 1 && message.role === "assistant";
}

function isRestoreCopy(content: string) {
  return /^(استعادة النسخة|أُعيدت النسخة)\s+\d+/.test(content.trim());
}

function restoreLabel(content: string) {
  const match = content.trim().match(/(\d+)/);
  return match ? `أُعيدت النسخة ${match[1]}` : content.trim();
}

export function toChatTurns(messages: EditorialMessage[]): ChatTurn[] {
  const turns: ChatTurn[] = [];

  for (const [index, message] of messages.entries()) {
    if (isOpeningPrompt(message, index) || isOpeningDraftNote(message, index)) continue;

    if (message.role === "system" || isRestoreCopy(message.content)) {
      const content = restoreLabel(message.content);
      const previous = turns.at(-1);
      if (previous?.kind === "system" && previous.content === content) continue;
      turns.push({ kind: "system", id: message.id, content });
      continue;
    }

    turns.push({
      kind: message.role === "user" ? "user" : "assistant",
      id: message.id,
      content: message.content,
    });
  }

  return turns;
}

export function RevisionThread({
  messages,
  versions,
  currentVersionId,
  pendingMemory,
  instruction,
  busy,
  format,
  onInstructionChange,
  onSubmit,
  onQuickAction,
  onRestore,
  onMemorySave,
  onMemoryEdit,
  onMemoryDismiss,
}: {
  messages: EditorialMessage[];
  versions: EditorialVersion[];
  currentVersionId: string;
  pendingMemory: EditorialMemoryRule[];
  instruction: string;
  busy: boolean;
  format: NewsSummarizeData["format"];
  onInstructionChange: (value: string) => void;
  onSubmit: () => void;
  onQuickAction: (value: string) => void;
  onRestore: (versionId: string) => void;
  onMemorySave: (id: string) => void;
  onMemoryEdit: (id: string, instruction: string) => void;
  onMemoryDismiss: (id: string) => void;
}) {
  const actions = format === "video" ? VIDEO_ACTIONS : format === "carousel" ? CAROUSEL_ACTIONS : DESK_ACTIONS;
  const turns = toChatTurns(messages);
  const logRef = useRef<HTMLOListElement>(null);
  const activeVersionRef = useRef<HTMLButtonElement>(null);
  const currentVersion = versions.find((version) => version.id === currentVersionId);

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    log.scrollTop = log.scrollHeight;
  }, [turns.length, busy, pendingMemory.length]);

  useEffect(() => {
    activeVersionRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [currentVersionId, versions.length]);

  return (
    <section className="news-revise" aria-label="محادثة التعديل">
      <header className="news-revise-head">
        <div className="news-revise-head-brand">
          <span className="news-revise-head-icon" aria-hidden="true">
            <ChatCircleText size={17} weight="duotone" />
          </span>
          <p className="news-revise-head-title">
            المحرّر
            {currentVersion ? <span className="news-revise-head-num">ن{currentVersion.number}</span> : null}
          </p>
        </div>

        {versions.length > 1 ? (
          <div className="news-version-scroller" data-version-count={versions.length}>
            <div className="news-version-track" role="list" aria-label="النسخ">
              {versions.map((version) => {
                const isActive = version.id === currentVersionId;
                return (
                  <button
                    key={version.id}
                    ref={isActive ? activeVersionRef : undefined}
                    type="button"
                    role="listitem"
                    className={`news-version-chip ${isActive ? "is-active" : ""}`}
                    disabled={busy || isActive}
                    onClick={() => onRestore(version.id)}
                    title={version.note || `النسخة ${version.number}`}
                    aria-label={
                      isActive ? `النسخة ${version.number} (الحالية)` : `استعادة النسخة ${version.number}`
                    }
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span className="news-version-chip-label">{version.number}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </header>

      <ol className="news-revise-log" ref={logRef}>
        {turns.length === 0 && !busy ? (
          <li className="news-revise-empty">اطلب تعديلاً. كل جولة تُحفظ كنسخة يمكن الرجوع إليها.</li>
        ) : null}

        {turns.map((turn) =>
          turn.kind === "system" ? (
            <li key={turn.id} className="news-revise-system">
              {turn.content}
            </li>
          ) : (
            <li key={turn.id} className={`news-revise-turn is-${turn.kind}`}>
              {turn.kind === "assistant" ? <span className="news-revise-who">المكتب</span> : null}
              <p>{turn.content}</p>
            </li>
          ),
        )}

        {busy ? (
          <li className="news-revise-turn is-assistant is-pending" aria-live="polite">
            <span className="news-revise-who">المكتب</span>
            <p>
              <span className="news-revise-dots" aria-hidden="true" />
              جاري الكتابة…
            </p>
          </li>
        ) : null}

        {pendingMemory.map((rule) => (
          <li key={rule.id} className="news-revise-memory">
            <MemoryRuleCard
              rule={rule}
              busy={busy}
              onSave={() => onMemorySave(rule.id)}
              onEdit={(next) => onMemoryEdit(rule.id, next)}
              onDismiss={() => onMemoryDismiss(rule.id)}
            />
          </li>
        ))}
      </ol>

      <form
        className="news-revise-dock"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="news-revise-actions">
          {actions.map((action) => (
            <button key={action} type="button" className="news-chip" disabled={busy} onClick={() => onQuickAction(action)}>
              {action}
            </button>
          ))}
        </div>
        <div className="news-revise-input">
          <label className="sr-only" htmlFor="news-revise-input">
            اطلب تعديلاً على النص
          </label>
          <textarea
            id="news-revise-input"
            rows={1}
            value={instruction}
            disabled={busy}
            placeholder="اكتب تعديلاً…"
            onChange={(event) => onInstructionChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
          />
          <button
            type="submit"
            className="news-revise-send"
            disabled={busy || !instruction.trim()}
            aria-label="إرسال التعديل"
          >
            {busy ? <CircleNotch className="news-spin" size={16} aria-hidden="true" /> : <PaperPlaneTilt size={16} weight="fill" />}
          </button>
        </div>
      </form>
    </section>
  );
}
