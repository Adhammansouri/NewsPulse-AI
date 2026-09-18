import type { FastifyReply, FastifyRequest } from "fastify";
import { successResponse } from "../utils/apiResponse.js";
import type { EditorialConversationService } from "../services/editorialConversationService.js";
import type {
  EditorialConversationIdParams,
  EditorialConversationListQuery,
  EditorialMemoryListQuery,
  EditorialMemoryUpdateBody,
  EditorialRestoreBody,
  EditorialReviseBody,
} from "../schemas/editorial.schema.js";

export function createEditorialController(service: EditorialConversationService) {
  return {
    async list(
      request: FastifyRequest<{ Querystring: EditorialConversationListQuery }>,
      _reply: FastifyReply,
    ) {
      return successResponse(service.listConversations(request.query.q));
    },

    async get(
      request: FastifyRequest<{ Params: EditorialConversationIdParams }>,
      _reply: FastifyReply,
    ) {
      return successResponse(service.getConversation(request.params.id));
    },

    async revise(
      request: FastifyRequest<{ Params: EditorialConversationIdParams; Body: EditorialReviseBody }>,
      _reply: FastifyReply,
    ) {
      const data = await service.revise(request.params.id, request.body.instruction, request.user.sub);
      return successResponse(data);
    },

    async restore(
      request: FastifyRequest<{ Params: EditorialConversationIdParams; Body: EditorialRestoreBody }>,
      _reply: FastifyReply,
    ) {
      return successResponse(service.restore(request.params.id, request.body.versionId, request.user.sub));
    },

    async listMemory(
      request: FastifyRequest<{ Querystring: EditorialMemoryListQuery }>,
      _reply: FastifyReply,
    ) {
      return successResponse(service.listMemory(request.query.status));
    },

    async updateMemory(
      request: FastifyRequest<{ Params: EditorialConversationIdParams; Body: EditorialMemoryUpdateBody }>,
      _reply: FastifyReply,
    ) {
      return successResponse(service.updateMemory(request.params.id, request.body));
    },
  };
}
