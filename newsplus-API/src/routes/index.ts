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
import { createPresenceRoutes } from "./presenceRoutes.js";
import { createTeamRoutes } from "./teamRoutes.js";
import { createBreakingDigestRoutes } from "./breakingDigestRoutes.js";
import { OpenAIUsageService } from "../services/openaiUsageService.js";
import type { AuthService } from "../services/authService.js";
import type { PushService } from "../services/pushService.js";
import type { NewsService } from "../services/newsService.js";
import type { EditorialConversationService } from "../services/editorialConversationService.js";
import type { GenerateService } from "../services/generateService.js";
import type { TranslateService } from "../services/translateService.js";
import type { EditorialWorkflowService } from "../services/editorialWorkflowService.js";
import type { PresenceService } from "../services/presenceService.js";
import type { TeamService } from "../services/teamService.js";
import type { BreakingService } from "../services/breakingService.js";
import type { DigestService } from "../services/digestService.js";

type ApiServices = {
  authService: AuthService;
  pushService: PushService;
  newsService: NewsService;
  editorialService: EditorialConversationService;
  generateService: GenerateService;
  translateService: TranslateService;
  workflowService: EditorialWorkflowService;
  presenceService: PresenceService;
  teamService: TeamService;
  breakingService: BreakingService;
  digestService: DigestService;
};

export function createApiRoutes(services: ApiServices): FastifyPluginAsync {
  return async (app) => {
    app.addHook("onRequest", requireApiAuthUnlessPublic);
    await app.register(healthRoutes);
    await app.register(createAuthRoutes(services.authService));
    await app.register(createPushRoutes(services.pushService));
    await app.register(createNewsRoutes(services.newsService));
    await app.register(createBreakingDigestRoutes(services.breakingService, services.digestService));
    await app.register(createEditorialRoutes(services.editorialService, services.workflowService));
    await app.register(createPresenceRoutes(services.presenceService));
    await app.register(createTeamRoutes(services.teamService));
    await app.register(createGenerateRoutes(services.generateService));
    await app.register(createTranslateRoutes(services.translateService));
    await app.register(createOpenAIUsageRoutes(new OpenAIUsageService(), services.authService));
  };
}
