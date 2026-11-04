// Login copy, verbatim from the `AR` / `EN` objects of docs/redesign/design/reference/DeskLogin.dc.html
// and MobLogin.dc.html (same keys). The boards bake sample values into a few strings («باقي ٤ محاولات»,
// «٠:٤٥», «سارة», «أدهم»); those keys take the real value instead (GLOBAL-RULES §2).
import { countPhrase, toArabicDigits, type CountForms } from "@/utils/arabic";

export type LoginLocale = "ar" | "en";

type Shared = {
  title: string;
  subtitle: string;
  idLabel: string;
  idPh: string;
  pwLabel: string;
  pwPh: string;
  show: string;
  remember: string;
  forgot: string;
  idRequired: string;
  pwRequired: string;
  /** Wrong credentials; `attemptsLeft` adds the «باقي N محاولات» sentence. */
  invalid: (attemptsLeft?: number) => string;
  network: string;
  locked: string;
  /** `time` is the countdown as `m:ss`. */
  lockedIn: (time: string) => string;
  forgotTitle: string;
  forgotText: string;
  adminInitial: string;
  adminName: string;
  contact: string;
  back: string;
  hero: string;
  switchLang: string;
  dark: string;
};

export type DeskCopy = Shared & {
  idle: string;
  loading: string;
  ok: (displayName: string) => string;
  wait: (time: string) => string;
  footer: string;
  heroText: string;
  otherLang: LoginLocale;
};

export type MobCopy = Shared & { submit: string };

const ATTEMPT_FORMS: CountForms = { one: "محاولة واحدة", two: "محاولتين", few: "{n} محاولات", many: "{n} محاولة" };

const AR_INVALID = "اسم المستخدم أو كلمة المرور غير صحيحة.";
const EN_INVALID = "Incorrect username or password.";

function invalidAr(attemptsLeft?: number) {
  return attemptsLeft ? `${AR_INVALID} باقي ${countPhrase(attemptsLeft, ATTEMPT_FORMS)}.` : AR_INVALID;
}

function invalidEn(attemptsLeft?: number) {
  if (!attemptsLeft) return EN_INVALID;
  return `${EN_INVALID} ${attemptsLeft} ${attemptsLeft === 1 ? "attempt" : "attempts"} left.`;
}

/** Countdown as `m:ss` (Arabic-Indic digits in Arabic copy). */
export function formatCountdown(seconds: number, locale: LoginLocale): string {
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return locale === "ar" ? toArabicDigits(clock) : clock;
}

// The boards' admin card reads «أدهم · مسؤول النظام» / «Adham · System admin» with the initial «أ» / «A»:
// the name is sample data, so the card shows the role only, initialled from it.
const AR_SHARED = {
  title: "أهلاً بعودتك",
  subtitle: "ادخل إلى مكتب التحرير",
  idLabel: "اسم المستخدم أو رقم الهاتف",
  idPh: "مثال: sara أو 010…",
  pwLabel: "كلمة المرور",
  pwPh: "أدخل كلمة المرور",
  show: "إظهار كلمة المرور",
  forgot: "نسيت كلمة المرور؟",
  idRequired: "اكتب اسم المستخدم أو رقم الهاتف.",
  pwRequired: "اكتب كلمة المرور.",
  invalid: invalidAr,
  network: "تعذّر الوصول للسيرفر. تأكد من الإنترنت وحاول تاني.",
  locked: "محاولات كتير ورا بعض. استنى شوية وجرّب تاني.",
  lockedIn: (time: string) => `تقدر تحاول تاني بعد ${time}`,
  forgotTitle: "استعادة كلمة المرور",
  forgotText: "مسؤول النظام يعيد تعيين كلمات المرور لفريق التحرير. ابعتله اسم المستخدم وهيرد عليك.",
  adminInitial: "م",
  adminName: "مسؤول النظام",
  contact: "راسل المسؤول",
  back: "رجوع لتسجيل الدخول",
  hero: "من العاجل إلى المنشور في دقيقة.",
  dark: "الوضع الداكن",
} satisfies Partial<Shared>;

