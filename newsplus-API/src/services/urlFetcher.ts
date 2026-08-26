import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { ValidationError } from "../utils/errors.js";

const FETCH_TIMEOUT_MS = 8_000;
const MAX_BYTES = 400_000;

function isPrivateAddress(address: string) {
  if (address === "::1" || address.startsWith("fe80:") || address.startsWith("fc") || address.startsWith("fd")) {
    return true;
  }

  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;

  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0 || a === 169 && b === 254) return true;
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

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
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
        "User-Agent": "Newsplus/0.1 (+https://newsplus.local)",
      },
    });

    if (!response.ok) {
      throw new ValidationError("url-blocked");
    }

    const buffer = await response.arrayBuffer();
    const sliced = buffer.byteLength > MAX_BYTES ? buffer.slice(0, MAX_BYTES) : buffer;
    const text = stripHtml(new TextDecoder("utf-8", { fatal: false }).decode(sliced));
    if (text.length < 80) return { url: url.toString(), text: "" };
    return { url: url.toString(), text: text.slice(0, 8_000) };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    return { url: url.toString(), text: "" };
  } finally {
    clearTimeout(timer);
  }
}
