import { z } from "zod";

export const BuyerSchema = z.object({
    name: z.string().describe("Buyer's first name"),
    surname: z.string().describe("Buyer's last name"),
    email: z.string().email().describe("Buyer's email address"),
    document: z.string().describe("Buyer's document number"),
    documentType: z.string().describe("Document type (e.g., CC, NIT, CE)"),
    mobile: z.number().describe("Buyer's mobile number"),
});

export type Buyer = z.infer<typeof BuyerSchema>;