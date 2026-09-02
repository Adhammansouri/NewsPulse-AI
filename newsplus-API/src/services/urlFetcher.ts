import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { ValidationError } from "../utils/errors.js";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_BYTES = 500_000;
const MAX_TEXT = 16_000;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function isPrivateAddress(address: string) {
  if (address === "::1" || address.startsWith("fe80:") || address.startsWith("fc") || address.startsWith("fd")) {
    return true;
  }

  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;

  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254)) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

export function looksLikeHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function assertPublicHttpUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ValidationError("url-blocked");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ValidationError("url-blocked");
  }

  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new ValidationError("url-blocked");
  }

  const addresses = isIP(host)
    ? [host]
    : (await lookup(host, { all: true })).map((entry) => entry.address);

  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new ValidationError("url-blocked");
  }

  return url;
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

function extractReadableText(html: string) {
  const cleaned = stripNoise(html);
  const jsonLd = extractJsonLd(html);
  const article = extractTag(cleaned, "article");
  const main = extractTag(cleaned, "main");
  const fallback = stripHtml(cleaned);
  const ranked = [jsonLd, article, main, fallback].sort((left, right) => right.length - left.length);
  const body = ranked[0] ?? "";
  const title = extractMeta(html, "og:title") || extractTag(html, "title");
  const description = extractMeta(html, "og:description");
  const head = [title, description].filter(Boolean).join("\n");
  const combined = (head ? `${head}\n\n${body}` : body).trim();
  if (looksLikeConsentWall(combined)) return "";
  return combined.slice(0, MAX_TEXT);
}

export async function fetchPublicText(rawUrl: string): Promise<{ url: string; text: string }> {
  const url = await assertPublicHttpUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "Accept-Language": "ar,en-US;q=0.8,en;q=0.7",
        "User-Agent": BROWSER_UA,
      },
    });

    const landed = response.url || url.toString();
    await assertPublicHttpUrl(landed);

    if (!response.ok) {
      return { url: landed, text: "" };
    }

    const buffer = await response.arrayBuffer();
    const sliced = buffer.byteLength > MAX_BYTES ? buffer.slice(0, MAX_BYTES) : buffer;
    const html = new TextDecoder("utf-8", { fatal: false }).decode(sliced);
    const text = extractReadableText(html);
    if (text.length < 80) return { url: landed, text: "" };
    return { url: landed, text };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    return { url: url.toString(), text: "" };
  } finally {
    clearTimeout(timer);
  }
}
