import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { requiredInProduction } from "./config/env.js";

function withNodeEnv<T>(value: string | undefined, run: () => T): T {
  const previous = process.env.NODE_ENV;
  if (value === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = value;
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
}

test("requiredInProduction keeps a set value and falls back only outside production", () => {
  assert.equal(withNodeEnv("production", () => requiredInProduction("AUTH_SEED_PASSWORD", "s3cret", "123456")), "s3cret");
  assert.equal(withNodeEnv("development", () => requiredInProduction("AUTH_SEED_PASSWORD", undefined, "123456")), "123456");
  assert.equal(withNodeEnv(undefined, () => requiredInProduction("AUTH_SEED_PASSWORD", "", "123456")), "123456");
  assert.throws(
    () => withNodeEnv("production", () => requiredInProduction("AUTH_SEED_PASSWORD", undefined, "123456")),
    /AUTH_SEED_PASSWORD is required in production/,
  );
  assert.throws(
    () => withNodeEnv("production", () => requiredInProduction("AUTH_SEED_PASSWORD", "", "123456")),
    /AUTH_SEED_PASSWORD is required in production/,
  );
});

/** Loads the real config module in a fresh process with `env` (the module reads process.env once, on import). */
function loadConfig(env: Record<string, string>) {
  const base = { ...process.env };
  delete base.AUTH_SEED_PASSWORD;
  delete base.JWT_SECRET;
  return spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", "await import('./src/config/env.ts')"],
    { cwd: process.cwd(), env: { ...base, ...env }, encoding: "utf8" },
  );
}

test("the API refuses to start in production without AUTH_SEED_PASSWORD", () => {
  const missing = loadConfig({ NODE_ENV: "production", JWT_SECRET: "jwt" });
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /AUTH_SEED_PASSWORD is required in production/);

  const set = loadConfig({ NODE_ENV: "production", JWT_SECRET: "jwt", AUTH_SEED_PASSWORD: "s3cret" });
  assert.equal(set.status, 0, set.stderr);

  const dev = loadConfig({ NODE_ENV: "development" });
  assert.equal(dev.status, 0, dev.stderr);
});
