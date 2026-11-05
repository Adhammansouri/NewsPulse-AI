// Visual QA for the redesign. Mocks the API with fixtures, logs in, and captures every
// route of a sprint at desktop (1440×900) and mobile (390×844), light and dark.
// Usage:  node docs/redesign/qa-tools/shots.mjs S04   (dev server must run on http://localhost:5173)
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import * as F from "./fixtures.mjs";

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
const routes = sprint === "ALL" ? Object.values(ROUTES).flat() : (ROUTES[sprint] || []);

const ok = (data) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success", data }) });
async function mockApi(page, { session = true, theme = "light" } = {}) {
  await page.addInitScript(([session, theme]) => {
    localStorage.setItem("newsplus-theme", theme);
    if (session) localStorage.setItem("newsplus-session", JSON.stringify({ token: "qa", user: { id: "u1", identifier: "sara", displayName: "سارة", role: "admin" } }));
  }, [session, theme]);
  await page.route("**/api/**", async (route) => {
    const u = new URL(route.request().url());
    const p = u.pathname.replace(/^\/api/, "");
    if (p === "/auth/me") return route.fulfill(ok({ user: { id: "u1", identifier: "sara", displayName: "سارة", role: "admin" } }));
    if (p === "/health") return route.fulfill(ok({ status: "ok", app: "newsplus", version: "qa", phase: "qa", openai: true }));
    if (p === "/news/sources") return route.fulfill(ok({ sources: F.sources }));
    if (p === "/news/feed") return route.fulfill(ok({ fetchedAt: new Date().toISOString(), items: F.items }));
    if (p === "/news/summarize") return route.fulfill(ok(F.summary));
    if (p === "/editorial/conversations") return route.fulfill(ok({ items: [F.conversation] }));
    if (p.startsWith("/editorial/conversations/")) return route.fulfill(ok(F.conversation));
    if (p === "/editorial/memory") return route.fulfill(ok({ rules: [] }));
    if (p === "/generate") return route.fulfill(ok(F.generate));
    if (p === "/translate") return route.fulfill(ok({ original: "", translated: "The central bank held interest rates steady for a third consecutive time.", sourceLanguage: "ar", targetLanguage: "en" }));
    if (p === "/push/vapid-key") return route.fulfill(ok({ publicKey: "", configured: true }));
    // S16: an onboarded editor (otherwise every route redirects to /welcome); /welcome itself still renders.
    if (p === "/me/preferences") return route.fulfill(ok({ platforms: [], sources: [], onboardedAt: new Date().toISOString() }));
    if (p === "/news/hook-styles") return route.fulfill(ok({ direct: "المركزي يثبّت الفائدة للمرة الثالثة على التوالي", question: "هل انتهى زمن خفض الفائدة؟ المركزي يثبّتها للمرة الثالثة", number: "٣ مرات ورا بعض: المركزي ما بيتحركش قبل التضخم" }));
    return route.fulfill(ok({}));
  });
}

const browser = await chromium.launch();
for (const [vw, vh, tag] of [[1440, 900, "desk"], [390, 844, "mob"]]) {
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: tag === "mob", hasTouch: tag === "mob" });
    const page = await ctx.newPage();
    const isLogin = routes.some(([n]) => n === "login");
    await mockApi(page, { session: !isLogin, theme });
    for (const [name, url] of routes) {
      await page.goto(BASE + url, { waitUntil: "networkidle" }).catch(() => {});
      await page.evaluate(() => document.fonts.ready).catch(() => {});
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUT, `${tag}-${theme}-${name}.png`) });
    }
    await ctx.close();
  }
}
await browser.close();
console.log("Saved to", OUT, "— compare with docs/redesign/design/screens/*.jpg");
