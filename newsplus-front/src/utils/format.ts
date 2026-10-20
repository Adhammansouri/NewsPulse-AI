/** Numbers and dates: Arabic language, Western digits — consistent everywhere. */
const LOCALE = "ar-EG-u-nu-latn";

export function formatNumber(value: number) {
  return new Intl.NumberFormat(LOCALE).format(value);
}

export function formatDateTime(iso: string | number | Date) {
  try {
    return new Date(iso).toLocaleString(LOCALE, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(iso);
  }
}

export function formatTime(iso: string | number | Date) {
  try {
    return new Date(iso).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function formatLongDate(date = new Date()) {
  try {
    return date.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" });
  } catch {
    return "";
  }
}

export function formatRelative(iso: string) {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (!Number.isFinite(diff)) return "";
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  if (Math.abs(diff) < minute) return "الآن";
  if (Math.abs(diff) < hour) return rtf.format(-Math.round(diff / minute), "minute");
  if (Math.abs(diff) < day) return rtf.format(-Math.round(diff / hour), "hour");
  if (Math.abs(diff) < 7 * day) return rtf.format(-Math.round(diff / day), "day");
  return formatDateTime(iso);
}

/** Compact "12 د" / "3 س" for dense lists. */
export function formatAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 60_000) return "الآن";
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `${minutes} د`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} س`;
  return `${Math.round(hours / 24)} ي`;
}
