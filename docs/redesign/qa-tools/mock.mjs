// The API as the QA shots see it: every route the front calls, answered from fixtures.mjs (sprint S01–S16).
import * as F from "./fixtures.mjs";

export const USER = { id: "u1", identifier: "sara", displayName: "سارة", role: "admin" };
const ok = (data) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success", data }) });

/** Mocks `**\/api/**` on `page`; `session: false` starts signed out (the login route). */
export async function mockApi(page, { session = true, theme = "light" } = {}) {
  await page.addInitScript(([session, theme, user]) => {
    localStorage.setItem("newsplus-theme", theme);
    if (session) localStorage.setItem("newsplus-session", JSON.stringify({ token: "qa", user }));
    else localStorage.removeItem("newsplus-session");
  }, [session, theme, USER]);
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname.replace(/^\/api/, "");
    if (p === "/auth/me") return route.fulfill(ok({ user: USER }));
    if (p === "/health") return route.fulfill(ok({ status: "ok", app: "newsplus", version: "qa", phase: "qa", openai: true }));
    if (p === "/news/sources") return route.fulfill(ok({ sources: F.sources }));
    if (p === "/news/feed") return route.fulfill(ok({ fetchedAt: new Date().toISOString(), items: F.items }));
    // The format asked for: the social post for «منشور سوشيال» (Main-social), the desk story otherwise.
    if (p === "/news/summarize") return route.fulfill(ok(route.request().postDataJSON()?.format === "social" ? F.socialSummary : F.summary));
    if (/^\/news\/items\/[^/]+\/timeline$/.test(p)) return route.fulfill(ok(F.timeline));
    if (p === "/news/breaking") return route.fulfill(ok(F.breaking));
    if (p === "/news/digest") return route.fulfill(ok(F.digest));
    if (p === "/presence") return route.fulfill(ok({ entries: [], ttlSeconds: 60 }));
    if (p === "/presence/heartbeat") return route.fulfill(ok({ entry: { user: { id: USER.id, displayName: USER.displayName, color: "#0d9488" }, activity: "viewing", lastSeenAt: new Date().toISOString() }, ttlSeconds: 60 }));
    if (p === "/editorial/conversations") return route.fulfill(ok({ items: [F.socialConversation, F.conversation] }));
    if (p.startsWith("/editorial/conversations/") && p.endsWith("/check")) return route.fulfill(ok(F.publishCheck));
    if (p.startsWith("/editorial/conversations/c2")) return route.fulfill(ok(F.socialConversation));
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
