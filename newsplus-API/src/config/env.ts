function requiredInProduction(name: string, value: string | undefined, fallback: string) {
  if (value) return value;
  if ((process.env.NODE_ENV ?? "development") === "production") {
    throw new Error(`${name} is required in production`);
  }
  return fallback;
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? "0.0.0.0",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: requiredInProduction("JWT_SECRET", process.env.JWT_SECRET, "newsplus-dev-jwt-secret"),
  authSeedIdentifier: process.env.AUTH_SEED_IDENTIFIER ?? "adham",
  authSeedPassword: process.env.AUTH_SEED_PASSWORD ?? "123456",
  authSeedEmail: process.env.AUTH_SEED_EMAIL ?? "adham@newsplus.local",
  authSeedPhone: process.env.AUTH_SEED_PHONE ?? "01000000000",
  authSeedDisplayName: process.env.AUTH_SEED_DISPLAY_NAME ?? "Adham",
} as const;