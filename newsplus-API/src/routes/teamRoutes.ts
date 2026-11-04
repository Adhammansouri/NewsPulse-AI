import type { FastifyPluginAsync } from "fastify";
import type { TeamData } from "@newsplus/shared";
import { successResponse } from "../utils/apiResponse.js";
import type { TeamService } from "../services/teamService.js";

/** S15 `GET /team`: every account with its deterministic avatar colour. */
export function createTeamRoutes(service: TeamService): FastifyPluginAsync {
  return async (app) => {
    app.get("/team", {
      handler: async () => {
        const data: TeamData = { users: await service.list() };
        return successResponse(data);
      },
    });
  };
}
