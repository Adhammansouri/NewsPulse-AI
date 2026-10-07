import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { env } from "../config/index.js";
import { NotFoundError } from "../utils/errors.js";

const CONVERSATION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ASSET_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d{1,2}$/i;

export function carouselRoot() {
  return resolve(dirname(env.editorialStorePath), "carousel");
}

function slidePath(conversationId: string, assetId: string) {
  if (!CONVERSATION_ID.test(conversationId) || !ASSET_ID.test(assetId)) throw new NotFoundError();
  const root = carouselRoot();
  const file = resolve(root, conversationId, `${assetId}.png`);
  const fromRoot = relative(root, file);
  if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) throw new NotFoundError();
  return file;
}

export function writeCarouselAsset(conversationId: string, assetId: string, bytes: Buffer) {
  const file = slidePath(conversationId, assetId);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, bytes);
}

export function readCarouselAsset(conversationId: string, assetId: string) {
  const file = slidePath(conversationId, assetId);
  try {
    return readFileSync(file);
  } catch {
    throw new NotFoundError();
  }
}

export function carouselAssetId(versionId: string, index: number) {
  return `${versionId}-${index}`;
}
