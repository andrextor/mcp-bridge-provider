import { z } from "zod";
import { AmountSchema } from "./amount.schema.js";

export const PaymentSchema = z.object({
    reference: z.union([z.string(), z.number()]).describe("Payment reference ID"),
    description: z.string().describe("Payment description"),
    amount: AmountSchema,
    subscribe: z.boolean().describe("Whether this is a subscription payment"),
    allowPartial: z
        .boolean()
        .optional()
        .describe("Whether partial payments are allowed"),
});

export type Payment = z.infer<typeof PaymentSchema>;