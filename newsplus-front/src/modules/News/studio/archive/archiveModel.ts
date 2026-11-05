// The archive (S06 §7): the DeskArchive drawer (≥1024px) and the MobArchive / MobArchive-memory screen.
// UI copy is verbatim from docs/redesign/design/reference/DeskArchive.dc.html and MobArchive.dc.html (the empties,
// the retry and the saved-rule toast from States.dc.html); every value in it comes from real data.
import type { EditorialConversationSummary, EditorialMemoryRule, NewsSummaryFormat } from "@newsplus/shared";
import { clockAr, countPhrase, relativeTimeAr, relativeTimeArShort, toArabicDigits, type CountForms } from "@/utils/arabic";

export type ArchiveTab = "drafts" | "memory";

/** The MobArchive screen; `?tab=memory` opens «ذاكرة الفريق». From 1024px it redirects to the drawer on /news. */
export const ARCHIVE_ROUTE = "/archive";
export const ARCHIVE_TAB_PARAM = "tab";
/** `/news?archive=drafts|memory`: the studio opens the DeskArchive drawer on that tab, then drops the param. */
export const ARCHIVE_DRAWER_PARAM = "archive";

export function readArchiveTab(value: string | null): ArchiveTab | null {
  return value === "drafts" || value === "memory" ? value : null;
}

export function archivePath(tab: ArchiveTab): string {
  return tab === "memory" ? `${ARCHIVE_ROUTE}?${ARCHIVE_TAB_PARAM}=memory` : ARCHIVE_ROUTE;
}

export function archiveDrawerPath(tab: ArchiveTab): string {
  return `/news?${ARCHIVE_DRAWER_PARAM}=${tab}`;
}

/** The memory rule editor's limits: the board's «n / ٢٤٠» counter; the API refuses fewer than 18 characters. */
export const RULE_MAX = 240;
export const RULE_MIN = 18;

export const ARCHIVE_COPY = {
  title: "الأرشيف",
  lead: "كل مسودة محفوظة بنسخها، ترجعلها وتكمّل منين ما وقفت",
  close: "إغلاق",
  closeScrim: "إغلاق الأرشيف",
  back: "رجوع",
  searchDesk: "بحث في الأرشيف",
  searchMob: "بحث",
  searchPlaceholder: "ابحث بعنوان المسودة…",
  drafts: "المسودات",
  memory: "ذاكرة الفريق",
  today: "اليوم",
  yesterday: "أمس",
  // DeskArchive: the team-memory panel
  memoryLead: "قواعد تعلّمها المحرّر من تعديلاتكم، وتُطبَّق على كل مسودة جديدة",
  ruleSwitch: "تفعيل القاعدة",
  // MobArchive-memory
  learning: "المحرّر بيتعلّم من تعديلاتكم",
  learningText: "القواعد المفعّلة بتتطبّق على كل مسودة جديدة للفريق كله.",
  pending: "مقترحة · محتاجة موافقتك",
  editRule: "حرّر القاعدة قبل الحفظ",
  cancel: "إلغاء",
  saveForTeam: "احفظ للفريق",
  currentRules: "القواعد الحالية",
  // States: empties, errors, toasts
  firstDraftTitle: "ابدأ أول مسودة",
  firstDraftText: "اختار خبر من العناوين، والمحرّر يكتب لك منشور أو سكريبت أو كاروسيل.",
  openHeadlines: "افتح العناوين",
  noResultsTitle: "مفيش نتائج في الأرشيف",
  noResultsText: "جرّب كلمة أقصر، أو ابحث بجزء من العنوان.",
  clearSearch: "امسح البحث",
  memoryEmptyTitle: "ذاكرة الفريق فاضية",
  memoryEmptyText: "لما تعدّل المسودات، المحرّر هيقترح قواعد تتطبّق على كل الفريق.",
  retry: "حاول تاني",
  ruleSaved: "القاعدة اتحفظت لذاكرة الفريق",
} as const;

/** «المسودات · ١٢» — the count only once it is known. */
export function tabLabel(label: string, count: number | null): string {
  return count === null ? label : `${label} · ${toArabicDigits(count)}`;
}

/** «٥٨ / ٢٤٠». */
export function ruleCounter(length: number): string {
  return `${toArabicDigits(length)} / ${toArabicDigits(RULE_MAX)}`;
}

/* ---------- Drafts ---------- */

/**
 * A format as the archive names it: `kind` in the row's `ic-wrap`, `name` in its meta line. DeskArchive / MobArchive
 * name video, social, carousel, briefing, desk and facts; bulletin and context are not drawn there and take the
 * names the home (homeModel) gives them — their studio tile names.
 */
export const FORMAT_LABEL: Record<NewsSummaryFormat, { kind: string; name: string }> = {
  video: { kind: "فيديو", name: "سكريبت فيديو" },
  social: { kind: "سوشيال", name: "منشور سوشيال" },
  carousel: { kind: "شرائح", name: "كاروسيل" },
  briefing: { kind: "موجز", name: "موجز الساعة" },
  desk: { kind: "خبر", name: "خبر مكتبي" },
  facts: { kind: "حقائق", name: "ملف حقائق" },
  bulletin: { kind: "نشرة", name: "نشرة" },
  context: { kind: "سياق", name: "سياق الخبر" },
};

/** DeskArchive: «نسخة واحدة» · «نسختان» · «٣ نسخ». */
const VERSIONS_DESK: CountForms = { one: "نسخة واحدة", two: "نسختان", few: "{n} نسخ", many: "{n} نسخة" };
/** MobArchive: «نسخة» · «نسختان» · «٣ نسخ». */
const VERSIONS_MOB: CountForms = { one: "نسخة", two: "نسختان", few: "{n} نسخ", many: "{n} نسخة" };

