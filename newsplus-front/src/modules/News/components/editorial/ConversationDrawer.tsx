import { MagnifyingGlass } from "@phosphor-icons/react";
import type { EditorialConversationSummary, EditorialMemoryRule } from "@newsplus/shared";
import { Sheet } from "@/components/ui/Sheet";
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
  const searching = search.trim().length > 0;

  return (
    <Sheet open={open} onClose={onClose} title="المحادثات المحفوظة" subtitle={`${conversations.length} جلسة`} variant="side">
      <div className="input-wrap drawer-search">
        <MagnifyingGlass size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor="conversation-search">بحث في المحادثات</label>
        <input id="conversation-search" className="input" type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="ابحث في عناوين المحادثات…" autoComplete="off" />
      </div>

      {error ? <p className="hint is-error" role="alert">{error}</p> : null}
      {listLoading && conversations.length === 0 ? (
        <div className="drawer-skel" aria-hidden="true">{[0, 1, 2].map((i) => <span key={i} className="skel" style={{ height: "3.6rem" }} />)}</div>
      ) : conversations.length === 0 && !error ? (
        <p className="hint drawer-empty">{searching ? "لا نتائج لهذا البحث." : "لا محادثات بعد. ولّد محتوى من خبر وسيُحفظ هنا تلقائياً."}</p>
      ) : (
        <ul className="convo-list">
          {conversations.map((item) => {
            const active = activeId === item.id;
            return (
              <li key={item.id}>
                <button type="button" className={`convo ${active ? "is-active" : ""}`} disabled={busy} onClick={() => onSelect(item.id)} aria-current={active ? "true" : undefined}>
                  <span className="convo-title">{item.title}</span>
                  <span className="convo-meta">
                    <span className="badge badge-brand">{storyFormatMeta(item.format).label}</span>
                    <span className="badge">{item.versionCount} نسخ</span>
                    <time dateTime={item.updatedAt}>{formatRelative(item.updatedAt)}</time>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <section className="drawer-memory" aria-labelledby="memory-title">
        <h3 id="memory-title">ذاكرة الفريق</h3>
        {memory.length === 0 ? (
          <p className="hint">لا قواعد محفوظة بعد. يقترحها المحرّر بعد التعديلات المتكررة.</p>
        ) : (
          memory.map((rule) => (
            <MemoryRuleCard key={rule.id} rule={rule} busy={busy} compact onDismiss={rule.status === "approved" ? () => onDisableMemory(rule.id) : undefined} />
          ))
        )}
      </section>
    </Sheet>
  );
}
