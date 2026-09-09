export const NEWS_TOPICS = [
  "sports",
  "health",
  "tech",
  "science",
  "economy",
  "culture",
  "politics",
  "other",
] as const;

export type NewsTopic = (typeof NEWS_TOPICS)[number];

/** More specific desks win ties so politics does not swallow health/sports. */
const TIE_BREAK: NewsTopic[] = [
  "sports",
  "health",
  "tech",
  "science",
  "economy",
  "culture",
  "politics",
  "other",
];

const KEYWORDS: Record<Exclude<NewsTopic, "other">, string[]> = {
  sports: [
    "مباراة", "مباريات", "دوري", "كأس", "هدف", "أهداف", "منتخب", "لاعب", "مدرب",
    "بطولة", "أولمبي", "أولمبياد", "فيفا", "نهائي", "شوط", "كرة القدم", "كرة السلة",
    "تنس", "ليفربول", "برشلونة", "ريال مدريد", "الأهلي", "الزمالك", "انتقالات",
    "match", "league", "cup final", "world cup", "premier league", "la liga",
    "goal", "football", "soccer", "nba", "nfl", "mlb", "tennis", "olympic",
    "olympics", "fifa", "championship", "striker", "midfielder", "liverpool",
    "barcelona", "transfer", "kickoff", "hat-trick", "hat trick",
  ],
  health: [
    "صحة", "صحي", "مستشفى", "مستشفيات", "لقاح", "فيروس", "وباء", "جائحة",
    "طبيب", "أطباء", "طبي", "سرطان", "دواء", "أدوية", "مرض", "علاج", "كورونا",
    "كوفيد", "وزارة الصحة", "منظمة الصحة", "تطعيم", "وبائي",
    "health", "hospital", "vaccine", "vaccination", "virus", "pandemic",
    "covid", "cancer", "doctor", "medical", "medicine", "disease", "outbreak",
    "who says", "public health", "ministry of health",
  ],
  tech: [
    "تكنولوجيا", "تقني", "ذكاء اصطناعي", "تطبيق", "تطبيقات", "إنترنت", "سيبراني",
    "آيفون", "جوجل", "مايكروسوفت", "روبوت", "رقمي", "منصة رقمية", "برمج",
    "أمن سيبراني", "شرائح إلكترونية",
    "technology", "artificial intelligence", "chatgpt", "openai", "software",
    "cyber", "iphone", "google", "microsoft", "semiconductor", "chipmaker",
    "startup", "smartphone", "app store", "social media", "algorithm",
  ],
  science: [
    "علوم", "علمي", "ناسا", "فضاء", "تلسكوب", "فيزياء", "كيمياء", "أحياء",
    "مجرة", "كوكب", "علماء", "مناخ", "احتباس حراري", "أبحاث علمية",
    "nasa", "telescope", "physics", "biology", "astronomy", "climate change",
    "global warming", "scientists", "space station", "mars rover", "quantum",
  ],
  economy: [
    "اقتصاد", "اقتصادي", "نفط", "دولار", "بورصة", "تضخم", "بنك", "بنوك",
    "أسهم", "ذهب", "استثمار", "ميزانية", "سعر الصرف", "المركزي", "أوبك",
    "خام برنت", "سوق المال", "ضريبة", "رسوم جمركية", "ناتج محلي",
    "economy", "economic", "oil", "dollar", "stock", "stocks", "inflation",
    "central bank", "gold", "investment", "budget", "opec", "brent",
    "gdp", "recession", "tariff", "trade war", "interest rate", "wall street",
    "federal reserve", "central bank",
  ],
  culture: [
    "ثقافة", "فيلم", "أفلام", "مسلسل", "مهرجان", "كتاب", "موسيقى", "فنان",
    "سينما", "مسرح", "أغنية", "رواية", "معرض فني", "أدب", "دراما",
    "culture", "film", "movie", "series", "festival", "music", "artist",
    "cinema", "theatre", "theater", "novel", "concert", "album", "netflix",
    "oscar", "cannes",
  ],
  politics: [
    "حكومة", "وزير", "وزراء", "انتخابات", "برلمان", "رئاسة", "دبلوماس",
    "عقوبات", "مجلس الأمن", "حماس", "حزب الله", "استيطان", "مستوطنات",
    "الكونجرس", "الكونغرس", "ترامب", "نتنياهو", "السيسي", "رئيس",
    "معارضة", "سفارة", "حظر", "غزة", "الضفة", "إيران", "الحرس الثوري",
    "مفاوضات", "الناتو", "الكرملين", "البيت الأبيض", "اتفاق سلام",
    "وقف إطلاق", "تحالف", "حزب", "تشريع",
    "government", "minister", "election", "parliament", "congress", "senate",
    "diplomatic", "sanctions", "hamas", "hezbollah", "settlement", "trump",
    "netanyahu", "president", "embassy", "gaza", "west bank", "iran", "nato",
    "kremlin", "white house", "ceasefire", "coalition", "legislation",
    "state department", "foreign minister", "prime minister",
  ],
};

const TITLE_WEIGHT = 3;
const EXCERPT_WEIGHT = 1;

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripAl(token: string) {
  return token.replace(/^ال/, "");
}

function prepare(text: string) {
  const normalized = normalize(text);
  const tokens = normalized.split(/\s+/).filter(Boolean).map(stripAl);
  return {
    joined: tokens.join(" "),
    tokenSet: new Set(tokens),
  };
}

function hitCount(haystack: ReturnType<typeof prepare>, keyword: string) {
  const needle = stripAl(normalize(keyword));
  if (!needle) return 0;
  if (needle.includes(" ")) return haystack.joined.includes(needle) ? 1 : 0;
  return haystack.tokenSet.has(needle) ? 1 : 0;
}

export function classifyNewsTopic(title: string, excerpt = ""): NewsTopic {
  const titleHay = prepare(title);
  const excerptHay = prepare(excerpt);
  const scores: Record<Exclude<NewsTopic, "other">, number> = {
    sports: 0,
    health: 0,
    tech: 0,
    science: 0,
    economy: 0,
    culture: 0,
    politics: 0,
  };

  for (const topic of Object.keys(KEYWORDS) as Array<Exclude<NewsTopic, "other">>) {
    for (const keyword of KEYWORDS[topic]) {
      scores[topic] += hitCount(titleHay, keyword) * TITLE_WEIGHT;
      scores[topic] += hitCount(excerptHay, keyword) * EXCERPT_WEIGHT;
    }
  }

  let best: NewsTopic = "other";
  let bestScore = 0;
  for (const topic of TIE_BREAK) {
    if (topic === "other") continue;
    const score = scores[topic];
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }

  return bestScore > 0 ? best : "other";
}
