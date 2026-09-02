export type NewsSourceLanguage = "ar" | "en";

export type NewsSourceConfig = {
  id: string;
  name: string;
  language: NewsSourceLanguage;
  rssUrl: string;
};

function gnewsEn(site: string) {
  return `https://news.google.com/rss/search?q=when:3d+site:${site}&hl=en-US&gl=US&ceid=US:en`;
}

function gnewsAr(site: string) {
  return `https://news.google.com/rss/search?q=when:3d+site:${site}&hl=ar&gl=EG&ceid=EG:ar`;
}

export const NEWS_SOURCES: NewsSourceConfig[] = [
  {
    id: "bbc-ar",
    name: "BBC Arabic",
    language: "ar",
    rssUrl: "https://feeds.bbci.co.uk/arabic/rss.xml",
  },
  {
    id: "aljazeera",
    name: "Al Jazeera",
    language: "en",
    rssUrl: gnewsEn("aljazeera.com"),
  },
  {
    id: "france24-ar",
    name: "France 24 عربي",
    language: "ar",
    rssUrl: "https://www.france24.com/ar/rss",
  },
  {
    id: "dw-ar",
    name: "DW عربي",
    language: "ar",
    rssUrl: "https://rss.dw.com/rdf/rss-ar-all",
  },
  {
    id: "guardian-world",
    name: "The Guardian",
    language: "en",
    rssUrl: "https://www.theguardian.com/world/rss",
  },
  {
    id: "npr",
    name: "NPR",
    language: "en",
    rssUrl: "https://feeds.npr.org/1001/rss.xml",
  },
  {
    id: "sky-world",
    name: "Sky News",
    language: "en",
    rssUrl: "https://feeds.skynews.com/feeds/rss/world.xml",
  },
  {
    id: "wapo",
    name: "The Washington Post",
    language: "en",
    rssUrl: "https://feeds.washingtonpost.com/rss/world",
  },
  {
    id: "nytimes",
    name: "The New York Times",
    language: "en",
    rssUrl: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
  },
  {
    id: "axios",
    name: "Axios",
    language: "en",
    rssUrl: "https://www.axios.com/feeds/feed.rss",
  },
  {
    id: "wsj",
    name: "The Wall Street Journal",
    language: "en",
    rssUrl: gnewsEn("wsj.com"),
  },
  {
    id: "ft",
    name: "Financial Times",
    language: "en",
    rssUrl: "https://www.ft.com/world?format=rss",
  },
  {
    id: "reuters",
    name: "Reuters",
    language: "en",
    rssUrl: gnewsEn("reuters.com"),
  },
  {
    id: "afp",
    name: "AFP",
    language: "en",
    rssUrl: gnewsEn("afp.com"),
  },
  {
    id: "ap",
    name: "AP News",
    language: "en",
    rssUrl: gnewsEn("apnews.com"),
  },
  {
    id: "aawsat",
    name: "الشرق الأوسط",
    language: "ar",
    rssUrl: "https://aawsat.com/feed",
  },
  {
    id: "al-ain",
    name: "العين الإخبارية",
    language: "ar",
    rssUrl: gnewsAr("al-ain.com"),
  },
  {
    id: "sky-arabia",
    name: "سكاي نيوز عربية",
    language: "ar",
    rssUrl: gnewsAr("skynewsarabia.com"),
  },
  {
    id: "bbc-world",
    name: "BBC World",
    language: "en",
    rssUrl: "https://feeds.bbci.co.uk/news/world/rss.xml",
  },
  {
    id: "cnn",
    name: "CNN",
    language: "en",
    rssUrl: gnewsEn("cnn.com"),
  },
  {
    id: "youm7",
    name: "اليوم السابع",
    language: "ar",
    rssUrl: "https://www.youm7.com/rss/SectionRss?SectionID=65",
  },
  {
    id: "almasryalyoum",
    name: "المصري اليوم",
    language: "ar",
    rssUrl: gnewsAr("almasryalyoum.com"),
  },
];
