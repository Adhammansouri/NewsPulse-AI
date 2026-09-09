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
  // Arabic — pan-Arab
  {
    id: "bbc-ar",
    name: "BBC News عربي",
    language: "ar",
    rssUrl: "https://feeds.bbci.co.uk/arabic/rss.xml",
  },
  {
    id: "aljazeera-ar",
    name: "الجزيرة نت",
    language: "ar",
    rssUrl: gnewsAr("aljazeera.net"),
  },
  {
    id: "alarabiya",
    name: "العربية",
    language: "ar",
    rssUrl: gnewsAr("alarabiya.net"),
  },
  {
    id: "asharq",
    name: "الشرق للأخبار",
    language: "ar",
    rssUrl: gnewsAr("asharq.com"),
  },
  {
    id: "sky-arabia",
    name: "سكاي نيوز عربية",
    language: "ar",
    rssUrl: gnewsAr("skynewsarabia.com"),
  },
  {
    id: "al-ain",
    name: "العين الإخبارية",
    language: "ar",
    rssUrl: gnewsAr("al-ain.com"),
  },
  {
    id: "alaraby",
    name: "العربي الجديد",
    language: "ar",
    rssUrl: gnewsAr("alaraby.co.uk"),
  },
  {
    id: "independent-ar",
    name: "إندبندنت عربية",
    language: "ar",
    rssUrl: "https://www.independentarabia.com/rss.xml",
  },
  {
    id: "aawsat",
    name: "الشرق الأوسط",
    language: "ar",
    rssUrl: "https://aawsat.com/feed",
  },
  {
    id: "alquds-ar",
    name: "القدس العربي",
    language: "ar",
    rssUrl: gnewsAr("alquds.co.uk"),
  },

  // Arabic — international
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
    id: "cnn-ar",
    name: "CNN بالعربية",
    language: "ar",
    rssUrl: "https://arabic.cnn.com/rss",
  },
  {
    id: "euronews-ar",
    name: "Euronews عربي",
    language: "ar",
    rssUrl: "https://arabic.euronews.com/rss",
  },
  {
    id: "rt-ar",
    name: "RT Arabic",
    language: "ar",
    rssUrl: "https://arabic.rt.com/rss/",
  },
  {
    id: "trt-ar",
    name: "TRT عربي",
    language: "ar",
    rssUrl: gnewsAr("trtarabi.com"),
  },
  {
    id: "alhurra",
    name: "الحرة",
    language: "ar",
    rssUrl: "https://www.alhurra.com/rss",
  },
  {
    id: "monte-carlo",
    name: "مونت كارلو الدولية",
    language: "ar",
    rssUrl: gnewsAr("mc-doualiya.com"),
  },
  {
    id: "swissinfo-ar",
    name: "SWI swissinfo عربي",
    language: "ar",
    rssUrl: gnewsAr("swissinfo.ch/ara"),
  },
  {
    id: "anadolu-ar",
    name: "الأناضول العربية",
    language: "ar",
    rssUrl: gnewsAr("aa.com.tr/ar"),
  },
  {
    id: "sputnik-ar",
    name: "سبوتنيك عربي",
    language: "ar",
    rssUrl: "https://sputnikarabic.ae/export/rss2/archive/index.xml",
  },
  {
    id: "cgtn-ar",
    name: "CGTN العربية",
    language: "ar",
    rssUrl: gnewsAr("arabic.cgtn.com"),
  },

  // Arabic — local
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
  {
    id: "hespress",
    name: "هسبريس",
    language: "ar",
    rssUrl: "https://www.hespress.com/feed",
  },

  // English
  {
    id: "aljazeera",
    name: "Al Jazeera",
    language: "en",
    rssUrl: gnewsEn("aljazeera.com"),
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
];
