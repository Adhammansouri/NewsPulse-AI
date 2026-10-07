import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, GlobalFonts, loadImage, type Canvas, type Image, type SKRSContext2D } from "@napi-rs/canvas";
import type { CarouselDensity, CarouselStyle } from "@newsplus/shared";
import type { CarouselPromptSlide } from "../ai/prompts/carousel.js";

const WIDTH = 1080;
const HEIGHT = 1350;
const EDGE = 64;
const PINK = "#FF2B7B";
const FRAME_RED = "#FF2D2D";

type DrawCtx = SKRSContext2D;

let fontReady = false;

function fontFile() {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, "../../assets/fonts/Cairo-Variable.ttf"),
    join(here, "../assets/fonts/Cairo-Variable.ttf"),
  ];
  return candidates.find((path) => existsSync(path)) ?? candidates[0];
}

function ensureFont() {
  if (fontReady) return;
  const registered = GlobalFonts.registerFromPath(fontFile(), "Cairo");
  if (!registered) throw new Error("cairo-font-missing");
  fontReady = true;
}

function contextOf(canvas: Canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-context");
  return ctx;
}

function useArabic(ctx: DrawCtx) {
  ctx.direction = "rtl";
  ctx.lang = "ar";
  ctx.letterSpacing = "0px";
  ctx.wordSpacing = "0px";
  ctx.fontKerning = "normal";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.textRendering = "optimizeLegibility";
}

function applyFont(ctx: DrawCtx, weight: number, size: number) {
  ctx.font = `${weight} ${size}px Cairo`;
  ctx.fontVariationSettings = `"wght" ${weight}, "slnt" 0`;
}

function wrapText(ctx: DrawCtx, text: string, maxWidth: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(next).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fitText(ctx: DrawCtx, text: string, maxWidth: number, maxLines: number, start: number, min: number, weight: number) {
  useArabic(ctx);
  for (let size = start; size >= min; size -= 2) {
    applyFont(ctx, weight, size);
    const lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
  }
  applyFont(ctx, weight, min);
  return { size: min, lines: wrapText(ctx, text, maxWidth).slice(0, maxLines) };
}

function drawLines(ctx: DrawCtx, lines: string[], size: number, right: number, baseline: number, leading = 1.28) {
  const step = size * leading;
  lines.forEach((line, index) => {
    ctx.fillText(line, right, baseline + index * step);
  });
  return baseline + (lines.length - 1) * step;
}

function drawCover(
  ctx: DrawCtx,
  image: Image,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  ctx.drawImage(image, x + (width - dw) / 2, y + (height - dh) / 2, dw, dh);
}

function drawMark(ctx: DrawCtx, x: number, y: number) {
  const size = 78;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 16);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.direction = "ltr";
  ctx.lang = "en";
  ctx.letterSpacing = "0px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#111111";
  applyFont(ctx, 800, 16);
  ctx.fillText("NEWS+", x + size / 2, y + size / 2 + 1);
  ctx.restore();
}

function drawWordmark(ctx: DrawCtx, y: number) {
  ctx.save();
  ctx.direction = "ltr";
  ctx.lang = "en";
  ctx.letterSpacing = "0.5px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  applyFont(ctx, 800, 34);
  ctx.fillText("NEWS+", WIDTH / 2, y);
  ctx.restore();
}

function fitLine(ctx: DrawCtx, text: string, maxWidth: number, start: number, min: number, weight: number) {
  useArabic(ctx);
  let size = start;
  applyFont(ctx, weight, size);
  while (size > min && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    applyFont(ctx, weight, size);
  }
  return size;
}

function drawPinkBar(ctx: DrawCtx, text: string, right: number, top: number, maxWidth: number, startSize: number) {
  useArabic(ctx);
  const size = fitLine(ctx, text, maxWidth - 48, startSize, 48, 800);
  applyFont(ctx, 800, size);
  const barWidth = Math.min(maxWidth, ctx.measureText(text).width + 44);
  const barHeight = Math.round(size * 1.42);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.fillStyle = PINK;
  ctx.beginPath();
  ctx.rect(right - barWidth, top, barWidth, barHeight);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, right - 22, top + barHeight / 2 + 1);
  ctx.textBaseline = "alphabetic";
  return top + barHeight;
}

export async function composeCarouselPoster(input: {
  photo: Buffer;
  style: CarouselStyle;
  density: CarouselDensity;
  mark: boolean;
  slide: CarouselPromptSlide;
}) {
  ensureFont();
  const photo = await loadImage(input.photo);
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = contextOf(canvas);
  const headline = input.slide.headline.trim();
  const banner = input.slide.banner.trim();
  const attribution = input.slide.attribution.trim();
  const right = WIDTH - EDGE;
  const column = WIDTH - EDGE * 2;

  if (input.style === "frame") {
    drawFrame(ctx, photo, input, headline, banner, attribution);
  } else {
    drawCinematic(ctx, photo, input, headline, banner, attribution, right, column);
  }

  return canvas.toBuffer("image/png");
}

