import type { FastifyReply, FastifyRequest } from "fastify";
import { successResponse } from "../utils/apiResponse.js";
import type { AuthService } from "../services/authService.js";
import type { ForgotPasswordBody, LoginBody } from "../schemas/auth.schema.js";

export function createAuthController(authService: AuthService) {
  return {
    async login(request: FastifyRequest<{ Body: LoginBody }>, _reply: FastifyReply) {
      const { identifier, password } = request.body;
      const data = await authService.login(identifier, password);
      return successResponse(data);
    },

    async me(request: FastifyRequest, _reply: FastifyReply) {
      const user = await authService.getUserById(request.user.sub);
      return successResponse({ user });
    },

    async forgotPassword(request: FastifyRequest<{ Body: ForgotPasswordBody }>, _reply: FastifyReply) {
      await authService.requestPasswordReset(request.body.email);
      return successResponse({ accepted: true });
    },

    async logout(_request: FastifyRequest, _reply: FastifyReply) {
      return successResponse({ loggedOut: true });
    },
  };
}