import { EDITORIAL_PUBLISH_PLATFORMS } from "@newsplus/shared";
import { z } from "zod";

/** S12 `POST /editorial/conversations/:id/check`. The body may be left out (no platform-length row then). */
export const publishCheckBodySchema = z
  .object({
    platform: z.enum(EDITORIAL_PUBLISH_PLATFORMS).optional(),
  })
  .optional();

export type PublishCheckBody = z.infer<typeof publishCheckBodySchema>;
