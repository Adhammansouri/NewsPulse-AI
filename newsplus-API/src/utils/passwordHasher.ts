import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, stored: string): Promise<boolean>;
}

export class ScryptPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derived = (await scryptAsync(plain, salt, KEY_LENGTH)) as Buffer;
    return `${salt}:${derived.toString("hex")}`;
  }

  async verify(plain: string, stored: string): Promise<boolean> {
    const [salt, digest] = stored.split(":");
    if (!salt || !digest) return false;

    const derived = (await scryptAsync(plain, salt, KEY_LENGTH)) as Buffer;
    const expected = Buffer.from(digest, "hex");
    if (derived.length !== expected.length) return false;

    return timingSafeEqual(derived, expected);
  }
}