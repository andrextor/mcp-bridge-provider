import { z } from "zod";
import { SiteSchema } from "./site.schema";
import { PayloadSchema } from "./payload.schema";

export const CheckoutCreateSchema = z.object({
    identifier: z.uuid(),
    environment: z.enum(["TEST", "DEVELOP", "UAT", "LOCAL"]),
    site: SiteSchema,
    payload: PayloadSchema,
});

export type CheckoutCreateInput = z.infer<typeof CheckoutCreateSchema>;