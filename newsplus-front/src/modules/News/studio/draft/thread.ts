// The editor's thread (Main / DeskDraft aside, MobDraft inline) from the conversation's stored messages:
// - the first version's messages («توليد …» and the opening note) give way to Main's opening line (desktop);
// - a revision is the editor's request (`msg--me`) and the model's note (`msg--ai`) + «النسخة {n} محفوظة.»;
// - a restore (the API's «أُعيدت النسخة {n}» version) is a `msg--sys` line «رجعت للنسخة ١», and back-to-back
//   restores read «رجعت للنسخة ١ ثم عدت للنسخة ٢» (DeskDraft).
import type { EditorialConversationDetail, NewsSummaryFormat } from "@newsplus/shared";
import { DRAFT_COPY } from "./copy";

export type ThreadTurn = { key: string; kind: "me" | "ai" | "sys"; text: string };

const RESTORED = /^أُعيدت النسخة (\d+)$/;

export function threadTurns(
  detail: EditorialConversationDetail | undefined,
  { format, rules, opening }: { format: NewsSummaryFormat; rules: number; opening: boolean },
): ThreadTurn[] {
  const turns: ThreadTurn[] = opening ? [{ key: "opening", kind: "ai", text: DRAFT_COPY.opening(format, rules) }] : [];
  if (!detail) return turns;
  const versions = new Map(detail.versions.map((version) => [version.id, version]));
  let restores: number[] = [];
  let restoreKey = "";

  const flushRestores = () => {
    if (restores.length === 0) return;
    const [first, ...rest] = restores;
    const text = [DRAFT_COPY.restoredTo(first), ...rest.map((n) => DRAFT_COPY.thenBackTo(n))].join(" ");
    turns.push({ key: restoreKey, kind: "sys", text });
    restores = [];
  };

  for (const message of detail.messages) {
    const version = message.versionId ? versions.get(message.versionId) : undefined;
    if (!version || version.number <= 1) continue;
    if (message.role === "assistant") {
      const restored = RESTORED.exec(version.note.trim());
      if (restored && message.content.trim() === version.note.trim()) {
        if (restores.length === 0) restoreKey = message.id;
        restores.push(Number(restored[1]));
        continue;
      }
      flushRestores();
      const note = message.content.trim();
      const saved = DRAFT_COPY.versionSaved(version.number);
      turns.push({ key: message.id, kind: "ai", text: note ? `${note} ${saved}` : saved });
    } else if (message.role === "user") {
      flushRestores();
      turns.push({ key: message.id, kind: "me", text: message.content });
    }
  }
  flushRestores();
  return turns;
}
