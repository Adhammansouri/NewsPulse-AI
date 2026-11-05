import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { userPreferencesUpdateBodySchema } from "../schemas/onboarding.schema.js";
import { ValidationError } from "../utils/errors.js";
import type { NewsAggregator } from "./newsAggregator.js";
import { UserPreferencesService } from "./userPreferencesService.js";
import { UserPreferencesStore } from "./userPreferencesStore.js";

const stores: UserPreferencesStore[] = [];

function openStore(path = ":memory:") {
  const store = new UserPreferencesStore(path);
  stores.push(store);
  return store;
}

afterEach(() => {
  while (stores.length > 0) stores.pop()?.close();
});

const aggregator = {
  listSources: () => [
    { id: "alarabiya", name: "العربية", language: "ar" as const },
    { id: "sky-arabia", name: "سكاي نيوز عربية", language: "ar" as const },
  ],
} as unknown as NewsAggregator;

test("a user with no row reads the empty preferences; save replaces the row", () => {
  const store = openStore();
  assert.deepEqual(store.get("u1"), { platforms: [], sources: [] });
  const saved = store.save("u1", { platforms: ["x", "telegram"], sources: ["alarabiya"], hookStyle: "number", onboardedAt: "2026-11-05T10:00:00.000Z" });
  assert.deepEqual(saved, { platforms: ["x", "telegram"], sources: ["alarabiya"], hookStyle: "number", onboardedAt: "2026-11-05T10:00:00.000Z" });
  assert.deepEqual(store.save("u1", { platforms: [], sources: [] }), { platforms: [], sources: [] });
  assert.deepEqual(store.get("u2"), { platforms: [], sources: [] }, "rows are per user");
});

test("the migration is idempotent and the row survives reopening the file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "newsplus-s16-store-"));
  const path = join(directory, "editorial.sqlite");
  try {
    const first = new UserPreferencesStore(path);
    first.save("u1", { platforms: ["instagram"], sources: [], onboardedAt: "2026-11-05T10:00:00.000Z" });
    first.close();
    const second = new UserPreferencesStore(path);
    assert.deepEqual(second.get("u1"), { platforms: ["instagram"], sources: [], onboardedAt: "2026-11-05T10:00:00.000Z" });
    second.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a damaged row reads as safe values", async () => {
  const directory = await mkdtemp(join(tmpdir(), "newsplus-s16-damaged-"));
  const path = join(directory, "editorial.sqlite");
  try {
    new UserPreferencesStore(path).close();
    const raw = new DatabaseSync(path);
    raw.prepare("INSERT INTO user_preferences (user_id, platforms, sources, hook_style, onboarded_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run("u1", '["x","myspace",3]', "not json", "emoji", null, new Date().toISOString());
    raw.close();
    const store = new UserPreferencesStore(path);
    assert.deepEqual(store.get("u1"), { platforms: ["x"], sources: [] });
    store.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("update: sent fields replace, the rest are kept, onboardedAt is stamped once, sources must be known", () => {
  let now = Date.parse("2026-11-05T10:00:00.000Z");
  const service = new UserPreferencesService({ store: openStore(), aggregator, now: () => now });

  assert.deepEqual(service.update("u1", { onboarded: true }), { platforms: [], sources: [], onboardedAt: "2026-11-05T10:00:00.000Z" });
  now += 60_000;
  assert.deepEqual(service.update("u1", { platforms: ["x"], sources: ["sky-arabia"], hookStyle: "question", onboarded: true }), {
    platforms: ["x"],
    sources: ["sky-arabia"],
    hookStyle: "question",
    onboardedAt: "2026-11-05T10:00:00.000Z",
  });
  assert.deepEqual(service.update("u1", { sources: [] }).platforms, ["x"]);
  assert.throws(() => service.update("u1", { sources: ["alarabiya", "made-up"] }), ValidationError);
  assert.deepEqual(service.get("u1").sources, [], "a refused update changes nothing");
  assert.equal(service.update("u2", { platforms: ["tiktok"] }).onboardedAt, undefined, "only `onboarded: true` stamps it");
});

test("the PUT body: bounded, enum-checked, strict, and repeats dropped in order", () => {
  const parse = (body: unknown) => userPreferencesUpdateBodySchema.safeParse(body);
  assert.deepEqual(parse({ platforms: ["telegram", "x", "telegram"], sources: [" alarabiya ", "alarabiya"] }).data, {
    platforms: ["telegram", "x"],
    sources: ["alarabiya"],
  });
  assert.deepEqual(parse({ onboarded: true }).data, { onboarded: true });
  for (const body of [null, {}, { onboarded: false }, { onboardedAt: "x" }, { platforms: ["X"] }, { hookStyle: "rhetorical" }, { sources: [1] }]) {
    assert.equal(parse(body).success, false, JSON.stringify(body));
  }
});
