export type DeskHandoffState = {
  input?: string;
  prompt?: string;
  source?: string;
  itemId?: string;
  style?: "brief" | "article" | "report";
  /** An editorial conversation to open in the news studio (generate/translate → «منشور سوشيال»). */
  conversationId?: string;
  /** Home «حوّله لموجز صباحي» (S13): start the briefing on arrival; the digest's items are already pinned. */
  briefing?: boolean;
};

export function readDeskHandoff(state: unknown): DeskHandoffState | null {
  if (!state || typeof state !== "object") return null;
  const value = state as DeskHandoffState;
  const input = typeof value.input === "string" ? value.input : undefined;
  const prompt = typeof value.prompt === "string" ? value.prompt : undefined;
  const source = typeof value.source === "string" ? value.source : undefined;
  const itemId = typeof value.itemId === "string" ? value.itemId : undefined;
  const style =
    value.style === "brief" || value.style === "article" || value.style === "report" ? value.style : undefined;
  const conversationId = typeof value.conversationId === "string" ? value.conversationId : undefined;
  const briefing = value.briefing === true ? true : undefined;
  if (!input && !prompt && !source && !itemId && !style && !conversationId && !briefing) return null;
  return { input, prompt, source, itemId, style, conversationId, ...(briefing ? { briefing } : {}) };
}
