import { z } from "zod";

export const SiteSchema = z.object({
    id: z.number().optional(),
    name: z.string().optional(),
    country: z.string().optional(),
})
    .refine(
        (obj) => obj.id || obj.name || obj.country,
        "You must provide one of: id, name, country"
    );

export type Site = z.infer<typeof SiteSchema>;