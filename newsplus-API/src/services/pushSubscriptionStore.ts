import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export type StoredPushSubscription = {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime: number | null;
  createdAt: string;
  updatedAt: string;
};

export class FilePushSubscriptionStore {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn);
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async readAll(): Promise<StoredPushSubscription[]> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as StoredPushSubscription[]) : [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  private async writeAll(items: StoredPushSubscription[]) {
    await mkdir(dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    await writeFile(tmp, `${JSON.stringify(items, null, 2)}\n`, "utf8");
    await rename(tmp, this.filePath);
  }

  upsert(record: StoredPushSubscription) {
    return this.withLock(async () => {
      const items = await this.readAll();
      const index = items.findIndex((item) => item.endpoint === record.endpoint);
      if (index === -1) items.push(record);
      else items[index] = { ...items[index], ...record, createdAt: items[index].createdAt };
      await this.writeAll(items);
    });
  }

  removeByEndpoint(userId: string, endpoint: string) {
    return this.withLock(async () => {
      const items = await this.readAll();
      await this.writeAll(items.filter((item) => !(item.userId === userId && item.endpoint === endpoint)));
    });
  }

  listByUserId(userId: string) {
    return this.withLock(async () => {
      const items = await this.readAll();
      return items.filter((item) => item.userId === userId);
    });
  }

  removeEndpoint(endpoint: string) {
    return this.withLock(async () => {
      const items = await this.readAll();
      await this.writeAll(items.filter((item) => item.endpoint !== endpoint));
    });
  }
}