function drawCinematic(
  ctx: DrawCtx,
  photo: Image,
  input: { density: CarouselDensity; mark: boolean },
  headline: string,
  banner: string,
  attribution: string,
  right: number,
  column: number,
) {
  drawCover(ctx, photo, 0, 0, WIDTH, HEIGHT);
  const shade = ctx.createLinearGradient(0, 0, 0, HEIGHT * 0.58);
  shade.addColorStop(0, "rgba(6,10,18,0.78)");
  shade.addColorStop(0.42, "rgba(6,10,18,0.38)");
  shade.addColorStop(1, "rgba(6,10,18,0)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, WIDTH, HEIGHT * 0.58);

  if (input.mark) drawMark(ctx, right - 78, 44);

  const withBar = input.density === "banner" && Boolean(banner);
  const fitted = fitText(ctx, headline, column, withBar ? 2 : 4, withBar ? 108 : 92, 58, 900);
  useArabic(ctx);
  applyFont(ctx, 900, fitted.size);
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 2;
  const firstBaseline = (input.mark ? 168 : 112) + fitted.size;
  const last = drawLines(ctx, fitted.lines, fitted.size, right, firstBaseline, 1.26);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (withBar) {
    drawPinkBar(ctx, banner, right, last + Math.round(fitted.size * 0.62), column, fitted.size);
  } else if (input.density === "line" && attribution) {
    const sub = fitText(ctx, attribution, column, 2, 36, 28, 700);
    useArabic(ctx);
    applyFont(ctx, 700, sub.size);
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    drawLines(ctx, sub.lines, sub.size, right, last + fitted.size * 0.34 + sub.size, 1.4);
  }
}

function drawFrame(
  ctx: DrawCtx,
  photo: Image,
  input: { density: CarouselDensity; mark: boolean },
  headline: string,
  banner: string,
  attribution: string,
) {
  const pad = 18;
  const header = input.mark ? 96 : pad;
  ctx.fillStyle = FRAME_RED;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (input.mark) drawWordmark(ctx, header / 2 + 4);

  const photoX = pad;
  const photoY = header;
  const photoW = WIDTH - pad * 2;
  const photoH = HEIGHT - header - pad;
  const textRight = photoX + photoW - 40;
  const textWidth = photoW - 80;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 26);
  ctx.clip();
  drawCover(ctx, photo, photoX, photoY, photoW, photoH);
  const shade = ctx.createLinearGradient(0, photoY + photoH * 0.42, 0, photoY + photoH);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(0.55, "rgba(0,0,0,0.35)");
  shade.addColorStop(1, "rgba(0,0,0,0.82)");
  ctx.fillStyle = shade;
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.restore();

  const punch = input.density === "banner" && Boolean(banner);
  const fitted = fitText(ctx, headline, textWidth, punch ? 2 : 3, 92, 52, 900);
  const punchSize = punch ? fitLine(ctx, banner, textWidth, fitted.size, 48, 900) : 0;
  const deck = input.density === "line" && attribution ? fitText(ctx, attribution, textWidth, 3, 34, 26, 700) : null;
  const headlineBlock = fitted.lines.length * fitted.size * 1.26;
  const punchBlock = punch ? punchSize * 1.3 + 8 : 0;
  const deckBlock = deck ? deck.lines.length * deck.size * 1.42 + 18 : 0;
  const baseline = photoY + photoH - 44 - deckBlock - punchBlock - headlineBlock + fitted.size;

  useArabic(ctx);
  applyFont(ctx, 900, fitted.size);
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 2;
  const last = drawLines(ctx, fitted.lines, fitted.size, textRight, baseline, 1.26);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (punch) {
    useArabic(ctx);
    applyFont(ctx, 900, punchSize);
    ctx.fillStyle = FRAME_RED;
    drawLines(ctx, [banner], punchSize, textRight, last + fitted.size * 0.2 + punchSize, 1.2);
  }

  if (deck) {
    useArabic(ctx);
    applyFont(ctx, 700, deck.size);
    ctx.fillStyle = "#ffffff";
    const deckTop = last + (punch ? punchSize * 1.35 + 16 : fitted.size * 0.3) + deck.size;
    drawLines(ctx, deck.lines, deck.size, textRight, deckTop, 1.42);
  }
}
