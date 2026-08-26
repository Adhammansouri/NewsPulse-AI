import { AuthService } from "./services/authService.js";
import { LogMailer } from "./services/mailer.js";
import type { ITokenIssuer } from "./services/tokenIssuer.js";
import { InMemoryUserRepository } from "./services/userRepository.js";
import type { FastifyInstance } from "fastify";
import { env } from "./config/index.js";
import { ScryptPasswordHasher } from "./utils/passwordHasher.js";
import { OpenAIClient } from "./ai/openaiClient.js";
import { NewsAggregator } from "./services/newsAggregator.js";
import { NewsService } from "./services/newsService.js";
import { GenerateService } from "./services/generateService.js";
import { TranslateService } from "./services/translateService.js";

export async function createAuthService(app: FastifyInstance): Promise<AuthService> {
  const hasher = new ScryptPasswordHasher();
  const users = await InMemoryUserRepository.seed(hasher, {
    username: env.authSeedIdentifier,
    password: env.authSeedPassword,
    email: env.authSeedEmail,
    phone: env.authSeedPhone,
    displayName: env.authSeedDisplayName,
  });
  const mailer = new LogMailer(app.log);
  const tokens: ITokenIssuer = {
    sign(payload) {
      return app.jwt.sign(payload);
    },
  };

  return new AuthService({ users, hasher, mailer, tokens });
}

export function createToolServices(app: FastifyInstance) {
  const openai = new OpenAIClient();
  const newsService = new NewsService({
    aggregator: new NewsAggregator(app.log),
    openai,
  });
  const generateService = new GenerateService(openai);
  const translateService = new TranslateService(openai);
  return { newsService, generateService, translateService };
}