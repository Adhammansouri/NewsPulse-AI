/**
 * Local daily counters for Home «شغلك النهارده» (S07 §4): translations (S08) and painted slides (S06).
 * Stored per device in localStorage (`newsplus-daily-stats`) and reset at local midnight.
 */
export type DailyStatKey = "translations" | "slides";
export type DailyStats = Record<DailyStatKey, number>;

const STORAGE_KEY = "newsplus-daily-stats";
const EMPTY: DailyStats = { translations: 0, slides: 0 };

type Stored = DailyStats & { date: string };

/** Local calendar day, e.g. "2026-11-04". */
function localDay(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    if (typeof parsed.date !== "string") return null;
    return {
      date: parsed.date,
      translations: Number.isFinite(parsed.translations) ? Number(parsed.translations) : 0,
      slides: Number.isFinite(parsed.slides) ? Number(parsed.slides) : 0,
    };
  } catch {
    return null;
  }
}

/** Today's counters (zeros when the stored day is not today or storage is unavailable). */
export function readDailyStats(now: Date = new Date()): DailyStats {
  const stored = readStored();
  if (!stored || stored.date !== localDay(now)) return { ...EMPTY };
  return { translations: stored.translations, slides: stored.slides };
}

/** Adds `by` to today's counter, starting a new day's counters after local midnight. */
export function incrementDailyStat(key: DailyStatKey, by = 1, now: Date = new Date()): void {
  const current = readDailyStats(now);
  const next: Stored = { ...current, [key]: current[key] + by, date: localDay(now) };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: the counter is best-effort */
  }
}
