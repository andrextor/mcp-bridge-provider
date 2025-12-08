import { z } from "zod";
import { AmountSchema } from "./amount.schema.js";

export const PaymentSchema = z.object({
    reference: z.string().describe("Payment reference ID"),
    description: z.string().describe("Payment description"),
    amount: AmountSchema,
    subscribe: z.boolean().describe("Whether this is a subscription payment"),
});

export type Payment = z.infer<typeof PaymentSchema>;