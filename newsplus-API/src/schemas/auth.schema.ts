import { z } from "zod";

export const loginBodySchema = z.object({
  identifier: z.string().trim().min(2).max(80),
  password: z.string().trim().min(1).max(128),
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().trim().email().max(160),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;