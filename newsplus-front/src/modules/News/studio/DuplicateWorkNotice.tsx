// S15 §4: a teammate is writing about the open story. Above the format deck, `notice--info` «{name} بتكتب عن
// «{headline}». لو كتبت عنه كمان هتكرروا الشغل.» with «افتح مسودتها» (their draft, when presence names it) and
// «اكتب برضه» (hides the notice for this story). No board draws it: copy from the sprint, the notice as the boards'
// other info notices.
import { useState, type CSSProperties } from "react";
import { useTeammatesWriting } from "@/hooks/useTeamPresence";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Notice } from "@/ui/Notice";

const COPY = {
  text: (name: string, headline: string) => `${name} بتكتب عن «${headline}». لو كتبت عنه كمان هتكرروا الشغل.`,
  openDraft: "افتح مسودتها",
  writeAnyway: "اكتب برضه",
} as const;

export function DuplicateWorkNotice({
  itemId,
  headline,
  onOpenDraft,
  stacked = false,
  style,
}: {
  itemId: string;
  headline: string;
  onOpenDraft: (conversationId: string) => void;
  /** Mobile: the buttons under the text instead of beside it (the 390px column is too narrow for both). */
  stacked?: boolean;
  /** Placement (the screen's spacing above the deck). */
  style?: CSSProperties;
}) {
  const writers = useTeammatesWriting(itemId);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const mate = writers.find((entry) => entry.conversationId) ?? writers[0];
  if (!mate || dismissed === itemId) return null;
  const conversationId = mate.conversationId;
  const text = COPY.text(mate.user.displayName, headline);
  const actions = (
    <span className="row" style={{ gap: "6px" }}>
      {conversationId && (
        <Button variant="quiet" size="sm" onClick={() => onOpenDraft(conversationId)}>
          {COPY.openDraft}
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={() => setDismissed(itemId)}>
        {COPY.writeAnyway}
      </Button>
    </span>
  );

  return (
    <Notice
      variant="info"
      role="status"
      style={{ fontSize: "13.5px", alignItems: "flex-start", ...style }}
      icon={<Icon name="user" size="sm" style={{ color: "var(--cyan)", marginTop: "3px" }} />}
      textClassName="col grow"
      action={stacked ? undefined : actions}
    >
      {stacked ? (
        <>
          <span>{text}</span>
          <span style={{ marginTop: "8px" }}>{actions}</span>
        </>
      ) : (
        text
      )}
    </Notice>
  );
}
