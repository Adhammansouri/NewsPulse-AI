// Mobile: the headlines as the editor left them for a story screen (S05 §3: «رجوع» returns to the list with
// its scroll and search; the filters live in the URL). Kept for the page that comes back to the list.
export type ListMemory = { query: string; scrollTop: number };

let saved: ListMemory | null = null;

export function rememberList(memory: ListMemory) {
  saved = memory;
}

/** What to restore on a return to the list (history back); read without side effects (render-safe). */
export function peekListMemory(): ListMemory | null {
  return saved;
}

export function forgetList() {
  saved = null;
}
