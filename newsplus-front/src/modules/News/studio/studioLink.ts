// Links into the studio. Desktop opens a story in the 3-column page with `?item=`; mobile opens it as its own
// screen, `/news/:itemId` (S05 §3), and /news redirects a mobile `?item=` there. The router state carries what
// the screen needs on arrival.
import type { NewsFeedItem } from "@newsplus/shared";

export type StudioLinkState = {
  /** «افتح» on the «المسودة جاهزة» toast: show that finished run as the draft. */
  draftRunId?: number;
  /** An archived conversation to open (archive drawer, generate/translate hand-off). */
  conversationId?: string;
  /** Opened from the mobile list: «رجوع» goes back in history (scroll and filters intact). */
  fromList?: boolean;
  /** The list's filters (`?time=…`) to return to when there is no list entry to go back to. */
  listSearch?: string;
  /** The row as it was tapped: the story stays readable if the feed has moved on. */
  item?: NewsFeedItem;
  /** Swipe «اكتب منشور»: start the social post on arrival. */
  write?: "social";
};

/** The studio of a story (or the newsroom alone for the briefing): `/news?item=…`. */
export function studioLink(itemId: string | null): string {
  return itemId ? `/news?item=${encodeURIComponent(itemId)}` : "/news";
}

/** The mobile story screen. */
export function storyPath(itemId: string): string {
  return `/news/${encodeURIComponent(itemId)}`;
}

function isFeedItem(value: unknown): value is NewsFeedItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<NewsFeedItem>;
  return typeof item.id === "string" && typeof item.title === "string" && Array.isArray(item.sources);
}

export function readStudioLinkState(state: unknown): StudioLinkState {
  if (!state || typeof state !== "object") return {};
  const value = state as Record<string, unknown>;
  return {
    draftRunId: typeof value.draftRunId === "number" ? value.draftRunId : undefined,
    conversationId: typeof value.conversationId === "string" ? value.conversationId : undefined,
    fromList: value.fromList === true ? true : undefined,
    listSearch: typeof value.listSearch === "string" ? value.listSearch : undefined,
    item: isFeedItem(value.item) ? value.item : undefined,
    write: value.write === "social" ? "social" : undefined,
  };
}
