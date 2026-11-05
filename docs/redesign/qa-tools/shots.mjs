// Visual QA for the redesign. Mocks the API with fixtures, logs in, and captures every
// route of a sprint at desktop (1440×900) and mobile (390×844), light and dark.
// Usage:  node docs/redesign/qa-tools/shots.mjs S04   (dev server must run on http://localhost:5173)
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { mockApi } from "./mock.mjs";

const sprint = (process.argv[2] || "all").toUpperCase();
const BASE = process.env.QA_BASE_URL || "http://localhost:5173";
const OUT = path.resolve("docs/redesign/qa", sprint);
fs.mkdirSync(OUT, { recursive: true });

// Route list per sprint. Add the new routes you create in a sprint here.
const ROUTES = {
  S01: [["design", "/__design"]],
  S02: [["home", "/"], ["more", "/more"]],
  S03: [["login", "/login"]],
  S04: [["news", "/news"]],
  S05: [["news-story", "/news?item=n1"]],
  S06: [["news-draft", "/news?item=n1&draft=social"]],
  S07: [["home", "/"]],
  S08: [["generate", "/generate"], ["translate", "/translate"]],
  S09: [["notifications", "/notifications"], ["usage", "/usage"]],
  S10: [["home", "/"], ["news", "/news"], ["generate", "/generate"]],
  S11: [["news", "/news"]],
  S12: [["publish", "/news?item=n1&draft=social&publish=1"]],
  S13: [["home", "/"], ["breaking", "/news?item=n1&breaking=1"]],
  S14: [["timeline", "/news?item=n1&tab=timeline"]],
  S15: [["board", "/board"]],
  S16: [["onboarding", "/welcome"]],
};
const routes = sprint === "ALL" ? [...new Map(Object.values(ROUTES).flat().map((r) => [r[0], r])).values()] : (ROUTES[sprint] || []);

const browser = await chromium.launch();
for (const [vw, vh, tag] of [[1440, 900, "desk"], [390, 844, "mob"]]) {
  for (const theme of ["light", "dark"]) {
    for (const [name, url] of routes) {
      // A context per route: the login route starts signed out, every other one signed in (S16: onboarded).
      const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: tag === "mob", hasTouch: tag === "mob", serviceWorkers: "block" });
      const page = await ctx.newPage();
      await mockApi(page, { session: name !== "login", theme });
      await page.goto(BASE + url, { waitUntil: "networkidle" }).catch(() => {});
      await page.evaluate(() => document.fonts.ready).catch(() => {});
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUT, `${tag}-${theme}-${name}.png`) });
      await ctx.close();
    }
  }
}
await browser.close();
console.log("Saved to", OUT, "— compare with docs/redesign/design/screens/*.jpg");
