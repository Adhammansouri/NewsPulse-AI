import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

function requiredInProduction(name: string, value: string | undefined, fallback: string) {
  if (value) return value;
  if ((process.env.NODE_ENV ?? "development") === "production") {
    throw new Error(`${name} is required in production`);
  }
  return fallback;
}

function defaultDataFile(fileName: string) {
  const candidates = [
    join("/data", fileName),
    join(process.cwd(), "../../config", fileName),
    join(process.cwd(), "../../../config", fileName),
  ];
  for (const candidate of candidates) {
    if (existsSync(dirname(candidate))) return candidate;
  }
  return join(process.cwd(), "data", fileName);
}

function defaultPushStorePath() {
  return defaultDataFile("push-subscriptions.json");
}

function defaultEditorialStorePath() {
  return defaultDataFile("editorial.sqlite");
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? "0.0.0.0",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5180",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModelGenerate: process.env.OPENAI_MODEL_GENERATE ?? process.env.OPENAI_MODEL ?? "gpt-5.6-sol",
  openaiModelSummarize: process.env.OPENAI_MODEL_SUMMARIZE ?? process.env.OPENAI_MODEL ?? "gpt-5.6-sol",
  openaiModelTranslate: process.env.OPENAI_MODEL_TRANSLATE ?? process.env.OPENAI_MODEL ?? "gpt-5.6-sol",
  openaiModelImage: process.env.OPENAI_MODEL_IMAGE ?? "gpt-image-1",
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: requiredInProduction("JWT_SECRET", process.env.JWT_SECRET, "newsplus-dev-jwt-secret"),
  authSeedIdentifier: process.env.AUTH_SEED_IDENTIFIER ?? "adham",
  authSeedPassword: process.env.AUTH_SEED_PASSWORD ?? "123456",
  authSeedEmail: process.env.AUTH_SEED_EMAIL ?? "adham@newsplus.local",
  authSeedPhone: process.env.AUTH_SEED_PHONE ?? "01000000000",
  authSeedDisplayName: process.env.AUTH_SEED_DISPLAY_NAME ?? "Adham",
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  vapidSubject: process.env.VAPID_SUBJECT ?? "mailto:newsplus@localhost",
  pushStorePath: process.env.PUSH_STORE_PATH ?? defaultPushStorePath(),
  editorialStorePath: process.env.EDITORIAL_STORE_PATH ?? defaultEditorialStorePath(),
} as const;
