import type { FastifyPluginAsync } from "fastify";
import { createPresenceController } from "../controllers/presenceController.js";
import { validateBody } from "../middleware/validateBody.js";
import { presenceHeartbeatBodySchema } from "../schemas/presence.schema.js";
import type { PresenceService } from "../services/presenceService.js";

/** S15 live presence. In-memory, single instance — see PresenceStore. */
export function createPresenceRoutes(service: PresenceService): FastifyPluginAsync {
  const controller = createPresenceController(service);

  return async (app) => {
    app.post("/presence/heartbeat", {
      preHandler: [validateBody(presenceHeartbeatBodySchema)],
      handler: controller.heartbeat,
    });

    app.get("/presence", {
      handler: controller.list,
    });
  };
}
