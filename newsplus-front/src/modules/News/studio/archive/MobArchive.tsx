// MobArchive / MobArchive-memory (S06 §7): the archive as its own mobile screen — `m-head` (back, «الأرشيف»,
// search, the «المسودات / ذاكرة الفريق» tabs); the drafts by day in `m-list`s, or the team memory (intro, the
// suggestions to approve, the current rules with their switches). Port of docs/redesign/design/reference/
// MobArchive.dc.html; inline styles are the board's own. A draft opens the way the app opens a conversation:
// /news with `{ conversationId }` (NewsPage hands it to the story's screen).
import { Fragment, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { MobBackLink } from "@/components/shell/MobBackLink";
import { useNow } from "@/hooks/useNow";
import { useSession } from "@/hooks/useSession";
import { buttonClassName } from "@/ui/Button";
import { cx } from "@/ui/cx";
import { Icon } from "@/ui/Icon";
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
import { ARCHIVE_COPY, archiveGroups, rowMeta, ruleMeta, type ArchiveTab } from "./archiveModel";
import { useArchiveDrafts, useArchiveMemory, useLatestDraftId, type ArchiveDrafts, type ArchiveMemoryState } from "./useArchive";

const SECTION_STYLE = { padding: "12px 4px 4px", fontWeight: 600 } as const;
const KIND_STYLE = { width: "42px", height: "42px", borderRadius: "12px", fontSize: "10.5px", fontWeight: 700 } as const;
const RULE_ITEM_STYLE = { minHeight: "84px", alignItems: "flex-start", paddingTop: "14px", paddingBottom: "14px" } as const;
const RULE_TEXT_STYLE = { fontWeight: 500, fontSize: "14px", lineHeight: 1.7 } as const;

export function MobArchive({ tab, onTab }: { tab: ArchiveTab; onTab: (tab: ArchiveTab) => void }) {
  const ids = useArchiveTabIds();
  const searchRef = useRef<HTMLInputElement>(null);
  const drafts = useArchiveDrafts();
  const memory = useArchiveMemory();

  return (
    <>
      <header className="m-head" style={{ gap: "12px", borderBottom: "1px solid var(--line)" }}>
        <div className="m-head__row">
          <MobBackLink />
          <span className="m-title">{ARCHIVE_COPY.title}</span>
        </div>
        <ArchiveSearch label={ARCHIVE_COPY.searchMob} value={drafts.search} onChange={drafts.setSearch} inputRef={searchRef} />
        <ArchiveTabs
          tab={tab}
          onTab={onTab}
          drafts={drafts.loading || drafts.error ? null : drafts.items.length}
          memory={memory.loading || memory.error ? null : memory.rules.length}
          ids={ids}
        />
      </header>
      <main
        className="m-scroll col"
        id={ids.panel}
        role="tabpanel"
        aria-labelledby={ids.tab(tab)}
        style={{ padding: "8px 16px 24px", gap: "6px" }}
      >
        {tab === "memory" ? (
          <Memory memory={memory} />
        ) : (
          <Drafts
            drafts={drafts}
            onClear={() => {
              drafts.setSearch("");
              searchRef.current?.focus();
            }}
          />
        )}
      </main>
    </>
  );
}

/* ---------- Drafts ---------- */

function Drafts({ drafts, onClear }: { drafts: ArchiveDrafts; onClear: () => void }) {
  const now = useNow();
  const latestId = useLatestDraftId();
  if (drafts.loading) return <DraftsSkeleton />;
  if (drafts.error) return <ArchiveError error={drafts.error} onRetry={drafts.retry} />;
  if (drafts.items.length === 0) {
    if (drafts.searching) return <DraftsSkeleton />;
    if (drafts.q) return <NoResultsEmpty onClear={onClear} />;
    return (
      <FirstDraftEmpty
        action={
          <Link className={buttonClassName({ variant: "ai", size: "sm" })} to="/news">
            {ARCHIVE_COPY.openHeadlines}
          </Link>
        }
      />
    );
  }

  // No studio behind this screen: the newest draft carries the AI mark.
  const groups = archiveGroups(drafts.items, { now, currentId: latestId, mobile: true });
  return (
    <>
      {groups.map((group) => (
        <Fragment key={group.key}>
          <h2 className="t-meta" style={SECTION_STYLE}>
            {group.label}
          </h2>
          <div className="m-list">
            {group.rows.map((row) => (
              <Link
                key={row.id}
                className="m-item"
                to="/news"
                state={{ conversationId: row.id }}
                style={{ minHeight: "72px" }}
              >
                <span className={cx("ic-wrap", row.icon)} style={KIND_STYLE}>
                  {row.kind}
                </span>
                <span className="m-item__label">
                  <span className="ellipsis">{row.title}</span>
                  <small>{rowMeta(row)}</small>
                </span>
                <Icon name="arrow-forward" className="chev" />
              </Link>
            ))}
          </div>
        </Fragment>
      ))}
    </>
  );
}

function DraftsSkeleton() {
  return (
    <div className="m-list" aria-busy="true" style={{ marginTop: "8px" }}>
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="m-item" style={{ minHeight: "72px" }}>
          <Skeleton width={42} height={42} radius={12} />
          <span className="m-item__label" style={{ gap: "6px" }}>
            <RowLines />
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Team memory ---------- */

function Memory({ memory }: { memory: ArchiveMemoryState }) {
  const now = useNow();
  const session = useSession();
  const base = useId();
  if (memory.loading) return <MemorySkeleton />;
  if (memory.error) return <ArchiveError error={memory.error} onRetry={memory.retry} />;
  if (memory.pending.length === 0 && memory.rules.length === 0) return <MemoryEmpty />;
  const who = { now, userId: session?.user.id ?? null, userName: session?.user.displayName ?? "", mobile: true };

  return (
    <>
      <Intro />
      {memory.pending.length > 0 && (
        <>
          <h2 className="t-meta" style={SECTION_STYLE}>
            {ARCHIVE_COPY.pending}
          </h2>
          {memory.pending.map((rule) => (
            <SuggestedRule
              key={rule.id}
              rule={rule}
              busy={memory.busyIds.has(rule.id)}
              onSave={(instruction) => memory.save(rule, instruction)}
            />
          ))}
        </>
      )}
      {memory.rules.length > 0 && (
        <>
          <h2 className="t-meta" style={{ padding: "14px 4px 4px", fontWeight: 600 }}>
            {ARCHIVE_COPY.currentRules}
          </h2>
          <div className="m-list">
            {memory.rules.map((rule) => {
              const textId = `${base}-${rule.id}`;
              return (
                <div key={rule.id} className="m-item" style={RULE_ITEM_STYLE}>
                  <span id={textId} className="m-item__label" style={RULE_TEXT_STYLE}>
                    {rule.instruction}
                    <small>{ruleMeta(rule, who)}</small>
                  </span>
                  <RuleSwitch rule={rule} describedBy={textId} onToggle={memory.toggle} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

/** «المحرّر بيتعلّم من تعديلاتكم». */
function Intro() {
  return (
    <div className="ai-panel col" style={{ padding: "14px 16px", gap: "6px", boxShadow: "none", marginTop: "8px" }}>
      <span className="ai-mark t-ai">{ARCHIVE_COPY.learning}</span>
      <p className="t-small">{ARCHIVE_COPY.learningText}</p>
    </div>
  );
}

function MemorySkeleton() {
  return (
    <>
      <Intro />
      <div className="m-list" aria-busy="true" style={{ marginTop: "8px" }}>
        {[0, 1, 2].map((index) => (
          <div key={index} className="m-item" style={RULE_ITEM_STYLE}>
            <span className="m-item__label" style={{ gap: "6px" }}>
              <RowLines />
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
