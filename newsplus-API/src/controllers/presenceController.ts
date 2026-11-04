import type { FastifyReply, FastifyRequest } from "fastify";
import { successResponse } from "../utils/apiResponse.js";
import type { PresenceHeartbeatBody } from "../schemas/presence.schema.js";
import type { PresenceService } from "../services/presenceService.js";

export function createPresenceController(service: PresenceService) {
  return {
    async heartbeat(request: FastifyRequest<{ Body: PresenceHeartbeatBody }>, _reply: FastifyReply) {
      return successResponse(await service.heartbeat(request.user.sub, request.body));
    },

    async list(_request: FastifyRequest, _reply: FastifyReply) {
      return successResponse(await service.list());
    },
  };
}
