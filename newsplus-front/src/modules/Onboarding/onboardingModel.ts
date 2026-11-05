// S16 «أول تشغيل»: the onboarding view model — the steps and their copy (MobOnboard / NewOnboarding, verbatim), the
// platform rows, the hook styles, the rule each style saves to the team memory, the example story (the newest real
// headline), the summary side of NewOnboarding, and where onboarding goes when it ends. No React here.
import {
  EDITORIAL_PUBLISH_PLATFORMS,
  HOOK_STYLES,
  type EditorialMemoryCreateRequest,
  type EditorialPublishPlatform,
  type HookStyle,
  type NewsFeedItem,
  type NewsSource,
} from "@newsplus/shared";
import { countPhrase, toArabicDigits, type CountForms } from "@/utils/arabic";

export type OnboardingStep = 1 | 2 | 3;
export const STEP_COUNT = 3;

/** The onboarding route (inside RequireAuth, outside the app shell). */
export const WELCOME_ROUTE = "/welcome";

/** Shared copy (MobOnboard · NewOnboarding). */
export const ONBOARDING_COPY = {
  brand: "Newsplus",
  skipMob: "تخطّي",
  skipDesk: "تخطّي الإعداد",
  next: "التالي",
  back: "رجوع",
  finish: "ابدأ الشغل",
  sourcesNote: "تقدر تضيف أو تشيل مصادر بعدين من التصفية.",
  stylesLabel: "نفس الخبر، ٣ أساليب:",
  memoryNote: "هيتحفظ كقاعدة في ذاكرة الفريق ويتطبّق من أول مسودة.",
  summaryTitle: "غرفة أخبارك جاهزة",
  summaryNote: "تقدر تغيّر أي حاجة بعدين من «المزيد» أو «ذاكرة الفريق».",
} as const;

/** «الخطوة ٢ من ٣». */
export function stepLabel(step: OnboardingStep): string {
  return `الخطوة ${toArabicDigits(step)} من ${toArabicDigits(STEP_COUNT)}`;
}

/** MobOnboard `title` / `sub`; NewOnboarding's step 3 keeps its longer subtitle. */
const STEP_COPY: Record<OnboardingStep, { title: string; sub: string; deskSub?: string }> = {
  1: { title: "بتنشر فين؟", sub: "هنجهّز الصيغ وحدود الحروف على مقاس منصاتك." },
  2: { title: "بتتابع مين؟", sub: "العناوين هتيجي من المصادر دي بس." },
  3: {
    title: "علّم المحرّر أسلوبك",
    sub: "اختار الخطاف الأقرب للي بتكتبه.",
    deskSub: "اختار الخطاف اللي أقرب للي بتكتبه. هيحفظه كقاعدة في ذاكرة الفريق ويطبّقه من أول مسودة.",
  },
};

export function stepCopy(step: OnboardingStep, desktop: boolean): { title: string; sub: string } {
  const copy = STEP_COPY[step];
  return { title: copy.title, sub: (desktop && copy.deskSub) || copy.sub };
}

/** MobOnboard `s1`–`s3`: the stepper's segments done so far. */
export function stepperOn(step: OnboardingStep): [boolean, boolean, boolean] {
  return [true, step >= 2, step === 3];
}

/** The step's main button: «التالي» (ink) on steps 1–2, «ابدأ الشغل» (AI) on step 3. */
export function stepCta(step: OnboardingStep): { label: string; variant: "ink" | "ai"; finish: boolean } {
  return step === STEP_COUNT ? { label: ONBOARDING_COPY.finish, variant: "ai", finish: true } : { label: ONBOARDING_COPY.next, variant: "ink", finish: false };
}

export function nextStep(step: OnboardingStep): OnboardingStep {
  return step === 3 ? 3 : ((step + 1) as OnboardingStep);
}

export function previousStep(step: OnboardingStep): OnboardingStep {
  return step === 1 ? 1 : ((step - 1) as OnboardingStep);
}

/** MobOnboard step 1, in the board's order (X · إنستجرام · فيسبوك · تيليجرام · تيك توك). */
export const PLATFORM_ROWS: ReadonlyArray<{ id: EditorialPublishPlatform; name: string; note: string }> = [
  { id: "x", name: "X", note: "منشورات قصيرة وعاجل" },
  { id: "instagram", name: "إنستجرام", note: "كاروسيل وصور" },
  { id: "facebook", name: "فيسبوك", note: "منشورات أطول" },
  { id: "telegram", name: "تيليجرام", note: "قناة أخبار" },
  { id: "tiktok", name: "تيك توك", note: "سكريبتات فيديو" },
];

/** A toggled choice, kept in the board's order (platforms) or the order picked (sources). */
export function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

/** The platforms to save: the board's order, known ids only. */
export function platformsToSave(chosen: readonly EditorialPublishPlatform[]): EditorialPublishPlatform[] {
  return EDITORIAL_PUBLISH_PLATFORMS.filter((platform) => chosen.includes(platform));
}

