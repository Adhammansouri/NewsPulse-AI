import { createHash } from "node:crypto";
import type { IPasswordHasher } from "../utils/passwordHasher.js";
import { normalizeEmail, normalizeIdentifier } from "../utils/identifier.js";
import type { UserRecord } from "../model/user.js";

export interface IUserRepository {
  findByLoginIdentifier(identifier: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
}

type SeedUser = {
  username: string;
  password: string;
  email: string;
  phone?: string;
  displayName?: string;
};

export class InMemoryUserRepository implements IUserRepository {
  private readonly users: UserRecord[] = [];

  static async seed(hasher: IPasswordHasher, seed: SeedUser): Promise<InMemoryUserRepository> {
    const repo = new InMemoryUserRepository();
    // The configured seed account must survive process restarts: JWT subjects,
    // editorial attribution and stored push subscriptions all refer to this ID.
    const identity = createHash("sha256").update(`newsplus:seed:${normalizeIdentifier(seed.username)}`).digest("hex");
    repo.users.push({
      id: `${identity.slice(0, 8)}-${identity.slice(8, 12)}-5${identity.slice(13, 16)}-a${identity.slice(17, 20)}-${identity.slice(20, 32)}`,
      username: normalizeIdentifier(seed.username),
      phone: seed.phone ? normalizeIdentifier(seed.phone) : null,
      email: normalizeEmail(seed.email),
      passwordHash: await hasher.hash(seed.password),
      displayName: seed.displayName ?? seed.username,
      role: "editor",
    });
    return repo;
  }

  async findByLoginIdentifier(identifier: string): Promise<UserRecord | null> {
    const key = normalizeIdentifier(identifier);
    return this.users.find((user) => user.username === key || user.phone === key) ?? null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const key = normalizeEmail(email);
    return this.users.find((user) => user.email === key) ?? null;
  }
}
