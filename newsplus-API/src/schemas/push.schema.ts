import { z } from "zod";

export const pushSubscribeBodySchema = z.object({
  endpoint: z.string().trim().url().max(2048),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(256),
  }),
});

export const pushUnsubscribeBodySchema = z.object({
  endpoint: z.string().trim().url().max(2048),
});

export type PushSubscribeBody = z.infer<typeof pushSubscribeBodySchema>;
export type PushUnsubscribeBody = z.infer<typeof pushUnsubscribeBodySchema>;
