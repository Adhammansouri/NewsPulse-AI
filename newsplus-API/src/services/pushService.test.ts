import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Fastify from "fastify";
import webpush from "web-push";
import { ValidationError } from "../utils/errors.js";
import { FilePushSubscriptionStore } from "./pushSubscriptionStore.js";
import { PushService } from "./pushService.js";

test("push subscriptions cannot target private services or insecure URLs", async () => {
  const directory = await mkdtemp(join(tmpdir(), "newsplus-push-test-"));
  const store = new FilePushSubscriptionStore(join(directory, "subscriptions.json"));
  const app = Fastify({ logger: false });
  const service = new PushService(store, { ...webpush.generateVAPIDKeys(), subject: "mailto:editor@example.com" }, app.log);
  try {
    for (const endpoint of ["http://93.184.216.34/push", "https://127.0.0.1/push", "https://[::ffff:127.0.0.1]/push"]) {
      await assert.rejects(service.subscribe({ userId: "editor-1", endpoint, keys: { p256dh: "test", auth: "test" } }), ValidationError);
    }
    assert.equal((await store.listByUserId("editor-1")).length, 0);
  } finally { await app.close(); await rm(directory, { recursive: true, force: true }); }
});

test("legacy private subscriptions are never used for outgoing notifications", async () => {
  const directory = await mkdtemp(join(tmpdir(), "newsplus-push-test-"));
  const store = new FilePushSubscriptionStore(join(directory, "subscriptions.json"));
  const app = Fastify({ logger: false });
  const service = new PushService(store, { ...webpush.generateVAPIDKeys(), subject: "mailto:editor@example.com" }, app.log);
  const send = mock.method(webpush, "sendNotification", async () => ({ statusCode: 201, headers: {}, body: "" }));
  try {
    await store.upsert({ userId: "editor-1", endpoint: "https://127.0.0.1/private", keys: { p256dh: "test", auth: "test" }, expirationTime: null, createdAt: "2026-01-01", updatedAt: "2026-01-01" });
    assert.deepEqual(await service.sendTest("editor-1"), { sent: 0 });
    assert.equal(send.mock.callCount(), 0);
  } finally { send.mock.restore(); await app.close(); await rm(directory, { recursive: true, force: true }); }
});
