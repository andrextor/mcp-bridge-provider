import { z } from "zod";
import { BaseRequestSchema } from "./baseRequest.schema.js";
import { BuyerSchema } from "./buyer.schema.js";
import { PaymentSchema } from "./payment.schema.js";

export const PaymentRequestSchema = BaseRequestSchema.extend({
    buyer: BuyerSchema
        .nullable()
        .optional()
        .describe("Buyer information"),
    payment: PaymentSchema,
    paymentMethod: z
        .string()
        .nullable()
        .optional()
        .describe("Preferred payment method"),
    skipResult: z.boolean().optional(),
    noBuyerFill: z.boolean().optional(),
    notificationUrl: z.string().url().optional(),
    metadata: z.record(z.unknown()).optional(),
});

export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;