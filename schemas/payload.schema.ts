import { z } from "zod";
import { PaymentRequestSchema } from "./paymentRequest.schema";
import { SubscriptionSchema } from "./subscription.schema";

export const PayloadSchema = z.union([
    PaymentRequestSchema,
    z.object({
        subscription: SubscriptionSchema,
    }),
]);

export type Payload = z.infer<typeof PayloadSchema>;