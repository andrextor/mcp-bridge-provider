import { z } from "zod";

export const PaymentSchema = z.object({
    reference: z.string(),
    description: z.string(),
    amount: z.object({
        currency: z.string(),
        total: z.number(),
    }),
    subscribe: z.boolean(),
});

export type Payment = z.infer<typeof PaymentSchema>;