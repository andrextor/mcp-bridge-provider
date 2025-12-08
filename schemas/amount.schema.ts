import { z } from "zod";

export const AmountSchema = z.object({
    currency: z.string().describe("Currency code (e.g., USD, COP)"),
    total: z.number().positive().describe("Total amount"),
});

export type AmountRequest = z.infer<typeof AmountSchema>;