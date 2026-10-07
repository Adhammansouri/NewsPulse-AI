import assert from "node:assert/strict";
import { test } from "node:test";
import { ScryptPasswordHasher } from "../utils/passwordHasher.js";
import { AuthService } from "./authService.js";
import { InMemoryUserRepository } from "./userRepository.js";

test("restarting the seed repository preserves the user behind an existing session and push subscriptions", async () => {
  const hasher = new ScryptPasswordHasher();
  const seed = { username: "NewsEditor", password: "test-only-password", email: "editor@example.com" };
  const before = await InMemoryUserRepository.seed(hasher, seed);
  const signedIn = await before.findByLoginIdentifier(seed.username);
  assert.ok(signedIn);
  const after = await InMemoryUserRepository.seed(hasher, { ...seed, username: " newseditor " });
  const auth = new AuthService({ users: after, hasher, mailer: { async send() {} }, tokens: { sign: () => "unused" } });
  assert.equal((await auth.getUserById(signedIn.id)).id, signedIn.id);
  const other = await InMemoryUserRepository.seed(hasher, { ...seed, username: "OtherEditor" });
  assert.notEqual((await other.findByLoginIdentifier("OtherEditor"))?.id, signedIn.id);
});
