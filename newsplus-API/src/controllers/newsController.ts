import type { FastifyReply, FastifyRequest } from "fastify";
import { successResponse } from "../utils/apiResponse.js";
import type { NewsService } from "../services/newsService.js";
import type { CarouselRenderBody, NewsFeedQuery, NewsSummarizeBody } from "../schemas/news.schema.js";

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

    async renderSlide(request: FastifyRequest<{ Body: CarouselRenderBody }>, _reply: FastifyReply) {
      const data = await newsService.renderSlide(request.body, request.user.sub);
      return successResponse(data);
    },

    async slideAsset(
      request: FastifyRequest<{ Params: { conversationId: string; assetId: string } }>,
      reply: FastifyReply,
    ) {
      const file = newsService.readSlide(request.params.conversationId, request.params.assetId);
      return reply.type("image/png").header("Cache-Control", "private, max-age=86400").send(file);
    },
  };
}
