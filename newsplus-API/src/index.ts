import "dotenv/config";
import { startServer } from "./server.js";

void startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
