import { env } from "./config/index.js";
import { buildApp } from "./app.js";

function resolveListenOptions() {
  const passenger = Boolean(process.env.PASSENGER_APP_ENV || process.env.PHUSION_PASSENGER);
  const port = Number(process.env.PORT ?? env.port);

  if (passenger) {
    return { port, host: "127.0.0.1" as const };
  }

  return { port, host: env.host };
}

export async function startServer() {
  const app = await buildApp();
  const listen = resolveListenOptions();

  try {
    await app.listen(listen);
    app.log.info(listen, "Newsplus API listening");
  } catch (error) {
    app.log.error({ err: error, listen }, "Failed to start Newsplus API");
    process.exit(1);
  }
}
