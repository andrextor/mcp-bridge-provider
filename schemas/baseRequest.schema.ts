import { z } from "zod";

export const BaseRequestSchema = z.object({
    locale: z.string(),
    ipAddress: z.string(),
    returnUrl: z.string(),
    userAgent: z.string(),
});

export type BaseRequest = z.infer<typeof BaseRequestSchema>;