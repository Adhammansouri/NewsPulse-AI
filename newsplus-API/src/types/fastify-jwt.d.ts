import type { TokenPayload } from "../services/tokenIssuer.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}