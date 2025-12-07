import { z } from "zod";

export const SubscriptionSchema = z.object({
    reference: z.string(),
    description: z.string(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;