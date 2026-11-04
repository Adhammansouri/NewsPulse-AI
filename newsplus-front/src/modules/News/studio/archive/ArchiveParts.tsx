// Pieces shared by DeskArchive (the drawer) and MobArchive (the screen): the search field, the «المسودات /
// ذاكرة الفريق» tabs, the suggested-rule editor (MobArchive-memory), the rule switch, and the empty / error /
// loading states (States board). Inline styles are the boards' own.
import { useId, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import type { EditorialMemoryRule } from "@newsplus/shared";
import { toolErrorMessage } from "@/services/toolErrors";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { Field, FieldInput, FieldTextarea } from "@/ui/Field";
import { Icon } from "@/ui/Icon";
import { Notice } from "@/ui/Notice";
import { Skeleton } from "@/ui/Skeleton";
import { Switch } from "@/ui/Switch";
import { ARCHIVE_COPY, RULE_MAX, RULE_MIN, ruleCounter, tabLabel, type ArchiveTab } from "./archiveModel";

/* ---------- Search ---------- */

export function ArchiveSearch({
  label,
  value,
  onChange,
  inputRef,
}: {
  /** Visually hidden name: «بحث في الأرشيف» (DeskArchive) / «بحث» (MobArchive). */
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <Field as="label" sunken>
      <Icon name="search" />
      <span className="sr">{label}</span>
      <FieldInput
        ref={inputRef}
        type="search"
        placeholder={ARCHIVE_COPY.searchPlaceholder}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

/* ---------- Tabs ---------- */

const TABS: readonly ArchiveTab[] = ["drafts", "memory"];

export type ArchiveTabIds = { tab: (tab: ArchiveTab) => string; panel: string };

export function useArchiveTabIds(): ArchiveTabIds {
  const base = useId();
  return { tab: (tab) => `${base}-${tab}`, panel: `${base}-panel` };
}

/**
 * `seg seg--block[role=tablist]`: «المسودات · N» / «ذاكرة الفريق · N». Arrow keys move between the tabs (and select),
 * Home / End jump to the first / last.
 */
export function ArchiveTabs({
  tab,
  onTab,
  drafts,
  memory,
  ids,
}: {
  tab: ArchiveTab;
  onTab: (tab: ArchiveTab) => void;
  /** Counts, null until known. */
  drafts: number | null;
  memory: number | null;
  ids: ArchiveTabIds;
}) {
  const refs = useRef<Partial<Record<ArchiveTab, HTMLButtonElement | null>>>({});
  const labels: Record<ArchiveTab, string> = {
    drafts: tabLabel(ARCHIVE_COPY.drafts, drafts),
    memory: tabLabel(ARCHIVE_COPY.memory, memory),
  };

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = TABS.indexOf(tab);
    // RTL: the next tab sits to the left.
    const target =
      event.key === "ArrowLeft"
        ? TABS[(index + 1) % TABS.length]
        : event.key === "ArrowRight"
          ? TABS[(index - 1 + TABS.length) % TABS.length]
          : event.key === "Home"
            ? TABS[0]
            : event.key === "End"
              ? TABS[TABS.length - 1]
              : null;
    if (!target) return;
    event.preventDefault();
    onTab(target);
    refs.current[target]?.focus();
  }

  return (
    <div className="seg seg--block" role="tablist" onKeyDown={onKeyDown}>
      {TABS.map((value) => {
        const selected = value === tab;
        return (
          <button
            key={value}
            ref={(node) => {
              refs.current[value] = node;
            }}
            id={ids.tab(value)}
            type="button"
            role="tab"
            aria-pressed={selected}
            aria-selected={selected}
            aria-controls={ids.panel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onTab(value)}
          >
            {labels[value]}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Team memory ---------- */

/**
 * MobArchive-memory's rule edit field: «حرّر القاعدة قبل الحفظ», the wording, «n / ٢٤٠», «إلغاء» / «احفظ للفريق».
 * Shared by the archive's suggestions and the draft editor's memory suggestion (S06 §5). «إلغاء» puts the
 * suggestion's wording back, then `onCancel`; «احفظ للفريق» approves it with the new wording, or `undefined`
 * when the wording was not changed.
 */
export function RuleEditField({
  rule,
  busy,
  autoFocus = false,
  onCancel,
  onSave,
}: {
  rule: EditorialMemoryRule;
  busy: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  onSave: (instruction: string | undefined) => void;
}) {
  const id = useId();
  const [text, setText] = useState(rule.instruction);
  const next = text.trim();
  const edited = next !== rule.instruction.trim();
  const valid = !edited || (next.length >= RULE_MIN && next.length <= RULE_MAX);

  return (
    <>
      <label className="t-label" htmlFor={id}>
        {ARCHIVE_COPY.editRule}
      </label>
      <Field as="label" area style={{ minHeight: "76px" }}>
        <FieldTextarea
          id={id}
          rows={3}
          value={text}
          maxLength={RULE_MAX}
          disabled={busy}
          autoFocus={autoFocus}
          onChange={(event) => setText(event.target.value)}
        />
      </Field>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="t-meta num">{ruleCounter(text.length)}</span>
        <span className="row" style={{ gap: "6px" }}>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => {
              setText(rule.instruction);
              onCancel?.();
            }}
          >
            {ARCHIVE_COPY.cancel}
          </Button>
          <Button
            variant="ai"
            size="sm"
            disabled={busy || !valid}
            aria-busy={busy || undefined}
            onClick={() => onSave(edited ? next : undefined)}
          >
            {ARCHIVE_COPY.saveForTeam}
          </Button>
        </span>
      </div>
    </>
  );
}

/** MobArchive-memory: a suggested rule, open for editing before it is saved for the team. */
export function SuggestedRule({
  rule,
  busy,
  onSave,
}: {
  rule: EditorialMemoryRule;
  busy: boolean;
  onSave: (instruction: string | undefined) => void;
}) {
  return (
    <div className="panel col" style={{ padding: "14px", gap: "10px", borderColor: "var(--cyan-dot)" }}>
      <RuleEditField rule={rule} busy={busy} onSave={onSave} />
    </div>
  );
}

/** `switch` «تفعيل القاعدة»: on = approved, off = disabled. Described by the rule it toggles. */
export function RuleSwitch({
  rule,
  describedBy,
  onToggle,
}: {
  rule: EditorialMemoryRule;
  describedBy: string;
  onToggle: (rule: EditorialMemoryRule, on: boolean) => void;
}) {
  return (
    <Switch
      checked={rule.status === "approved"}
      label={ARCHIVE_COPY.ruleSwitch}
      aria-describedby={describedBy}
      onCheckedChange={(on) => onToggle(rule, on)}
    />
  );
}

/* ---------- States ---------- */

/** States `errors[]` pattern: the request's message and «حاول تاني». */
export function ArchiveError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Notice
      variant="error"
      role="alert"
      style={{ alignItems: "center", marginTop: "8px" }}
      icon={
        <span className="ic-wrap ic-wrap--breaking" style={{ background: "var(--surface)" }}>
          <Icon name="refresh" />
        </span>
      }
      textClassName="col grow"
      action={
        <Button variant="quiet" size="sm" onClick={onRetry}>
          {ARCHIVE_COPY.retry}
        </Button>
      }
    >
      <span className="t-small">{toolErrorMessage(error)}</span>
    </Notice>
  );
}

function ArchiveEmpty({
  art,
  ai = false,
  title,
  text,
  children,
}: {
  art: ReactNode;
  ai?: boolean;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <EmptyState
      art={art}
      artClassName={ai ? "ic-wrap--ai" : undefined}
      titleAs="h3"
      titleClassName="t-head"
      title={title}
      description={text}
    >
      {children}
    </EmptyState>
  );
}

/** No draft yet: «ابدأ أول مسودة» + the action that opens the headlines. */
export function FirstDraftEmpty({ action }: { action: ReactNode }) {
  return (
    <ArchiveEmpty art={<Icon name="sparkle" size="xl" />} ai title={ARCHIVE_COPY.firstDraftTitle} text={ARCHIVE_COPY.firstDraftText}>
      {action}
    </ArchiveEmpty>
  );
}

/** The search found nothing: «مفيش نتائج في الأرشيف» + «امسح البحث». */
export function NoResultsEmpty({ onClear }: { onClear: () => void }) {
  return (
    <ArchiveEmpty art={<Icon name="search" size="xl" />} title={ARCHIVE_COPY.noResultsTitle} text={ARCHIVE_COPY.noResultsText}>
      <Button variant="quiet" size="sm" onClick={onClear}>
        {ARCHIVE_COPY.clearSearch}
      </Button>
    </ArchiveEmpty>
  );
}

/** No rule and no suggestion yet: «ذاكرة الفريق فاضية». */
export function MemoryEmpty() {
  return <ArchiveEmpty art={<Icon name="memory" size="xl" />} title={ARCHIVE_COPY.memoryEmptyTitle} text={ARCHIVE_COPY.memoryEmptyText} />;
}

/** Placeholder lines of a row (title, meta) — the S09 list skeleton's widths. */
export function RowLines() {
  return (
    <>
      <Skeleton height={14} width="45%" />
      <Skeleton height={12} width="65%" />
    </>
  );
}
