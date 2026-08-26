import type { FastifyReply, FastifyRequest } from "fastify";
import { successResponse } from "../utils/apiResponse.js";
import type { NewsService } from "../services/newsService.js";
import type { NewsFeedQuery, NewsSummarizeBody } from "../schemas/news.schema.js";

export function createNewsController(newsService: NewsService) {
  return {
    async sources(_request: FastifyRequest, _reply: FastifyReply) {
      return successResponse(newsService.listSources());
    },

    async feed(request: FastifyRequest<{ Querystring: NewsFeedQuery }>, _reply: FastifyReply) {
      const data = await newsService.getFeed(request.query.source, request.query.q);
      return successResponse(data);
    },

    async summarize(request: FastifyRequest<{ Body: NewsSummarizeBody }>, _reply: FastifyReply) {
      const data = await newsService.summarize(request.body, request.user.sub);
      return successResponse(data);
    },
  };
}
