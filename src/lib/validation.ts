import { z } from 'zod';

export const ActivateSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-z0-9._-]+$/i),
  eventSlug: z.string().min(3).max(64)
});

export const CheckinSchema = z.object({
  token: z.string().min(10),
  eventSlug: z.string().min(3).max(64),
  adminSecret: z.string().min(10)
});
