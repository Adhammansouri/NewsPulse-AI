// «المصادر مختلفة في رقم» — NewTimeline (both values with their marks, the safe wording, «اعتمد …» per value and
// «اذكر الرقمين بالإسناد») and MobNewTimeline (the values and «اذكر الرقمين بالإسناد» only). The choice is saved as
// this story's constraint (constraints.ts) and goes with every generation of the story. Inline styles are the
// boards' own.
import { useState } from "react";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { SourceMark } from "@/ui/SourceMarks";
import { constraintText, readChoice, saveConstraint, type ConflictChoice } from "./constraints";
import { TIMELINE_COPY } from "./copy";
import type { ConflictView } from "./timelineModel";

const CARD_DESK = {
  padding: "18px 20px",
  gap: "12px",
  borderColor: "var(--warn-dot)",
  boxShadow: "0 0 0 3px var(--warn-soft)",
} as const;
const CARD_MOB = { padding: "14px", gap: "10px", borderColor: "var(--warn-dot)", boxShadow: "0 0 0 3px var(--warn-soft)" } as const;
const VALUE_DESK = { padding: "12px", gap: "4px", boxShadow: "none", background: "var(--surface-2)" } as const;
const VALUE_MOB = { padding: "10px", gap: "2px", boxShadow: "none", background: "var(--surface-2)" } as const;

/** The saved choice for this conflict and how to change it. */
function useChoice(itemId: string, view: ConflictView) {
  const field = view.conflict.field;
  const [saved, setSaved] = useState(() => readChoice(itemId, field));
  const name = (sourceId: string) => view.values.find((entry) => entry.sourceId === sourceId)?.source.name ?? sourceId;
  const textFor = (choice: ConflictChoice) => constraintText(view.conflict, choice, name);
  return {
    isChosen: (choice: ConflictChoice) => saved !== "" && saved === textFor(choice),
    choose(choice: ConflictChoice) {
      const text = textFor(choice);
      if (!text) return;
      saveConstraint(itemId, field, text);
      setSaved(text);
    },
  };
}

export function DeskConflictCard({ itemId, view }: { itemId: string; view: ConflictView }) {
  const { isChosen, choose } = useChoice(itemId, view);
  const attribute: ConflictChoice = { kind: "attribute" };
  return (
    <div className="panel col" style={CARD_DESK}>
      <div className="row">
        <Icon name="warning" style={{ color: "var(--warn)" }} />
        <b style={{ fontWeight: 600 }}>{TIMELINE_COPY.conflictTitle}</b>
      </div>
      <p className="t-small">{TIMELINE_COPY.conflictLead(view.conflict.field, view.values.length)}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {view.values.map((entry) => (
          <div key={entry.sourceId} className="panel col" style={VALUE_DESK}>
            <span className="row" style={{ gap: "6px" }}>
              <SourceMark ch={entry.source.mark.ch} bg={entry.source.mark.bg} />
              <span className="t-meta">{entry.source.name}</span>
            </span>
            <b className="t-num" style={{ fontSize: "24px" }}>
              {entry.value}
            </b>
          </div>
        ))}
      </div>
      <p className="t-meta">{TIMELINE_COPY.safeWording(view.conflict.safeWording)}</p>
      <div className="row" style={{ flexWrap: "wrap", gap: "6px" }}>
        {view.values.map((entry) => {
          const choice: ConflictChoice = { kind: "adopt", sourceId: entry.sourceId };
          return (
            <Button key={entry.sourceId} variant="quiet" size="sm" aria-pressed={isChosen(choice)} onClick={() => choose(choice)}>
              {TIMELINE_COPY.adopt(entry.value)}
            </Button>
          );
        })}
        <Button variant="ink" size="sm" aria-pressed={isChosen(attribute)} onClick={() => choose(attribute)}>
          {TIMELINE_COPY.attributeBoth}
        </Button>
      </div>
    </div>
  );
}

export function MobConflictCard({ itemId, view }: { itemId: string; view: ConflictView }) {
  const { isChosen, choose } = useChoice(itemId, view);
  const attribute: ConflictChoice = { kind: "attribute" };
  return (
    <div className="panel col" style={CARD_MOB}>
      <div className="row">
        <Icon name="warning" style={{ color: "var(--warn)" }} />
        <b style={{ fontWeight: 600 }}>{TIMELINE_COPY.conflictTitleMob(view.conflict.field)}</b>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {view.values.map((entry) => (
          <div key={entry.sourceId} className="panel col" style={VALUE_MOB}>
            <span className="t-meta">{entry.source.name}</span>
            <b className="t-num" style={{ fontSize: "20px" }}>
              {entry.value}
            </b>
          </div>
        ))}
      </div>
      <Button variant="ink" size="sm" aria-pressed={isChosen(attribute)} onClick={() => choose(attribute)}>
        {TIMELINE_COPY.attributeBoth}
      </Button>
    </div>
  );
}
