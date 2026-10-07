import type { FastifyPluginAsync } from "fastify";
import { requireApiAuthUnlessPublic } from "../middleware/requireAuth.js";
import { createAuthRoutes } from "./authRoutes.js";
import { healthRoutes } from "./healthRoutes.js";
import { createPushRoutes } from "./pushRoutes.js";
import { createNewsRoutes } from "./newsRoutes.js";
import { createEditorialRoutes } from "./editorialRoutes.js";
import { createGenerateRoutes } from "./generateRoutes.js";
import { createTranslateRoutes } from "./translateRoutes.js";
import { createOpenAIUsageRoutes } from "./openaiUsageRoutes.js";
import { OpenAIUsageService } from "../services/openaiUsageService.js";
import type { AuthService } from "../services/authService.js";
import type { PushService } from "../services/pushService.js";
import type { NewsService } from "../services/newsService.js";
import type { EditorialConversationService } from "../services/editorialConversationService.js";
import type { GenerateService } from "../services/generateService.js";
import type { TranslateService } from "../services/translateService.js";

type ApiServices = {
  authService: AuthService;
  pushService: PushService;
  newsService: NewsService;
  editorialService: EditorialConversationService;
  generateService: GenerateService;
  translateService: TranslateService;
};

export function createApiRoutes(services: ApiServices): FastifyPluginAsync {
  return async (app) => {
    app.addHook("onRequest", requireApiAuthUnlessPublic);
    await app.register(healthRoutes);
    await app.register(createAuthRoutes(services.authService));
    await app.register(createPushRoutes(services.pushService));
    await app.register(createNewsRoutes(services.newsService));
    await app.register(createEditorialRoutes(services.editorialService));
    await app.register(createGenerateRoutes(services.generateService));
    await app.register(createTranslateRoutes(services.translateService));
    await app.register(createOpenAIUsageRoutes(new OpenAIUsageService(), services.authService));
  };
}
