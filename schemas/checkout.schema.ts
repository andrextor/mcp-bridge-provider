import { z } from "zod";
import { SiteSchema } from "./site.schema.js";
import { PaymentRequestSchema } from "./paymentRequest.schema.js";
import { SubscriptionRequestSchema } from "./subscriptionRequest.schema copy.js";

export const CheckoutCreateSchema = z.object({
    identifier: z.string().describe("MCP identifier (optional if preloaded)"),
    timestamp: z.string(),
    api: z.enum(['checkout', 'gateway']),
    action: z.enum(['create', 'query', 'collect', 'reverse']),
    environment: z.enum(["TEST", "DEVELOP", "UAT", "LOCAL"]).describe("Target environment"),
    site: SiteSchema,
    payload: z.union([PaymentRequestSchema, SubscriptionRequestSchema]).describe("Request payload"),
});

export type CheckoutCreateInput = z.infer<typeof CheckoutCreateSchema>;