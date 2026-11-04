import { z } from "zod";

export const presenceHeartbeatBodySchema = z.object({
  itemId: z.string().trim().min(1).max(64).optional(),
  conversationId: z.string().uuid().optional(),
  activity: z.enum(["writing", "viewing"]),
});

export type PresenceHeartbeatBody = z.infer<typeof presenceHeartbeatBodySchema>;
