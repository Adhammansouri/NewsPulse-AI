const SOURCE_HOSTS: Record<string, string> = {
  "bbc-ar": "bbc.com",
  "aljazeera-ar": "aljazeera.net",
  alarabiya: "alarabiya.net",
  asharq: "asharq.com",
  "sky-arabia": "skynewsarabia.com",
  "al-ain": "al-ain.com",
  alaraby: "alaraby.co.uk",
  "independent-ar": "independentarabia.com",
  aawsat: "aawsat.com",
  "alquds-ar": "alquds.co.uk",
  "france24-ar": "france24.com",
  "dw-ar": "dw.com",
  "cnn-ar": "arabic.cnn.com",
  "euronews-ar": "arabic.euronews.com",
  "rt-ar": "arabic.rt.com",
  "trt-ar": "trtarabi.com",
  alhurra: "alhurra.com",
  "monte-carlo": "mc-doualiya.com",
  "swissinfo-ar": "swissinfo.ch",
  "anadolu-ar": "aa.com.tr",
  "sputnik-ar": "sputnikarabic.ae",
  "cgtn-ar": "arabic.cgtn.com",
  youm7: "youm7.com",
  almasryalyoum: "almasryalyoum.com",
  hespress: "hespress.com",
  aljazeera: "aljazeera.com",
  "guardian-world": "theguardian.com",
  npr: "npr.org",
  "sky-world": "news.sky.com",
  wapo: "washingtonpost.com",
  nytimes: "nytimes.com",
  axios: "axios.com",
  wsj: "wsj.com",
  ft: "ft.com",
  reuters: "reuters.com",
  afp: "afp.com",
  ap: "apnews.com",
  "bbc-world": "bbc.com",
  cnn: "cnn.com",
};

const GENERIC_HOSTS = new Set([
  "news.google.com",
  "google.com",
  "news.google.co.uk",
  "news.google.com.eg",
]);

export function hostFromUrl(url?: string) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (!host || GENERIC_HOSTS.has(host)) return null;
    return host;
  } catch {
    return null;
  }
}

export function sourceHost(sourceId: string, url?: string) {
  return hostFromUrl(url) ?? SOURCE_HOSTS[sourceId] ?? null;
}

export function faviconUrl(host: string, size = 64) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`;
}
