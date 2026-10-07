import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import type { EditorialConversationSummary, EditorialMemoryRule } from "@newsplus/shared";
import { formatRelative, storyFormatMeta } from "../../newsFormat";
import { MemoryRuleCard } from "./MemoryRuleCard";

export function ConversationDrawer({
  busy = false,
  open,
  search,
  conversations,
  memory,
  activeId,
  listLoading = false,
  error,
  onSearch,
  onClose,
  onSelect,
  onDisableMemory,
}: {
  busy?: boolean;
  open: boolean;
  search: string;
  conversations: EditorialConversationSummary[];
  memory: EditorialMemoryRule[];
  activeId: string | null;
  listLoading?: boolean;
  error?: string;
  onSearch: (value: string) => void;
  onClose: () => void;
  onSelect: (id: string) => void;
  onDisableMemory: (id: string) => void;
}) {
  const trimmedSearch = search.trim();
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => dialog.close();
  }, [open]);
  if (!open) return null;

  return (
    <dialog ref={dialogRef} className="news-drawer" aria-label="المحادثات وذاكرة الفريق" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <button type="button" className="news-drawer-backdrop" aria-label="إغلاق" tabIndex={-1} onClick={onClose} />
      <section className="news-drawer-panel">
        <header className="news-drawer-head">
          <div className="news-drawer-head-copy">
            <h2 className="news-drawer-title">المحادثات المحفوظة</h2>
            <p className="news-drawer-count">{conversations.length} جلسة</p>
          </div>
          <button type="button" className="news-icon-btn" aria-label="إغلاق المحادثات" onClick={onClose}>
            <X size={16} weight="bold" />
          </button>
        </header>

        <label className="news-drawer-search" htmlFor="news-conversation-search">
          <MagnifyingGlass size={15} weight="regular" aria-hidden="true" />
          <span className="sr-only">بحث في المحادثات</span>
          <input
            id="news-conversation-search"
            type="search"
            value={search ?? ""}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="ابحث في عناوين المحادثات…"
            autoComplete="off"
          />
        </label>

        <div className="news-drawer-scroll">
          {error && <p className="news-state is-error" role="alert">{error}</p>}
          {listLoading && conversations.length === 0 ? (
            <p className="news-drawer-empty">جاري تحميل المحادثات…</p>
          ) : conversations.length === 0 && !error ? (
            <p className="news-drawer-empty">
              {trimmedSearch ? "لا نتائج لهذا البحث." : "لا محادثات بعد. ولّد ملخصاً ثم عدّل عليه."}
            </p>
          ) : (
            <ul className="news-conversation-list">
              {conversations.map((item) => {
                const meta = storyFormatMeta(item.format);
                const active = activeId === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`news-conversation-item ${active ? "is-active" : ""}`}
                      disabled={busy}
                      onClick={() => onSelect(item.id)}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="news-conversation-title">{item.title}</span>
                      <span className="news-conversation-meta">
                        <span className="news-conversation-pill">{meta.label}</span>
                        <span className="news-conversation-pill news-conversation-pill--muted">
                          ن{item.versionCount}
                        </span>
                        <time className="news-conversation-time" dateTime={item.updatedAt}>
                          {formatRelative(item.updatedAt)}
                        </time>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="news-memory-list">
            <p className="news-drawer-section-label">ذاكرة الفريق</p>
            {memory.length === 0 ? (
              <p className="news-memory-empty">لا قواعد محفوظة بعد. اقترحها المحرر بعد التعديل.</p>
            ) : (
              memory.map((rule) => (
                <MemoryRuleCard
                  key={rule.id}
                  rule={rule}
                  busy={busy}
                  compact
                  onDismiss={rule.status === "approved" ? () => onDisableMemory(rule.id) : undefined}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </dialog>
  );
}
