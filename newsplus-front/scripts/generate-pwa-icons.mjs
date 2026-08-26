import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const frontDir = path.resolve(rootDir, "..");
const src = path.join(frontDir, "public", "icons", "logo-icon.png");
const outDir = path.join(frontDir, "public", "pwa");
const NAVY = { r: 12, g: 35, b: 64, alpha: 1 };

async function square(size, dest) {
  await sharp(src)
    .resize(size, size, { fit: "contain", background: NAVY })
    .png()
    .toFile(dest);
}

async function maskable(size, dest) {
  const inner = Math.round(size * 0.8);
  const padded = await sharp(src)
    .resize(inner, inner, { fit: "contain", background: NAVY })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  })
    .composite([{ input: padded, gravity: "centre" }])
    .png()
    .toFile(dest);
}

await mkdir(outDir, { recursive: true });
await square(192, path.join(outDir, "pwa-192x192.png"));
await square(512, path.join(outDir, "pwa-512x512.png"));
await maskable(192, path.join(outDir, "pwa-maskable-192x192.png"));
await maskable(512, path.join(outDir, "pwa-maskable-512x512.png"));
await square(180, path.join(outDir, "apple-touch-icon.png"));
await copyFile(path.join(outDir, "apple-touch-icon.png"), path.join(frontDir, "public", "apple-touch-icon.png"));
console.log("PWA icons written to public/pwa and public/apple-touch-icon.png");
