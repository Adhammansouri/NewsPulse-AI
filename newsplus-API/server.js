import "dotenv/config";
import { startServer } from "./dist/server.js";

void startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
