import { z } from "zod";

export const SubscriptionSchema = z.object({
    reference: z.string().describe("Subscription reference ID"),
    description: z.string().describe("Subscription description"),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;