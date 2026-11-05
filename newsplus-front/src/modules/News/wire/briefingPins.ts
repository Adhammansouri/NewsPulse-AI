// «للموجز» pins (S04 §7): items pinned from the mobile wire go first in the next «موجز الساعة».
// Kept in localStorage, oldest first, at most 8 (the API's `itemIds` limit).

const STORAGE_KEY = "newsplus-briefing-pins";
export const MAX_BRIEFING_PINS = 8;

export function readBriefingPins(): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    const ids = value.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
    return [...new Set(ids)].slice(-MAX_BRIEFING_PINS);
  } catch {
    return [];
  }
}

function writeBriefingPins(ids: string[]) {
  try {
    if (ids.length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable (private mode, quota): the pin is simply not kept.
  }
}

/** Pins an item (already pinned → unchanged). A ninth pin drops the oldest. */
export function pinForBriefing(id: string): string[] {
  const pins = readBriefingPins();
  if (pins.includes(id)) return pins;
  const next = [...pins, id].slice(-MAX_BRIEFING_PINS);
  writeBriefingPins(next);
  return next;
}

/** Removes the pins a briefing has used. */
export function unpinBriefingItems(ids: readonly string[]) {
  const pins = readBriefingPins();
  const next = pins.filter((id) => !ids.includes(id));
  if (next.length !== pins.length) writeBriefingPins(next);
}
