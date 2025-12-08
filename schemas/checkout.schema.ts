import { z } from "zod";
import { SiteSchema } from "./site.schema.js";
import { PayloadSchema } from "./payload.schema.js";

export const CheckoutCreateSchema = z.object({
    identifier: z.string().uuid(),
    environment: z.enum(["TEST", "DEVELOP", "UAT", "LOCAL"]),
    site: SiteSchema,
    payload: PayloadSchema,
});

export type CheckoutCreateInput = z.infer<typeof CheckoutCreateSchema>;