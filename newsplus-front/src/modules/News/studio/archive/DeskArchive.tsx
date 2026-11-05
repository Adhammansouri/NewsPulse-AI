// DeskArchive (S06 §7): the 500px archive drawer over the studio — header «الأرشيف», search, the «المسودات /
// ذاكرة الفريق» tabs; the drafts by day (the one open in the studio highlighted) followed by the team-memory
// panel with a switch per rule. Port of docs/redesign/design/reference/DeskArchive.dc.html; inline styles are the
// board's own. The «ذاكرة الفريق» tab shows the suggestions to approve (MobArchive-memory's editor) above that panel.
import { Fragment, useId, useRef, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { useNow } from "@/hooks/useNow";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/ui/Button";
import { cx } from "@/ui/cx";
import { Drawer } from "@/ui/Drawer";
import { Icon } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { Skeleton } from "@/ui/Skeleton";
import {
  ArchiveError,
  ArchiveSearch,
  ArchiveTabs,
  FirstDraftEmpty,
  MemoryEmpty,
  NoResultsEmpty,
  RowLines,
  RuleSwitch,
  SuggestedRule,
  useArchiveTabIds,
} from "./ArchiveParts";
import { ARCHIVE_COPY, archiveGroups, ruleMeta, type ArchiveRow, type ArchiveTab } from "./archiveModel";
import { useArchiveDrafts, useArchiveMemory, type ArchiveDrafts, type ArchiveMemoryState } from "./useArchive";

const DRAWER_STYLE = { width: "500px", display: "flex", flexDirection: "column" } as const;
const KIND_STYLE = { width: "42px", height: "42px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 } as const;
const GROUP_TITLE_STYLE = { padding: "14px 12px 6px", fontWeight: 600 } as const;

export function DeskArchive({
  tab,
  onTab,
  currentId,
  onOpen,
  onClose,
}: {
  tab: ArchiveTab;
  onTab: (tab: ArchiveTab) => void;
  /** The conversation open in the studio. */
  currentId: string | null;
  onOpen: (conversationId: string) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const ids = useArchiveTabIds();
  const searchRef = useRef<HTMLInputElement>(null);
  const drafts = useArchiveDrafts();
  const memory = useArchiveMemory();

  return (
    <Drawer open onClose={onClose} scrimLabel={ARCHIVE_COPY.closeScrim} aria-labelledby={titleId} style={DRAWER_STYLE}>
      <header className="col" style={{ gap: "14px", padding: "22px 24px 16px", borderBottom: "1px solid var(--line)" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="col">
            <h2 id={titleId} className="t-title">
              {ARCHIVE_COPY.title}
            </h2>
            <p className="t-meta">{ARCHIVE_COPY.lead}</p>
          </div>
          <IconButton label={ARCHIVE_COPY.close} icon="close" onClick={onClose} />
        </div>
        <ArchiveSearch label={ARCHIVE_COPY.searchDesk} value={drafts.search} onChange={drafts.setSearch} inputRef={searchRef} />
        <ArchiveTabs
          tab={tab}
          onTab={onTab}
          drafts={drafts.loading || drafts.error ? null : drafts.items.length}
          memory={memory.loading || memory.error ? null : memory.rules.length}
          ids={ids}
        />
      </header>
      <div
        className="col"
        id={ids.panel}
        role="tabpanel"
        aria-labelledby={ids.tab(tab)}
        style={{ flex: 1, overflowY: "auto", padding: "8px 12px 20px" }}
      >
        {tab === "drafts" ? (
          <>
            <Drafts
              drafts={drafts}
              currentId={currentId}
              onOpen={onOpen}
              onClose={onClose}
              onClear={() => {
                drafts.setSearch("");
                searchRef.current?.focus();
              }}
            />
            {memory.rules.length > 0 && <MemoryPanel memory={memory} />}
          </>
        ) : (
          <Memory memory={memory} />
        )}
      </div>
    </Drawer>
  );
}

/* ---------- Drafts ---------- */

function Drafts({
  drafts,
  currentId,
  onOpen,
  onClose,
  onClear,
}: {
  drafts: ArchiveDrafts;
  currentId: string | null;
  onOpen: (conversationId: string) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  const now = useNow();
  if (drafts.loading) return <DraftsSkeleton />;
  if (drafts.error) return <ArchiveError error={drafts.error} onRetry={drafts.retry} />;
  if (drafts.items.length === 0) {
    if (drafts.searching) return <DraftsSkeleton />;
    if (drafts.q) return <NoResultsEmpty onClear={onClear} />;
    return (
      <FirstDraftEmpty
        action={
          <Button variant="ai" size="sm" onClick={onClose}>
            {ARCHIVE_COPY.openHeadlines}
          </Button>
        }
      />
    );
  }

  const groups = archiveGroups(drafts.items, { now, currentId, mobile: false });
  return (
    <>
      {groups.map((group) => (
        <Fragment key={group.key}>
          <h3 className="t-meta" style={GROUP_TITLE_STYLE}>
            {group.label}
          </h3>
          <ul className="col" style={{ gap: "2px" }}>
            {group.rows.map((row) => (
              <li key={row.id}>
                <DraftRow row={row} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </>
  );
}

function DraftRow({ row, onOpen }: { row: ArchiveRow; onOpen: (conversationId: string) => void }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onOpen(row.id);
  }

  return (
    <Link
      to="/news"
      state={{ conversationId: row.id }}
      className="row"
      aria-current={row.current || undefined}
      style={{
        gap: "14px",
        padding: "12px",
        borderRadius: "14px",
        color: "var(--ink)",
        background: row.current ? "var(--teal-soft)" : "transparent",
      }}
      onClick={handleClick}
    >
      <span className={cx("ic-wrap", row.icon)} style={KIND_STYLE}>
        {row.kind}
      </span>
      <span className="col grow">
        <span className="ellipsis" style={{ fontWeight: 600 }}>
          {row.title}
        </span>
        <span className="row t-meta" style={{ gap: "6px" }}>
          <span>{row.format}</span>
          <span>·</span>
          <span className="num">{row.versions}</span>
          {row.time && (
            <>
              <span>·</span>
              <span className="num">{row.time}</span>
            </>
          )}
        </span>
      </span>
      <Icon name="arrow-forward" size="sm" style={{ color: "var(--ink-3)" }} />
    </Link>
  );
}

function DraftsSkeleton() {
  return (
    <div className="col" aria-busy="true" style={{ paddingTop: "14px" }}>
      <ul className="col" style={{ gap: "2px" }}>
        {[0, 1, 2, 3].map((index) => (
          <li key={index} className="row" style={{ gap: "14px", padding: "12px" }}>
            <Skeleton width={42} height={42} radius={12} />
            <span className="col grow" style={{ gap: "6px" }}>
              <RowLines />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Team memory ---------- */

/** DeskArchive's `ai-panel`: «ذاكرة الفريق» and the current rules, each with its switch. */
function MemoryPanel({ memory }: { memory: ArchiveMemoryState }) {
  const now = useNow();
  const session = useSession();
  const base = useId();
  const who = { now, userId: session?.user.id ?? null, userName: session?.user.displayName ?? "", mobile: false };

  return (
    <div
      className="ai-panel"
      style={{ margin: "18px 4px 0", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "none" }}
    >
      <div className="row">
        <span className="ic-wrap ic-wrap--ai">
          <Icon name="memory" />
        </span>
        <div className="col">
          <h3 className="t-head">{ARCHIVE_COPY.memory}</h3>
          <p className="t-meta">{ARCHIVE_COPY.memoryLead}</p>
        </div>
      </div>
      {memory.rules.map((rule) => {
        const textId = `${base}-${rule.id}`;
        return (
          <div
            key={rule.id}
            className="row"
            style={{ alignItems: "flex-start", gap: "12px", padding: "12px 0", borderTop: "1px solid var(--line)" }}
          >
            <span id={textId} className="col grow" style={{ gap: "2px" }}>
              <span style={{ fontSize: "14px", lineHeight: 1.7 }}>{rule.instruction}</span>
              <span className="t-meta">{ruleMeta(rule, who)}</span>
            </span>
            <RuleSwitch rule={rule} describedBy={textId} onToggle={memory.toggle} />
          </div>
        );
      })}
    </div>
  );
}

/** The «ذاكرة الفريق» tab: the suggestions waiting for approval, then the team-memory panel. */
function Memory({ memory }: { memory: ArchiveMemoryState }) {
  if (memory.loading) return <MemorySkeleton />;
  if (memory.error) return <ArchiveError error={memory.error} onRetry={memory.retry} />;
  if (memory.pending.length === 0 && memory.rules.length === 0) return <MemoryEmpty />;
  return (
    <>
      {memory.pending.length > 0 && (
        <>
          <h3 className="t-meta" style={{ padding: "12px 4px 4px", fontWeight: 600 }}>
            {ARCHIVE_COPY.pending}
          </h3>
          <div className="col" style={{ gap: "6px" }}>
            {memory.pending.map((rule) => (
              <SuggestedRule
                key={rule.id}
                rule={rule}
                busy={memory.busyIds.has(rule.id)}
                onSave={(instruction) => memory.save(rule, instruction)}
              />
            ))}
          </div>
        </>
      )}
      {memory.rules.length > 0 && <MemoryPanel memory={memory} />}
    </>
  );
}

function MemorySkeleton() {
  return (
    <div
      className="ai-panel"
      aria-busy="true"
      style={{ margin: "18px 4px 0", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "none" }}
    >
      <div className="row">
        <span className="ic-wrap ic-wrap--ai">
          <Icon name="memory" />
        </span>
        <div className="col">
          <h3 className="t-head">{ARCHIVE_COPY.memory}</h3>
          <p className="t-meta">{ARCHIVE_COPY.memoryLead}</p>
        </div>
      </div>
      {[0, 1, 2].map((index) => (
        <div key={index} className="col" style={{ gap: "6px", padding: "12px 0", borderTop: "1px solid var(--line)" }}>
          <RowLines />
        </div>
      ))}
    </div>
  );
}
