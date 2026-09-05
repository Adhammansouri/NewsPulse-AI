export const NAV_ITEMS = [
  { href: "/", label: "الرئيسية" },
  { href: "/news", label: "الأخبار" },
  { href: "/generate", label: "توليد" },
  { href: "/translate", label: "ترجمة" },
] as const;

export const HEADER_CTA = {
  href: "/generate",
  label: "ابدأ الآن",
} as const;

export const HEADER_LOGIN = {
  href: "/login",
  label: "دخول",
} as const;

export const HEADER_LOGOUT = {
  label: "خروج",
} as const;

export const HOME_FEATURES = [
  {
    href: "/news",
    title: "ملخص الأخبار",
    description: "آخر الأخبار من مصادر عربية ودولية.",
    badge: "مراقبة",
    accent: "teal" as const,
  },
  {
    href: "/generate",
    title: "توليد المحتوى",
    description: "تقارير ومقالات من موضوع أو رابط.",
    badge: "AI",
    accent: "cyan" as const,
  },
  {
    href: "/translate",
    title: "الترجمة",
    description: "بين العربية والإنجليزية مع الحفاظ على الأسلوب.",
    badge: "ثنائي اللغة",
    accent: "navy" as const,
  },
] as const;
