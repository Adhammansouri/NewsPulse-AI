import { env } from "./config/index.js";
import { buildApp } from "./app.js";

export async function startServer() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.port, host: env.host });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}
