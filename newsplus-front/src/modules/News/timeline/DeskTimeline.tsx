// NewTimeline: the story's «تطور القصة» tab on desktop — the timeline panel (title, «٤ تحديثات خلال …», the `tl` list,
// and «فيه تحديث جديد من …» + «حدّث المسودة» when the editor's draft is older than the newest update), the conflict
// cards, «اللي متفق عليه» and «اكتب من القصة كاملة». Inline styles are the board's own.
import type { TimelineData } from "@newsplus/shared";
import { useAiCooldown } from "@/hooks/useAiCooldown";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Skeleton } from "@/ui/Skeleton";
import { SourceMark } from "@/ui/SourceMarks";
import { StudioError } from "../studio/StudioError";
import { DeskConflictCard } from "./ConflictCard";
import { sinceDraft, TIMELINE_COPY } from "./copy";
import { conflictViews, timelineView, type SourceLookup } from "./timelineModel";

const GRID = {
  display: "grid",
  gridTemplateColumns: "1.25fr 1fr",
  gap: "22px",
  padding: "18px 30px",
  // The board's `overflow: hidden` clips a long timeline; real stories scroll instead.
  overflowY: "auto",
  minHeight: 0,
} as const;
const TAG_STYLE = { height: "20px", fontSize: "11px" } as const;
const HEADLINE_STYLE = { marginTop: "4px", fontWeight: 600, fontSize: "15px", lineHeight: 1.6 } as const;
const CHECK_STYLE = { color: "var(--ok)", marginTop: "3px" } as const;

export type DraftUpdate = { source: string; draftAt: string; onUpdate: () => void };

export function DeskTimeline({
  itemId,
  title,
  data,
  error,
  onRetry,
  lookup,
  draftUpdate,
  onWrite,
}: {
  itemId: string;
  /** The story's headline (the panel title). */
  title: string;
  data: TimelineData | undefined;
  error: unknown;
  onRetry: () => void;
  lookup: SourceLookup;
  /** The editor's draft predates the newest update. */
  draftUpdate: DraftUpdate | null;
  /** «اكتب من القصة كاملة»: generate in the chosen format, with this story's constraints. */
  onWrite: () => void;
}) {
  const cooldown = useAiCooldown();
  if (!data) {
    return (
      <div className="grow" style={GRID}>
        {error ? (
          <StudioError error={error} onRetry={onRetry} />
        ) : (
          <section className="panel col" style={{ padding: "22px 24px", gap: "14px" }} aria-busy="true" aria-label={TIMELINE_COPY.panelLabel}>
            <Skeleton height="28px" width="85%" />
            <Skeleton height="12px" width="40%" />
            {[0, 1, 2].map((row) => (
              <div key={row} className="col" style={{ gap: "8px", marginTop: "6px" }}>
                <Skeleton height="14px" width="30%" />
                <Skeleton height="14px" width="80%" />
              </div>
            ))}
          </section>
        )}
      </div>
    );
  }

  const view = timelineView(data, lookup);
  const conflicts = conflictViews(data, lookup);
  return (
    <div className="grow" style={GRID}>
      <section className="panel col" style={{ padding: "22px 24px", gap: "14px" }} aria-label={TIMELINE_COPY.panelLabel}>
        <div className="col">
          <h2 className="t-title">{title}</h2>
          {view.meta && <p className="t-meta">{view.meta}</p>}
        </div>
        {view.rows.length > 0 && (
          <div className="tl">
            {view.rows.map((row) => (
              <div key={row.key} className={`tl__item ${row.dot}`}>
                <span className="tl__time">{row.time}</span>
                <div className="tl__body">
                  <span className="tl__dot" />
                  <div className="row" style={{ gap: "8px" }}>
                    <SourceMark ch={row.source.mark.ch} bg={row.source.mark.bg} />
                    <b style={{ fontSize: "13px", color: "var(--ink-2)" }}>{row.source.name}</b>
                    {row.tag && (
                      <span className="badge badge--topic" style={TAG_STYLE}>
                        {row.tag}
                      </span>
                    )}
                  </div>
                  <p style={HEADLINE_STYLE}>{row.headline}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {draftUpdate && (
          <div className="ai-panel row" style={{ padding: "12px 14px", gap: "12px", boxShadow: "none" }}>
            <span className="ic-wrap ic-wrap--ai" style={{ width: "30px", height: "30px", borderRadius: "9px" }}>
              <Icon name="sparkle" size="sm" />
            </span>
            <span className="grow t-small">
              {TIMELINE_COPY.draftUpdate(draftUpdate.source, sinceDraft(Date.now() - Date.parse(draftUpdate.draftAt)))}
            </span>
            <Button variant="ai" size="sm" disabled={cooldown.active} onClick={draftUpdate.onUpdate}>
              {TIMELINE_COPY.updateDraft}
            </Button>
          </div>
        )}
      </section>
      <section className="col" style={{ gap: "16px" }}>
        {conflicts.map((conflict) => (
          <DeskConflictCard key={`${itemId}-${conflict.key}`} itemId={itemId} view={conflict} />
        ))}
        {data.agreed.length > 0 && (
          <div className="panel col" style={{ padding: "18px 20px", gap: "10px" }}>
            <b style={{ fontWeight: 600 }}>{TIMELINE_COPY.agreed}</b>
            <ul className="col" style={{ gap: "8px" }}>
              {data.agreed.map((fact) => (
                <li key={fact.text} className="row t-small" style={{ alignItems: "flex-start" }}>
                  <Icon name="check" size="sm" style={CHECK_STYLE} />
                  {TIMELINE_COPY.agreedRow(fact.text, fact.sourceCount)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button variant="ai" size="lg" disabled={cooldown.active} onClick={onWrite}>
          <Icon name="sparkle" size="sm" />
          {TIMELINE_COPY.writeFullStory}
        </Button>
      </section>
    </div>
  );
}
