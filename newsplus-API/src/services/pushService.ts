import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import webpush from "web-push";
import type { FastifyBaseLogger } from "fastify";
import { env } from "../config/index.js";
import { ServiceUnavailableError } from "../utils/errors.js";
import {
  FilePushSubscriptionStore,
  type StoredPushSubscription,
} from "./pushSubscriptionStore.js";

export type VapidKeys = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

export type PushSubscribeInput = {
  userId: string;
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

function resolveVapidKeys(log: FastifyBaseLogger): VapidKeys | null {
  if (env.vapidPublicKey && env.vapidPrivateKey) {
    return {
      publicKey: env.vapidPublicKey,
      privateKey: env.vapidPrivateKey,
      subject: env.vapidSubject,
    };
  }

  if (env.nodeEnv === "production") {
    log.warn("VAPID keys missing; Web Push is disabled");
    return null;
  }

  const vapidFile = join(dirname(env.pushStorePath), "vapid.json");
  if (existsSync(vapidFile)) {
    return JSON.parse(readFileSync(vapidFile, "utf8")) as VapidKeys;
  }

  const generated = webpush.generateVAPIDKeys();
  const keys: VapidKeys = {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
    subject: env.vapidSubject,
  };
  mkdirSync(dirname(vapidFile), { recursive: true });
  writeFileSync(vapidFile, `${JSON.stringify(keys, null, 2)}\n`, "utf8");
  log.warn({ vapidFile }, "Wrote development VAPID keys");
  return keys;
}

export class PushService {
  constructor(
    private readonly store: FilePushSubscriptionStore,
    private readonly keys: VapidKeys | null,
    private readonly log: FastifyBaseLogger,
  ) {
    if (keys) {
      webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
    }
  }

  getVapidPublicKey() {
    return {
      publicKey: this.keys?.publicKey ?? "",
      configured: Boolean(this.keys),
    };
  }

  private requireKeys() {
    if (!this.keys) throw new ServiceUnavailableError("push-not-configured");
    return this.keys;
  }

  async subscribe(input: PushSubscribeInput) {
    this.requireKeys();
    const now = new Date().toISOString();
    const record: StoredPushSubscription = {
      userId: input.userId,
      endpoint: input.endpoint,
      keys: input.keys,
      expirationTime: input.expirationTime ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await this.store.upsert(record);
    return { subscribed: true as const };
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.store.removeByEndpoint(userId, endpoint);
    return { unsubscribed: true as const };
  }

  async sendTest(userId: string) {
    this.requireKeys();
    const subscriptions = await this.store.listByUserId(userId);
    let sent = 0;

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          JSON.stringify({
            title: "Newsplus",
            body: "تم تفعيل الإشعارات بنجاح.",
            url: "/",
          }),
        );
        sent += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await this.store.removeEndpoint(subscription.endpoint);
        } else {
          this.log.warn({ err: error, endpoint: subscription.endpoint }, "push-send-failed");
        }
      }
    }

    return { sent };
  }
}

export function createPushService(log: FastifyBaseLogger) {
  return new PushService(new FilePushSubscriptionStore(env.pushStorePath), resolveVapidKeys(log), log);
}
