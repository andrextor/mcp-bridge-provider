import { z } from "zod";
import { BaseRequestSchema } from "./baseRequest.schema";
import { BuyerSchema } from "./buyer.schema";
import { PaymentSchema } from "./payment.schema";

export const PaymentRequestSchema = BaseRequestSchema.extend({
    buyer: BuyerSchema.nullable(),
    payment: PaymentSchema,
    paymentMethod: z.string().nullable(),
});

export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;