// NewBoard (S15 §2) — port of docs/redesign/design/reference/NewBoard.dc.html. The board's `main` is a div here:
// the shell already renders the content `<main>`. Inline styles are the board's own, except the scroll noted below.
import { useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import type { EditorialWorkflowStatus, PresenceEntry } from "@newsplus/shared";
import { Badge } from "@/ui/Badge";
import { Button, buttonClassName } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Notice } from "@/ui/Notice";
import { Segmented, type SegmentedOption } from "@/ui/Segmented";
import { Skeleton } from "@/ui/Skeleton";
import { toArabicDigits } from "@/utils/arabic";
import { COLUMNS, findCard, initialOf, onlineMembers, writersByConversation, type BoardData, type BoardScope } from "../boardModel";
import { KanbanCard } from "./KanbanCard";

const SCOPE_OPTIONS: ReadonlyArray<SegmentedOption<BoardScope>> = [
  { value: "team", label: "الفريق" },
  { value: "mine", label: "مسوداتي" },
];

/** Skeleton cards per column while the board loads (shaped like `kcard`). */
const SKELETON_CARDS = 2;

export type DeskBoardProps = {
  scope: BoardScope;
  onScopeChange: (scope: BoardScope) => void;
  data: BoardData | undefined;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  presence: readonly PresenceEntry[];
  now: Date;
  focusId: string | null;
  onOpen: (id: string) => void;
  onMove: (id: string, to: EditorialWorkflowStatus, viaKeyboard: boolean) => void;
};

export function DeskBoard(props: DeskBoardProps) {
  const { scope, onScopeChange, data, loading, error, onRetry, presence, now, focusId, onOpen, onMove } = props;
  const [dragId, setDragId] = useState<string | null>(null);
  const online = onlineMembers(presence);
  const writers = writersByConversation(presence);

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (!dragId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: DragEvent<HTMLElement>, status: EditorialWorkflowStatus) {
    event.preventDefault();
    const id = dragId ?? event.dataTransfer.getData("text/plain");
    setDragId(null);
    const card = data && id ? findCard(data, id) : undefined;
    if (card && card.status !== status) onMove(card.id, status, false);
  }

  return (
    // Board: `overflow:hidden` on a fixed 900px frame; real columns can outgrow the screen, so the page scrolls.
    <div className="grow col" style={{ padding: "26px 34px", gap: "18px", background: "var(--bg)", overflowY: "auto" }}>
      <header className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div className="col">
          <h1 className="t-hero" style={{ fontSize: "30px" }}>
            سير العمل
          </h1>
          <p className="t-meta">كل مسودات الفريق من الكتابة للنشر · مفيش اتنين بيكتبوا نفس الخبر</p>
        </div>
        <div className="row">
          {online.length > 0 && (
            <>
              <span className="avas">
                {online.map((member) => (
                  <span key={member.id} className="ava" style={{ background: member.color }}>
                    {initialOf(member.displayName)}
                  </span>
                ))}
              </span>
              <span className="t-meta">{toArabicDigits(online.length)} أونلاين</span>
            </>
          )}
          <Segmented options={SCOPE_OPTIONS} value={scope} onChange={onScopeChange} style={{ marginInlineStart: "10px" }} />
          <Link className={buttonClassName({ variant: "ai", size: "sm" })} to="/news">
            <Icon name="sparkle" size="sm" />
            مسودة من خبر
          </Link>
        </div>
      </header>

      {error && !data ? (
        <Notice
          variant="error"
          role="alert"
          style={{ alignItems: "center" }}
          icon={
            <span className="ic-wrap ic-wrap--breaking" style={{ background: "var(--surface)" }}>
              <Icon name="refresh" />
            </span>
          }
          textClassName="t-small grow"
          action={
            <Button variant="quiet" size="sm" onClick={onRetry}>
              حاول تاني
            </Button>
          }
        >
          {error}
        </Notice>
      ) : (
        <div className="kanban" aria-busy={loading || undefined}>
          {COLUMNS.map(({ status, label }) => (
            <section
              key={status}
              className="kcol"
              aria-label={label}
              onDragOver={handleDragOver}
              onDrop={(event) => handleDrop(event, status)}
            >
              <div className="kcol__head">
                <span>{label}</span>
                {data && <Badge variant="topic">{toArabicDigits(data.counts[status])}</Badge>}
              </div>
              {data
                ? data.columns[status].map((card) => (
                    <KanbanCard
                      key={card.id}
                      card={card}
                      writer={writers.get(card.id)}
                      now={now}
                      autoFocus={focusId === card.id}
                      onOpen={onOpen}
                      onMove={(id, to) => onMove(id, to, true)}
                      onDragStart={setDragId}
                      onDragEnd={() => setDragId(null)}
                    />
                  ))
                : Array.from({ length: SKELETON_CARDS }, (_, index) => <CardSkeleton key={index} />)}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="kcard" aria-hidden="true">
      <span className="row" style={{ justifyContent: "space-between" }}>
        <Skeleton width={56} height={22} radius={7} />
        <Skeleton width={26} height={26} radius="50%" />
      </span>
      <Skeleton height={14} width="80%" />
      <Skeleton height={12} width="40%" />
    </div>
  );
}
