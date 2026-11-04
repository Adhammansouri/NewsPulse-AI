// Data of docs/redesign/design/reference/DesignSystem.dc.html (`renderVals()`), copied verbatim. Dev-only.
import type { IconName } from "@/ui/icons";

export type Swatch = { name: string; hex: string; role: string };

export const LIGHT_SWATCHES: Swatch[] = [
  { name: "كحلي", hex: "#0C2340", role: "النص، الشريط" },
  { name: "تيل", hex: "#0A7F71", role: "روابط، نجاح" },
  { name: "سماوي", hex: "#0EA5E9", role: "نهاية تدرّج AI" },
  { name: "كورال", hex: "#C03B25", role: "العاجل فقط" },
  { name: "ورق", hex: "#F3F5F8", role: "الخلفية" },
  { name: "سطح", hex: "#FFFFFF", role: "الألواح" },
  { name: "حبر ٢", hex: "#41546A", role: "نص ثانوي · ٧٫٥:١" },
  { name: "حبر ٣", hex: "#64768A", role: "بيانات · ٤٫٧:١" },
];

export const DARK_SWATCHES: Swatch[] = [
  { name: "ليل", hex: "#07111C", role: "الخلفية" },
  { name: "سطح", hex: "#0C1928", role: "الألواح" },
  { name: "شريط", hex: "#050D17", role: "التنقل" },
  { name: "حبر", hex: "#E8EEF5", role: "النص" },
  { name: "تيل", hex: "#2DD4BF", role: "بداية تدرّج AI" },
  { name: "سماوي", hex: "#38BDF8", role: "نهاية التدرّج" },
  { name: "كورال", hex: "#FF9381", role: "العاجل" },
  { name: "حبر ٣", hex: "#8296AB", role: "بيانات" },
];

export const SPACES = [4, 8, 12, 16, 24, 32, 48];

/** The board's 30 icons (label → icons.json name). `ai` icons are stroked with the AI gradient. */
export const BOARD_ICONS: Array<{ n: string; name: IconName; ai?: boolean }> = [
  { n: "الرئيسية", name: "home" },
  { n: "الأخبار", name: "news" },
  { n: "توليد", name: "pen" },
  { n: "ترجمة", name: "translate" },
  { n: "الاستهلاك", name: "chart" },
  { n: "المحرّر AI", name: "sparkle-double", ai: true },
  { n: "ذاكرة الفريق", name: "memory", ai: true },
  { n: "موجز", name: "bolt" },
  { n: "الأرشيف", name: "history" },
  { n: "إشعارات", name: "bell" },
  { n: "بحث", name: "search" },
  { n: "تصفية", name: "filter" },
  { n: "تحديث", name: "refresh" },
  { n: "نسخ", name: "copy" },
  { n: "تم", name: "check" },
  { n: "إرسال", name: "send" },
  { n: "رابط", name: "link" },
  { n: "فتح المصدر", name: "external" },
  { n: "تنزيل", name: "download" },
  { n: "تبديل", name: "swap" },
  { n: "رجوع", name: "arrow-back" },
  { n: "التالي", name: "arrow-forward" },
  { n: "إغلاق", name: "close" },
  { n: "داكن", name: "moon" },
  { n: "قفل", name: "lock" },
  { n: "مستخدم", name: "user" },
  { n: "تنبيه", name: "warning" },
  { n: "صورة", name: "image" },
  { n: "بلا اتصال", name: "wifi-off" },
  { n: "خروج", name: "logout" },
];
