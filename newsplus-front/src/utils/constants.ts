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

export const HOME_FEATURES = [
  {
    href: "/news",
    title: "ملخص الأخبار",
    description: "تابع آخر الأخبار من مصادر عربية ودولية مع ملخصات سريعة وواضحة.",
    badge: "مراقبة",
    accent: "teal" as const,
  },
  {
    href: "/generate",
    title: "توليد المحتوى",
    description: "اكتب تقارير ومقالات إخبارية بأسلوب تحريري احترافي من موضوع أو رابط.",
    badge: "AI",
    accent: "cyan" as const,
  },
  {
    href: "/translate",
    title: "الترجمة",
    description: "ترجم النصوص بين العربية والإنجليزية مع الحفاظ على السياق والأسلوب.",
    badge: "ثنائي اللغة",
    accent: "navy" as const,
  },
] as const;
