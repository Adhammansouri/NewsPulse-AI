import { randomUUID } from "node:crypto";
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
    repo.users.push({
      id: randomUUID(),
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