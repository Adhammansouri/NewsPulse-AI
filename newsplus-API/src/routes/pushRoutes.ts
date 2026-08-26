import type { FastifyPluginAsync } from "fastify";
import { validateBody } from "../middleware/validateBody.js";
import { createPushController } from "../controllers/pushController.js";
import { pushSubscribeBodySchema, pushUnsubscribeBodySchema } from "../schemas/push.schema.js";
import type { PushService } from "../services/pushService.js";

export function createPushRoutes(pushService: PushService): FastifyPluginAsync {
  const controller = createPushController(pushService);

  return async (app) => {
    app.get("/push/vapid-key", {
      handler: controller.vapidKey,
    });

    app.post("/push/subscribe", {
      preHandler: [validateBody(pushSubscribeBodySchema)],
      handler: controller.subscribe,
    });

    app.delete("/push/subscribe", {
      preHandler: [validateBody(pushUnsubscribeBodySchema)],
      handler: controller.unsubscribe,
    });

    app.post("/push/test", {
      handler: controller.test,
    });
  };
}
