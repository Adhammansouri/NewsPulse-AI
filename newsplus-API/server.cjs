const { copyFileSync, existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync } = require("node:fs");
const { execSync } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const { join, dirname } = require("node:path");

const root = __dirname;
const localEnvPath = join(root, ".env");
const hostingerPath = "/opt/alt/alt-nodejs20/root/bin:/usr/bin:/bin";

function logBoot(message) {
  console.error(`[newsplus-boot] ${message}`);
}

function findHostedEnvFile() {
  return [
    join(root, "../../config/.env"),
    join(root, "../../../config/.env"),
    localEnvPath,
  ].find((file) => existsSync(file));
}

function syncHostedEnv() {
  const hostedEnv = findHostedEnvFile();
  if (!hostedEnv || hostedEnv === localEnvPath) return hostedEnv ?? null;

  copyFileSync(hostedEnv, localEnvPath);
  return hostedEnv;
}

function upsertEnvValue(filePath, key, value) {
  mkdirSync(dirname(filePath), { recursive: true });

  if (!existsSync(filePath)) {
    writeFileSync(filePath, `${key}=${value}\n`, "utf8");
    return;
  }

  const current = readFileSync(filePath, "utf8");
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(current)) {
    writeFileSync(filePath, current.replace(pattern, `${key}=${value}`), "utf8");
    return;
  }

  appendFileSync(filePath, `\n${key}=${value}\n`, "utf8");
}

function ensureProductionSecrets(hostedEnvPath) {
  const isProduction = (process.env.NODE_ENV ?? "development") === "production";
  if (!isProduction) return;

  if (!process.env.JWT_SECRET) {
    const generated = randomBytes(32).toString("hex");
    process.env.JWT_SECRET = generated;
    upsertEnvValue(localEnvPath, "JWT_SECRET", generated);
    if (hostedEnvPath && hostedEnvPath !== localEnvPath) {
      upsertEnvValue(hostedEnvPath, "JWT_SECRET", generated);
    }
    logBoot("JWT_SECRET was missing in production; generated and persisted.");
  }

  if (!process.env.CORS_ORIGIN) {
    process.env.CORS_ORIGIN = "https://deepskyblue-ibis-463603.hostingersite.com";
  }
}

if (!existsSync(join(root, "node_modules", "fastify"))) {
  logBoot("Installing production dependencies...");
  execSync("npm install --omit=dev", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, PATH: `${hostingerPath}:${process.env.PATH ?? ""}` },
  });
}

if (!existsSync(join(root, "dist", "server.js"))) {
  logBoot("dist/server.js is missing. Run `npm run build` before starting the API.");
  process.exit(1);
}

const hostedEnvPath = syncHostedEnv();
require("dotenv/config");
ensureProductionSecrets(hostedEnvPath);

import("./dist/server.js")
  .then(({ startServer }) => startServer())
  .catch((error) => {
    logBoot(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
  });