/** The sources to save: ids `/news/sources` lists, in the list's order. */
export function sourcesToSave(chosen: readonly string[], sources: readonly NewsSource[]): string[] {
  return sources.filter((source) => chosen.includes(source.id)).map((source) => source.id);
}

/** Step 3's tiles: the badge (MobOnboard) and NewOnboarding's line under the hook. */
export const HOOK_STYLE_COPY: Record<HookStyle, { label: string; note: string; summary: string }> = {
  direct: { label: "مباشر", note: "الخبر كما هو، بدون أي إضافة", summary: "خطاف مباشر" },
  question: { label: "سؤال", note: "يشد القارئ بسؤال يخصه", summary: "خطاف بسؤال" },
  number: { label: "رقم", note: "يبدأ برقم واضح", summary: "خطاف برقم" },
};

export const HOOK_STYLE_ORDER: readonly HookStyle[] = HOOK_STYLES;

/** The team-memory rule each style saves (S16 §2: question → «ابدأ خطافات الأخبار بسؤال مباشر يخص القارئ.»). */
const HOOK_STYLE_RULES: Record<HookStyle, string> = {
  direct: "ابدأ خطافات الأخبار بالخبر نفسه مباشرة، من غير أي إضافة.",
  question: "ابدأ خطافات الأخبار بسؤال مباشر يخص القارئ.",
  number: "ابدأ خطافات الأخبار برقم واضح من الخبر.",
};

const RULE_RATIONALE = "اختيار المحرّر في أول تشغيل.";

/** `POST /editorial/memory` for the chosen style. */
export function hookStyleRule(style: HookStyle): EditorialMemoryCreateRequest {
  return { instruction: HOOK_STYLE_RULES[style], rationale: RULE_RATIONALE };
}

function publishTime(item: NewsFeedItem): number {
  const time = Date.parse(item.publishedAt);
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
}

function newest(items: readonly NewsFeedItem[]): NewsFeedItem | null {
  let best: NewsFeedItem | null = null;
  for (const item of items) if (!best || publishTime(item) > publishTime(best)) best = item;
  return best;
}

const ARABIC = /[؀-ۿ]/;

/**
 * Step 3's example story: the newest real headline — from the sources just picked when one of them has a story,
 * and in Arabic when the feed has one (the desk's language), else the newest of the feed.
 */
export function exampleStory(items: readonly NewsFeedItem[], followed: readonly string[]): NewsFeedItem | null {
  const arabic = items.filter((item) => ARABIC.test(item.title));
  const fromFollowed = followed.length > 0 ? arabic.filter((item) => item.sources.some((source) => followed.includes(source.id))) : [];
  return newest(fromFollowed) ?? newest(arabic) ?? newest(items);
}

const SOURCE_FORMS: CountForms = { one: "مصدر واحد", two: "مصدرين", few: "{n} مصادر", many: "{n} مصدر" };
/** NewOnboarding lists the first three names, then «…». */
const SUMMARY_SOURCE_NAMES = 3;

export type SummaryLine = { key: "platforms" | "sources" | "style"; text: string; style: boolean };

/** NewOnboarding's summary side: the choices so far («بتنشر على: …», «بتتابع ٦ مصادر: …», «أسلوبك: …»). */
export function summaryLines(input: {
  platforms: readonly EditorialPublishPlatform[];
  sources: readonly NewsSource[];
  hookStyle: HookStyle | null;
}): SummaryLine[] {
  const lines: SummaryLine[] = [];
  const platforms = PLATFORM_ROWS.filter((row) => input.platforms.includes(row.id)).map((row) => row.name);
  if (platforms.length > 0) lines.push({ key: "platforms", text: `بتنشر على: ${platforms.join("، ")}`, style: false });
  if (input.sources.length > 0) {
    const names = input.sources.slice(0, SUMMARY_SOURCE_NAMES).map((source) => source.name);
    const more = input.sources.length > SUMMARY_SOURCE_NAMES ? "…" : "";
    lines.push({ key: "sources", text: `بتتابع ${countPhrase(input.sources.length, SOURCE_FORMS)}: ${names.join("، ")}${more}`, style: false });
  }
  if (input.hookStyle) lines.push({ key: "style", text: `أسلوبك: ${HOOK_STYLE_COPY[input.hookStyle].summary}`, style: true });
  return lines;
}

type FromState = { from?: { pathname?: string; search?: string; hash?: string } } | null;

/**
 * Where onboarding goes when it ends: the page the gate held back (a deep link), else Home. Never /welcome or
 * /login again.
 */
export function onboardingTarget(state: unknown): string {
  const from = (state as FromState)?.from;
  const pathname = from?.pathname;
  if (!pathname || !pathname.startsWith("/") || pathname.startsWith("//") || pathname === WELCOME_ROUTE || pathname === "/login") return "/";
  return `${pathname}${from?.search ?? ""}${from?.hash ?? ""}`;
}
