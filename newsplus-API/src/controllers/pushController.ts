import type { FastifyReply, FastifyRequest } from "fastify";
import { successResponse } from "../utils/apiResponse.js";
import type { PushService } from "../services/pushService.js";
import type { PushSubscribeBody, PushUnsubscribeBody } from "../schemas/push.schema.js";

export function createPushController(pushService: PushService) {
  return {
    vapidKey(_request: FastifyRequest, _reply: FastifyReply) {
      return successResponse(pushService.getVapidPublicKey());
    },

    async subscribe(request: FastifyRequest<{ Body: PushSubscribeBody }>, _reply: FastifyReply) {
      const data = await pushService.subscribe({
        userId: request.user.sub,
        endpoint: request.body.endpoint,
        expirationTime: request.body.expirationTime,
        keys: request.body.keys,
      });
      return successResponse(data);
    },

    async unsubscribe(request: FastifyRequest<{ Body: PushUnsubscribeBody }>, _reply: FastifyReply) {
      const data = await pushService.unsubscribe(request.user.sub, request.body.endpoint);
      return successResponse(data);
    },

    async test(request: FastifyRequest, _reply: FastifyReply) {
      const data = await pushService.sendTest(request.user.sub);
      return successResponse(data);
    },
  };
}
