export type DeskHandoffState = {
  input?: string;
  prompt?: string;
  source?: string;
  itemId?: string;
  style?: "brief" | "article" | "report";
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
  if (!input && !prompt && !source && !itemId && !style) return null;
  return { input, prompt, source, itemId, style };
}
