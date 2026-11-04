// Browser + OS of this device for the notifications device line («Chrome على macOS»).
// Client Hints (`navigator.userAgentData`, Chromium) first, the user-agent string otherwise.

type UADataBrand = { brand: string; version: string };
type UAData = { brands?: UADataBrand[]; platform?: string; mobile?: boolean };

export type DeviceInfo = { browser: string | null; os: string | null };

const HINT_BRANDS: ReadonlyArray<readonly [brand: string, name: string]> = [
  ["Microsoft Edge", "Edge"],
  ["Opera", "Opera"],
  ["Brave", "Brave"],
  ["Samsung Internet", "Samsung Internet"],
  ["Google Chrome", "Chrome"],
];

const HINT_PLATFORMS: Readonly<Record<string, string>> = {
  macOS: "macOS",
  Windows: "Windows",
  Android: "Android",
  "Chrome OS": "ChromeOS",
  "Chromium OS": "ChromeOS",
  Linux: "Linux",
  iOS: "iPhone",
};

function browserFromUA(ua: string): string | null {
  if (/Edg(e|A|iOS)?\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/SamsungBrowser\//.test(ua)) return "Samsung Internet";
  if (/Firefox\/|FxiOS\//.test(ua)) return "Firefox";
  if (/CriOS\/|Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return null;
}

function osFromUA(ua: string, touchPoints: number): string | null {
  if (/iPhone|iPod/.test(ua)) return "iPhone";
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Mac OS X|Macintosh/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return null;
}

export function detectDevice(): DeviceInfo {
  if (typeof navigator === "undefined") return { browser: null, os: null };
  const ua = navigator.userAgent;
  const hints = (navigator as Navigator & { userAgentData?: UAData }).userAgentData;
  const brands = hints?.brands?.map((entry) => entry.brand) ?? [];
  const hinted = HINT_BRANDS.find(([brand]) => brands.includes(brand))?.[1];
  const platform = hints?.platform ? HINT_PLATFORMS[hints.platform] : undefined;
  return {
    browser: hinted ?? browserFromUA(ua),
    os: platform ?? osFromUA(ua, navigator.maxTouchPoints ?? 0),
  };
}

/** «Chrome على macOS» — whichever part is known. */
export function deviceLabel({ browser, os }: DeviceInfo): string {
  if (browser && os) return `${browser} على ${os}`;
  return browser ?? os ?? "";
}
