import { z } from "zod";
import { BaseRequestSchema } from "./baseRequest.schema.js";
import { BuyerSchema } from "./buyer.schema.js";
import { PaymentSchema } from "./payment.schema.js";

export const PaymentRequestSchema = BaseRequestSchema.extend({
    buyer: BuyerSchema.nullable(),
    payment: PaymentSchema,
    paymentMethod: z.string().nullable(),
});

export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;