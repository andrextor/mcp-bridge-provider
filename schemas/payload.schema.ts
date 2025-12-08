import { z } from "zod";
import { PaymentRequestSchema } from "./paymentRequest.schema.js";
import { SubscriptionSchema } from "./subscription.schema.js";

export const PayloadSchema = z.union([
    PaymentRequestSchema,
    z.object({
        subscription: SubscriptionSchema,
    }),
]);

export type Payload = z.infer<typeof PayloadSchema>;