export type ArchiveIcon = "ic-wrap--ai" | "ic-wrap--teal" | "";

export type ArchiveRow = {
  id: string;
  /** `ic-wrap` text: «فيديو». */
  kind: string;
  /** «سكريبت فيديو». */
  format: string;
  title: string;
  /** «٣ نسخ». */
  versions: string;
  /** Desktop «قبل ٤ دقائق» / «أمس ٨:١٠ م»; mobile «قبل ٤ د» today, «٨:١٠ م» on earlier days. */
  time: string;
  /** The AI gradient marks the current draft; the rest of today is teal, earlier days plain. */
  icon: ArchiveIcon;
  current: boolean;
};

export type ArchiveGroup = { key: string; label: string; rows: ArchiveRow[] };

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * The drafts by day of their last edit (the list comes newest first): «اليوم», «أمس», then the date («١ نوفمبر»).
 * `currentId`: the draft open in the studio (desktop) / the latest draft (mobile).
 */
export function archiveGroups(
  items: readonly EditorialConversationSummary[],
  { now, currentId, mobile }: { now: Date; currentId: string | null; mobile: boolean },
): ArchiveGroup[] {
  const todayKey = dayKey(now);
  const yesterdayKey = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const groups: ArchiveGroup[] = [];

  for (const item of items) {
    const at = new Date(item.updatedAt);
    const valid = !Number.isNaN(at.getTime());
    // A clock running ahead of the server's still reads as today.
    const key = !valid || at.getTime() > now.getTime() ? todayKey : dayKey(at);
    const today = key === todayKey;
    let group = groups.find((entry) => entry.key === key);
    if (!group) {
      const label = today ? ARCHIVE_COPY.today : key === yesterdayKey ? ARCHIVE_COPY.yesterday : relativeTimeAr(item.updatedAt, now);
      group = { key, label, rows: [] };
      groups.push(group);
    }
    const labels = FORMAT_LABEL[item.format] ?? FORMAT_LABEL.desk;
    const current = item.id === currentId;
    const time = !valid
      ? ""
      : mobile
        ? today
          ? relativeTimeArShort(item.updatedAt, now)
          : clockAr(at)
        : relativeTimeAr(item.updatedAt, now);
    group.rows.push({
      id: item.id,
      kind: labels.kind,
      format: labels.name,
      title: item.title,
      versions: countPhrase(item.versionCount, mobile ? VERSIONS_MOB : VERSIONS_DESK),
      time,
      icon: current ? "ic-wrap--ai" : today ? "ic-wrap--teal" : "",
      current,
    });
  }
  return groups;
}

/** MobArchive meta line: «سكريبت فيديو · ٣ نسخ · قبل ٤ د». */
export function rowMeta(row: ArchiveRow): string {
  return [row.format, row.versions, row.time].filter(Boolean).join(" · ");
}

/* ---------- Team memory ---------- */

export type ArchiveMemory = {
  /** «مقترحة · محتاجة موافقتك». */
  pending: EditorialMemoryRule[];
  /** «القواعد الحالية»: approved (switch on) and disabled (off) rules. Rejected suggestions are not listed. */
  rules: EditorialMemoryRule[];
};

function createdAt(rule: EditorialMemoryRule): number {
  const at = Date.parse(rule.createdAt);
  return Number.isFinite(at) ? at : 0;
}

/** Newest first by creation, so a rule keeps its place while its switch is toggled. */
export function splitMemory(rules: readonly EditorialMemoryRule[]): ArchiveMemory {
  const sorted = [...rules].sort((a, b) => createdAt(b) - createdAt(a));
  return {
    pending: sorted.filter((rule) => rule.status === "pending"),
    rules: sorted.filter((rule) => rule.status === "approved" || rule.status === "disabled"),
  };
}

const DAYS: CountForms = { one: "يوم", two: "يومين", few: "{n} أيام", many: "{n} يوم" };
const WEEKS: CountForms = { one: "أسبوع", two: "أسبوعين", few: "{n} أسابيع", many: "{n} أسبوع" };
const MONTHS: CountForms = { one: "شهر", two: "شهرين", few: "{n} أشهر", many: "{n} شهر" };
const YEARS: CountForms = { one: "سنة", two: "سنتين", few: "{n} سنوات", many: "{n} سنة" };

/** «أسبوعين», «شهر»: how long ago, in calendar days, as the boards' «تُطبَّق منذ …». */
function sinceDuration(days: number): string {
  if (days < 7) return countPhrase(days, DAYS);
  if (days < 30) return countPhrase(Math.floor(days / 7), WEEKS);
  if (days < 365) return countPhrase(Math.floor(days / 30), MONTHS);
  return countPhrase(Math.floor(days / 365), YEARS);
}

function calendarDays(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000);
}

/**
 * A rule's meta line: «موقوفة» when switched off; «أُضيفت اليوم · من تعديلات سارة» the day it was added (the name
 * only when it came from the signed-in editor's edits — the API sends the author's id); «تُطبَّق منذ أسبوعين» after
 * that (MobArchive spells it «تُطبّق»).
 */
export function ruleMeta(
  rule: EditorialMemoryRule,
  { now, userId, userName, mobile }: { now: Date; userId: string | null; userName: string; mobile: boolean },
): string {
  if (rule.status === "disabled") return "موقوفة";
  const at = new Date(rule.createdAt);
  const days = Number.isNaN(at.getTime()) ? 0 : calendarDays(at, now);
  if (days <= 0) {
    const name = userName.trim();
    return userId !== null && rule.createdBy === userId && name ? `أُضيفت اليوم · من تعديلات ${name}` : "أُضيفت اليوم";
  }
  return `${mobile ? "تُطبّق" : "تُطبَّق"} منذ ${sinceDuration(days)}`;
}
