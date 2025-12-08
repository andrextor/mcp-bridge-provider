import { z } from "zod";

export const BaseRequestSchema = z.object({
    locale: z.string().describe("Locale (e.g., es_CO, en_US)"),
    ipAddress: z.string().describe("Client IP address"),
    returnUrl: z.string().url().describe("URL to return after payment"),
    userAgent: z.string().describe("Client user agent"),
});

export type BaseRequest = z.infer<typeof BaseRequestSchema>;