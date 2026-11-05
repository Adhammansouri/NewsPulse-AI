// S11: what a shortcut does depends on the screen. A screen registers the handlers it owns while it is on screen
// (`useHotkeyActions`): the wire column its headline keys, the format deck `F 1–7`, an open draft `C` and `P`,
// the newsroom what the command palette needs. The global layer (useHotkeys / Hotkeys.tsx) looks a handler up
// when its key is pressed — with nothing registered the key does nothing, so a shortcut only works where its
// button is.
import { useEffect, useRef } from "react";
import type { NewsFeedItem } from "@newsplus/shared";

/** The social formats the palette writes at once (NewCmdK «أفعال بالمحرّر»). */
export type PaletteFormat = "social" | "video";

/** The newsroom as the command palette uses it (registered by /news on desktop). */
export type NewsroomBridge = {
  /** The story open in the studio. */
  story: NewsFeedItem | null;
  /** A headline picked in the palette: the studio opens it. */
  openItem: (item: NewsFeedItem) => void;
  /** A draft picked in the palette: the studio opens the conversation. */
  openDraft: (conversationId: string) => void;
  /** «اكتب منشور سوشيال عن …» / «سكريبت فيديو عن …» for a story: written at once. */
  writeStory: (item: NewsFeedItem, format: PaletteFormat) => void;
  /** «موجز الساعة». */
  briefing: () => void;
};

export type HotkeyHandlers = {
  /** `/` — focus the wire search. */
  search: () => void;
  /** `J` / `K` — the next / previous headline. */
  next: () => void;
  prev: () => void;
  /** `↵` — open the selected headline. */
  open: () => void;
  /** `1`–`5` — the wire's time filter. */
  time: (index: number) => void;
  /** `F` then `1`–`7` — the format, in deck order. */
  format: (index: number) => void;
  /** `C` — «نسخ الكل» of the draft on screen. */
  copyAll: () => void;
  /** `P` — «فحص ونشر» of the draft on screen. */
  publish: () => void;
  newsroom: NewsroomBridge;
};

type Entry = { read: () => Partial<HotkeyHandlers> };

/** Mounted registrations, oldest first: the latest screen to register a handler wins. */
const entries: Entry[] = [];

/** A handler asked for before its screen was there (`/` from another page): run once the screen registers it. */
type Pending = { name: "search"; at: number };
let pending: Pending | null = null;
/** A route change and the screen's first render take well under this; later, the request is stale. */
const PENDING_MS = 3000;

export function getHotkeyHandler<K extends keyof HotkeyHandlers>(name: K): HotkeyHandlers[K] | undefined {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const handler = entries[index].read()[name];
    if (handler !== undefined) return handler as HotkeyHandlers[K];
  }
  return undefined;
}

/** Run `name` as soon as a screen registers it (after the navigation that brings that screen). */
export function awaitHotkeyHandler(name: Pending["name"]): void {
  pending = { name, at: Date.now() };
}

/**
 * Registers this screen's shortcut handlers while it is mounted. Pass `undefined` for a handler that does not
 * apply right now (no «فحص ونشر» for a video script); the latest values are read at key time.
 */
export function useHotkeyActions(handlers: Partial<HotkeyHandlers>): void {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    const entry: Entry = { read: () => ref.current };
    entries.push(entry);
    let waiting: Pending | null = null;
    let timer = 0;
    if (pending && Date.now() - pending.at <= PENDING_MS && ref.current[pending.name] !== undefined) {
      waiting = pending;
      pending = null;
      // After this commit, so the screen's refs (the search field) are attached.
      timer = window.setTimeout(() => {
        waiting = null;
        getHotkeyHandler("search")?.();
      });
    }
    return () => {
      window.clearTimeout(timer);
      // Unmounted before it ran (StrictMode's second mount, a quick navigation): keep the request.
      if (waiting) pending = waiting;
      const index = entries.indexOf(entry);
      if (index !== -1) entries.splice(index, 1);
    };
  }, []);
}
