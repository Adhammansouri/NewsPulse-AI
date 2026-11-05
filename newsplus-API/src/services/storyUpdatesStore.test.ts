import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { latestPerSource, snapshotAt, STORY_UPDATES_KEEP_MS, StoryUpdatesStore, type StoryObservation } from "./storyUpdatesStore.js";

const MIN = 60_000;
const NOW = Date.UTC(2026, 10, 5, 15, 0);

const stores: StoryUpdatesStore[] = [];
const dirs: string[] = [];

function openStore(path = ":memory:") {
  const store = new StoryUpdatesStore(path);
  stores.push(store);
  return store;
}

afterEach(() => {
  while (stores.length > 0) stores.pop()?.close();
  while (dirs.length > 0) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

function source(sourceId: string, headline: string, publishedAt: number, excerpt = "") {
  return { sourceId, headline, excerpt, url: `https://example.com/${sourceId}`, publishedAt };
}

test("snapshotAt: a new source is recorded at its publish time, inside the 48 hours only", () => {
  assert.equal(snapshotAt(undefined, source("a", "x", NOW - 8 * MIN), NOW), NOW - 8 * MIN);
  assert.equal(snapshotAt(undefined, source("a", "x", NOW + 5 * MIN), NOW), NOW, "a future publish time is clamped to now");
  assert.equal(snapshotAt(undefined, source("a", "x", NOW - STORY_UPDATES_KEEP_MS - MIN), NOW), null);
});

test("snapshotAt: unchanged text is skipped; a changed headline or excerpt is a new snapshot", () => {
  const previous = { headline: "x", excerpt: "e", atMs: NOW - 30 * MIN };
  assert.equal(snapshotAt(previous, source("a", "x", NOW - 30 * MIN, "e"), NOW), null);
  assert.equal(snapshotAt(previous, source("a", "x2", NOW - 30 * MIN, "e"), NOW), NOW, "same publish time → now");
  assert.equal(snapshotAt(previous, source("a", "x", NOW - 2 * MIN, "e2"), NOW), NOW - 2 * MIN, "the feed moved it on");
});

test("latestPerSource keeps the newest article of each outlet", () => {
  const picked = latestPerSource([source("a", "old", NOW - 9 * MIN), source("b", "b", NOW - 5 * MIN), source("a", "new", NOW - 1 * MIN)]);
  assert.deepEqual(
    picked.map((entry) => [entry.sourceId, entry.headline]),
    [
      ["a", "new"],
      ["b", "b"],
    ],
  );
});

test("record writes a snapshot when a source joins or changes, never twice for the same text", () => {
  const store = openStore();
  const first: StoryObservation[] = [{ itemId: "story-1", sources: [source("a", "أول خبر", NOW - 12 * MIN)] }];
  assert.equal(store.record(first, NOW), 1);
  assert.equal(store.record(first, NOW + MIN), 0, "an unchanged refresh writes nothing");

  const grown: StoryObservation[] = [
    { itemId: "story-1", sources: [source("a", "أول خبر", NOW - 12 * MIN), source("b", "التضخم ٣٫١٪", NOW - 9 * MIN)] },
  ];
  assert.equal(store.record(grown, NOW + 2 * MIN), 1);
  const changed: StoryObservation[] = [
    { itemId: "story-1", sources: [source("a", "أول خبر: تحديث", NOW - 12 * MIN), source("b", "التضخم ٣٫١٪", NOW - 9 * MIN)] },
  ];
  assert.equal(store.record(changed, NOW + 3 * MIN), 1);

  const updates = store.list("story-1", NOW + 3 * MIN);
  assert.deepEqual(
    updates.map((update) => [update.sourceId, update.headline, update.atMs]),
    [
      ["a", "أول خبر", NOW - 12 * MIN],
      ["b", "التضخم ٣٫١٪", NOW - 9 * MIN],
      ["a", "أول خبر: تحديث", NOW + 3 * MIN],
    ],
  );
  assert.equal(updates[0].url, "https://example.com/a");
  assert.deepEqual(store.list("other", NOW), []);
});

test("record prunes snapshots older than 48 hours; list never returns them", () => {
  const store = openStore();
  store.record([{ itemId: "story-1", sources: [source("a", "x", NOW - 47 * 60 * MIN)] }], NOW);
  store.record([{ itemId: "story-2", sources: [source("b", "y", NOW - 10 * MIN)] }], NOW);
  assert.equal(store.list("story-1", NOW).length, 1);

  const later = NOW + 2 * 60 * MIN;
  assert.equal(store.list("story-1", later).length, 0, "list filters by the 48-hour window");
  store.record([], later);
  // The row itself is gone: an unchanged old source is not re-added either (outside the window).
  assert.equal(store.record([{ itemId: "story-1", sources: [source("a", "x", NOW - 47 * 60 * MIN)] }], later), 0);
  assert.equal(store.list("story-2", later).length, 1);
});

test("list returns the newest snapshots, oldest first, bounded", () => {
  const store = openStore();
  for (let index = 0; index < 6; index += 1) {
    store.record([{ itemId: "story-1", sources: [source("a", `headline ${index}`, NOW - (10 - index) * MIN)] }], NOW - (10 - index) * MIN);
  }
  const updates = store.list("story-1", NOW, 3);
  assert.deepEqual(
    updates.map((update) => update.headline),
    ["headline 3", "headline 4", "headline 5"],
  );
});

test("the migration is idempotent on an existing database file", () => {
  const directory = mkdtempSync(join(tmpdir(), "newsplus-s14-store-"));
  dirs.push(directory);
  const path = join(directory, "editorial.sqlite");
  const first = new StoryUpdatesStore(path);
  first.record([{ itemId: "story-1", sources: [source("a", "x", NOW - MIN)] }], NOW);
  first.close();
  const reopened = openStore(path);
  assert.equal(reopened.list("story-1", NOW).length, 1, "the rows survive a second migration");
});

test("the aggregator hands every refresh's stories, with each outlet's own article, to the recorder", async () => {
  const { NewsAggregator } = await import("./newsAggregator.js");
  const { NEWS_SOURCES } = await import("../config/newsSources.js");
  const [one, two] = NEWS_SOURCES;
  const recorded: StoryObservation[][] = [];
  const silent = { warn() {}, info() {}, error() {} } as unknown as ConstructorParameters<typeof NewsAggregator>[0];
  const aggregator = new NewsAggregator(silent, { record: (stories) => recorded.push(stories) });
  const now = Date.now();
  const raw = (source: typeof one, title: string, minutesAgo: number) => ({
    source,
    title,
    link: `https://example.com/${source.id}`,
    excerpt: `${source.id} excerpt`,
    publishedAt: now - minutesAgo * MIN,
  });
  Object.assign(aggregator, {
    fetchSource: async (source: typeof one) =>
      source.id === one.id
        ? [raw(one, "البنك المركزي يثبت أسعار الفائدة للمرة الثالثة", 12)]
        : source.id === two.id
          ? [raw(two, "البنك المركزي يثبت أسعار الفائدة والتضخم فوق المستهدف", 9)]
          : [],
  });
  const feed = await aggregator.getFeed();
  assert.equal(recorded.length, 1);
  const story = recorded[0].find((entry) => entry.itemId === feed.items[0].id);
  assert.ok(story, "the story is recorded under its feed id");
  assert.deepEqual(
    story.sources.map((entry) => [entry.sourceId, entry.headline, entry.excerpt, entry.publishedAt]).sort(),
    [
      [one.id, "البنك المركزي يثبت أسعار الفائدة للمرة الثالثة", `${one.id} excerpt`, now - 12 * MIN],
      [two.id, "البنك المركزي يثبت أسعار الفائدة والتضخم فوق المستهدف", `${two.id} excerpt`, now - 9 * MIN],
    ].sort(),
  );
});
