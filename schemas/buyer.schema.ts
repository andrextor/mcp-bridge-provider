import { z } from "zod";

export const BuyerSchema = z.object({
    name: z.string(),
    surname: z.string(),
    email: z.string(),
    document: z.string(),
    documentType: z.string(),
    mobile: z.number(),
});

export type Buyer = z.infer<typeof BuyerSchema>;