const EN_SHARED = {
  title: "Welcome back",
  subtitle: "Sign in to the newsroom desk",
  idLabel: "Username or phone number",
  idPh: "e.g. sara or 010…",
  pwLabel: "Password",
  pwPh: "Enter your password",
  show: "Show password",
  forgot: "Forgot password?",
  idRequired: "Enter a username or phone number.",
  pwRequired: "Enter your password.",
  invalid: invalidEn,
  locked: "Too many attempts. Wait a moment and try again.",
  lockedIn: (time: string) => `You can try again in ${time}`,
  forgotTitle: "Reset password",
  adminInitial: "S",
  adminName: "System admin",
  contact: "Email the admin",
  back: "Back to sign in",
  hero: "From breaking to posted in a minute.",
  dark: "Dark mode",
} satisfies Partial<Shared>;

/** DeskLogin.dc.html → `AR` / `EN`. */
export const DESK_COPY: Record<LoginLocale, DeskCopy> = {
  ar: {
    ...AR_SHARED,
    remember: "تذكّرني على هذا الجهاز",
    idle: "دخول",
    loading: "جاري الدخول…",
    ok: (displayName) => `أهلاً ${displayName}`,
    wait: (time) => `استنى ${time}`,
    footer: "Newsplus · مساعد غرفة الأخبار",
    heroText: "تابع المصادر، اختار الخبر، والمحرّر يكتب منشور أو سكريبت أو كاروسيل بصور مرسومة، بأسلوب فريقك.",
    switchLang: "English",
    otherLang: "en",
  },
  en: {
    ...EN_SHARED,
    remember: "Remember me on this device",
    network: "Could not reach the server. Check your connection and try again.",
    idle: "Sign in",
    loading: "Signing in…",
    ok: (displayName) => `Welcome, ${displayName}`,
    wait: (time) => `Wait ${time}`,
    forgotText: "Your system admin resets passwords for the newsroom team. Send them your username and they will get back to you.",
    footer: "Newsplus · Newsroom assistant",
    heroText:
      "Follow your sources, pick a story, and the editor drafts a post, a script or a carousel with painted slides, in your team’s style.",
    switchLang: "عربي",
    otherLang: "ar",
  },
};

/** MobLogin.dc.html → `AR` / `EN`. */
export const MOB_COPY: Record<LoginLocale, MobCopy> = {
  ar: {
    ...AR_SHARED,
    remember: "تذكّرني",
    submit: "دخول",
    switchLang: "EN",
  },
  en: {
    ...EN_SHARED,
    remember: "Remember me",
    network: "Could not reach the server. Check your connection.",
    submit: "Sign in",
    forgotText: "Your system admin resets passwords for the newsroom team.",
    switchLang: "عربي",
  },
};

export type WireRow = { t: string; meta: string; dot: string; op: string };

/** The navy brand side's «wire» preview: decorative copy from DeskLogin.dc.html (S03 §1), not data. */
export const WIRE_ROWS: Record<LoginLocale, readonly WireRow[]> = {
  ar: [
    { t: "البنك المركزي يثبت أسعار الفائدة للمرة الثالثة على التوالي", meta: "عاجل · العربية · الآن", dot: "#ef6c57", op: "1" },
    { t: "اجتماع طارئ لوزراء الخارجية العرب لبحث تطورات الأوضاع", meta: "الجزيرة نت · قبل ١١ دقيقة", dot: "#2dd4bf", op: ".8" },
    { t: "أسعار النفط ترتفع بعد إشارات أوبك+ بتمديد خفض الإنتاج", meta: "Reuters · قبل ٢٦ دقيقة", dot: "#1e8f82", op: ".55" },
  ],
  en: [
    { t: "Central bank holds rates for a third straight meeting", meta: "Breaking · Al Arabiya · now", dot: "#ef6c57", op: "1" },
    { t: "Arab foreign ministers to hold emergency meeting tonight", meta: "Al Jazeera · 11 min ago", dot: "#2dd4bf", op: ".8" },
    { t: "Oil prices climb after OPEC+ signals extended output cuts", meta: "Reuters · 26 min ago", dot: "#1e8f82", op: ".55" },
  ],
};
