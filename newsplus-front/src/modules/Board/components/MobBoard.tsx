// MobNewQueue (S15 §3) — port of docs/redesign/design/reference/MobNewQueue.dc.html, reached from «المزيد» →
// «سير العمل». Inline styles are the board's own. The tab bar comes from the shell (`/board` is a tab screen).
import { useState } from "react";
import { Link } from "react-router-dom";
import type { EditorialWorkflowStatus, PresenceEntry } from "@newsplus/shared";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { chipClassName } from "@/ui/Chip";
import { Icon } from "@/ui/Icon";
import { Notice } from "@/ui/Notice";
import { Skeleton } from "@/ui/Skeleton";
import { toArabicDigits } from "@/utils/arabic";
import {
  boardTime,
  COLUMNS,
  formatBadge,
  initialOf,
  onlineMembers,
  teammateWriting,
  writersByConversation,
  writingLine,
  type BoardData,
} from "../boardModel";

const ROW_STYLE = { minHeight: "76px" } as const;
const LIVE_ROW_STYLE = { minHeight: "76px", background: "var(--cyan-soft)" } as const;
const BADGE_STYLE = { height: "20px", fontSize: "11px" } as const;
const SKELETON_ROWS = 3;

export type MobBoardProps = {
  data: BoardData | undefined;
  error: string | null;
  onRetry: () => void;
  presence: readonly PresenceEntry[];
  viewerId: string | undefined;
  now: Date;
};

export function MobBoard({ data, error, onRetry, presence, viewerId, now }: MobBoardProps) {
  const [status, setStatus] = useState<EditorialWorkflowStatus>("draft");
  const online = onlineMembers(presence);
  const writers = writersByConversation(presence);
  const rows = data?.columns[status] ?? [];
  const notice = teammateWriting(presence, data, viewerId);

  return (
    <>
      <header className="m-head" style={{ gap: "12px", borderBottom: "1px solid var(--line)" }}>
        <div className="m-head__row">
          <span className="m-title">سير العمل</span>
          {online.length > 0 && (
            <span className="avas">
              {online.map((member) => (
                <span key={member.id} className="ava" style={{ background: member.color }}>
                  {initialOf(member.displayName)}
                </span>
              ))}
            </span>
          )}
        </div>
        <div className="scroll-x" style={{ marginInline: "-20px", paddingInline: "20px" }}>
          {COLUMNS.map((column) => (
            <button
              key={column.status}
              className={chipClassName({ size: "sm" })}
              type="button"
              aria-pressed={column.status === status}
              onClick={() => setStatus(column.status)}
            >
              {column.label}
              {data && <span className="n">{toArabicDigits(data.counts[column.status])}</span>}
            </button>
          ))}
        </div>
      </header>
      <main className="m-scroll col" style={{ padding: "12px 16px", gap: "10px" }} aria-busy={(!data && !error) || undefined}>
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
        ) : !data ? (
          <div className="m-list" aria-hidden="true">
            {Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <div key={index} className="m-item" style={ROW_STYLE}>
                <Skeleton width={26} height={26} radius="50%" />
                <span className="m-item__label" style={{ gap: "6px" }}>
                  <Skeleton width={56} height={20} radius={7} />
                  <Skeleton height={14} width="75%" />
                  <Skeleton height={12} width="30%" />
                </span>
              </div>
            ))}
          </div>
        ) : (
          rows.length > 0 && (
            <div className="m-list">
              {rows.map((card) => {
                const writer = writers.get(card.id);
                return (
                  <Link
                    key={card.id}
                    className="m-item"
                    to="/news"
                    state={{ conversationId: card.id }}
                    style={writer ? LIVE_ROW_STYLE : ROW_STYLE}
                  >
                    {card.assignee && (
                      <span className="ava" style={{ background: card.assignee.color }}>
                        {initialOf(card.assignee.displayName)}
                      </span>
                    )}
                    <span className="m-item__label">
                      <span className="row" style={{ gap: "6px" }}>
                        <Badge variant="ai" style={BADGE_STYLE}>
                          {formatBadge(card.format)}
                        </Badge>
                      </span>
                      <span className="ellipsis" style={{ marginTop: "4px" }}>
                        {card.title}
                      </span>
                      {writer ? (
                        <span className="row" style={{ gap: "6px", fontSize: "12px", color: "var(--cyan)" }}>
                          <span className="typing">
                            <i />
                            <i />
                            <i />
                          </span>
                          {writingLine(writer.displayName)}
                        </span>
                      ) : (
                        <span className="t-meta">{boardTime(card.updatedAt, now)}</span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          )
        )}
        {notice && (
          <Notice
            variant="info"
            style={{ fontSize: "13.5px" }}
            icon={<Icon name="layers" size="sm" style={{ color: "var(--cyan)", marginTop: "3px" }} />}
          >
            {notice.name} بتكتب عن «{notice.headline}». لو فتحت نفس الخبر هيظهرلك تنبيه عشان ما تكرروش الشغل.
          </Notice>
        )}
      </main>
    </>
  );
}
