import { z } from "zod";
import { SubscriptionSchema } from "./subscription.schema.js";

export const SubscriptionRequestSchema = z.object({
    subscription: SubscriptionSchema,
});

export type SubscriptionInput = z.infer<typeof SubscriptionRequestSchema>;