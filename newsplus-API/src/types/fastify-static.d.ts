import "fastify";

declare module "fastify" {
  interface FastifyReply {
    sendFile(filePath: string): FastifyReply;
  }
}
