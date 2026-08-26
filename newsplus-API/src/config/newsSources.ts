export type NewsSourceLanguage = "ar" | "en";

export type NewsSourceConfig = {
  id: string;
  name: string;
  language: NewsSourceLanguage;
  rssUrl: string;
};

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
    rssUrl: "https://www.aljazeera.com/xml/rss/all.xml",
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
];
