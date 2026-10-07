import { BlockList, isIP, type LookupFunction } from "node:net";
import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { Readable } from "node:stream";
import { ValidationError } from "../utils/errors.js";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_BYTES = 500_000;
const MAX_TEXT = 16_000;
const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const validatedAddresses = new WeakMap<URL, string[]>();

const blockedAddresses = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10],
  ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.168.0.0", 16], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blockedAddresses.addSubnet(address, prefix, "ipv4");
for (const [address, prefix] of [
  ["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
] as const) blockedAddresses.addSubnet(address, prefix, "ipv6");

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function isPrivateAddress(address: string) {
  const family = isIP(address);
  return !family || blockedAddresses.check(address, family === 6 ? "ipv6" : "ipv4");
}

export function looksLikeHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function assertPublicHttpUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ValidationError("url-blocked");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ValidationError("url-blocked");
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (url.username || url.password) throw new ValidationError("url-blocked");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new ValidationError("url-blocked");
  }

  let addresses: string[];
  try {
    addresses = isIP(host) ? [host] : (await dns.lookup(host, { all: true })).map((entry) => entry.address);
  } catch {
    throw new ValidationError("url-blocked");
  }

  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new ValidationError("url-blocked");
  }

  validatedAddresses.set(url, addresses);
  return url;
}

function pinnedLookup(url: URL): LookupFunction {
  const addresses = validatedAddresses.get(url);
  if (!addresses?.length) throw new ValidationError("url-blocked");
  return (_hostname, options, callback) => {
    const candidates = addresses.map((address) => ({ address, family: isIP(address) }))
      .filter((item) => !options.family || item.family === options.family);
    if (!candidates.length) return callback(new Error("No validated address for this family"), []);
    if (options.all) callback(null, candidates);
    else callback(null, candidates[0]!.address, candidates[0]!.family);
  };
}

export function publicHttpsAgent(url: URL) {
  return new https.Agent({ lookup: pinnedLookup(url) });
}

function fetchValidatedUrl(url: URL, options: RequestInit): Promise<Response> {
  // Literal IPs have no second DNS resolution. Hostnames use the addresses that
  // passed validation, preventing a DNS change between checking and connecting.
  if (isIP(url.hostname.replace(/^\[|\]$/g, ""))) return fetch(url, options);
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request(url, {
      signal: options.signal ?? undefined,
      headers: Object.fromEntries(new Headers(options.headers)),
      lookup: pinnedLookup(url),
      agent: false,
    }, (incoming) => {
      try {
        const headers = new Headers();
        for (const [name, value] of Object.entries(incoming.headers)) {
          if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
          else if (value !== undefined) headers.set(name, value);
        }
        const status = incoming.statusCode ?? 502;
        const noBody = status === 204 || status === 205 || status === 304;
        if (noBody) incoming.resume();
        resolve(new Response(noBody ? null : Readable.toWeb(incoming) as ReadableStream<Uint8Array>, { status, headers }));
      } catch (error) {
        incoming.destroy();
        reject(error);
      }
    });
    request.on("error", reject);
    request.end();
  });
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function stripHtml(html: string) {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|blockquote|figcaption|section|article)>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim(),
  );
}

function stripNoise(html: string) {
  return html.replace(/<(script|style|noscript|nav|footer|header|aside|form|iframe|svg)[\s\S]*?<\/\1>/gi, " ");
}

function collectArticleBodies(node: unknown, out: string[]) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectArticleBodies(item, out);
    return;
  }

  const record = node as Record<string, unknown>;
  if (typeof record.articleBody === "string" && record.articleBody.trim().length > 80) {
    out.push(record.articleBody.trim());
  }
  if (record["@graph"]) collectArticleBodies(record["@graph"], out);
}

function extractJsonLd(html: string) {
  const bodies: string[] = [];
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      collectArticleBodies(JSON.parse(match[1]!.trim()), bodies);
    } catch {
      /* malformed ld+json */
    }
  }
  return bodies.join("\n\n");
}

function extractTag(html: string, tag: string) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripHtml(match[1]!) : "";
}

function extractMeta(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1]);
  }
  return "";
}

function looksLikeConsentWall(text: string) {
  if (text.length > 900) return false;
  const lower = text.toLowerCase();
  const markers = ["cookie", "consent", "enable javascript", "are you a robot", "access denied", "subscribe to continue"];
  return markers.filter((marker) => lower.includes(marker)).length >= 1;
}

function extractReadableText(html: string, rejectTruncated = false) {
  const cleaned = stripNoise(html);
  const jsonLd = extractJsonLd(html);
  const article = extractTag(cleaned, "article");
  const main = extractTag(cleaned, "main");
  const fallback = stripHtml(cleaned);
  const body = [jsonLd, article, main].find((candidate) => candidate.length >= 80) || fallback;
  const title = extractMeta(html, "og:title") || extractTag(html, "title");
  const description = extractMeta(html, "og:description");
  const head = [title, description].filter(Boolean).join("\n");
  const combined = (head ? `${head}\n\n${body}` : body).trim();
  if (looksLikeConsentWall(combined)) return "";
  if (rejectTruncated && combined.length > MAX_TEXT) throw new ValidationError("source-too-long");
  return combined.slice(0, MAX_TEXT);
}

async function readBoundedBody(response: Response, rejectTruncated = false) {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const remaining = MAX_BYTES - size;
      if (value.byteLength > remaining) {
        await reader.cancel();
        if (rejectTruncated) throw new ValidationError("source-too-long");
        chunks.push(value.subarray(0, remaining));
        size = MAX_BYTES;
        break;
      }
      chunks.push(value);
      size += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export async function fetchPublicText(rawUrl: string, options: { rejectTruncated?: boolean } = {}): Promise<{ url: string; text: string }> {
  let url = await assertPublicHttpUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let response: Response;
    for (let redirects = 0; ; redirects += 1) {
      response = await fetchValidatedUrl(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
          "Accept-Language": "ar,en-US;q=0.8,en;q=0.7",
          "User-Agent": BROWSER_UA,
        },
      });
      if (!REDIRECT_STATUSES.has(response.status)) break;
      await response.body?.cancel();
      const location = response.headers.get("location");
      if (!location || redirects >= MAX_REDIRECTS) throw new ValidationError("url-blocked");
      url = await assertPublicHttpUrl(new URL(location, url).toString());
    }

    const landed = url.toString();

    if (!response.ok) {
      await response.body?.cancel();
      return { url: landed, text: "" };
    }

    const buffer = await readBoundedBody(response, options.rejectTruncated);
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    const isPlainText = response.headers.get("content-type")?.split(";")[0]?.trim() === "text/plain" && !/<(?:html|article|p|div|script)\b/i.test(html);
    if (isPlainText && options.rejectTruncated && html.trim().length > MAX_TEXT) throw new ValidationError("source-too-long");
    const text = isPlainText ? html.trim().slice(0, MAX_TEXT) : extractReadableText(html, options.rejectTruncated);
    if (text.length < 80) return { url: landed, text: "" };
    return { url: landed, text };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    return { url: url.toString(), text: "" };
  } finally {
    clearTimeout(timer);
  }
}
