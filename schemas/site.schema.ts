import { z } from "zod";

export const SiteSchema = z.object({
    id: z.number().optional().describe("Exact site ID"),
    name: z.string().optional().describe("Site name (partial or full)"),
    country: z.string().optional().describe("Site country code"),
}).refine(
    (data) => {
        // Solo uno de los campos debe estar presente
        const fields = [data.id, data.name, data.country].filter(f => f !== undefined);
        return fields.length === 1;
    },
    { message: "Exactly one of 'id', 'name', or 'country' must be provided" }
);

export type Site = z.infer<typeof SiteSchema>;