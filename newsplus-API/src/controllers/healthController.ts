import { env } from "../config/index.js";
import { successResponse } from "../utils/apiResponse.js";

export function getHealth() {
  return successResponse({
    status: "ok",
    app: "Newsplus",
    version: "0.1.0",
    phase: "foundation",
    openai: Boolean(env.openaiApiKey),
  });
}
