import { z } from "zod";
import { getIdentifier } from "../settings/state.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CheckoutCreateSchema } from "../../schemas/checkout.schema.js";
import { PaymentRequestSchema } from "../../schemas/paymentRequest.schema.js";
import { SubscriptionRequestSchema } from "../../schemas/subscriptionRequest.schema copy.js";

export function registerCheckoutCreateTool(server: McpServer, bridgeUrl: string) {
    return server.registerTool(
        "checkout.create",
        {
            description: `Creates a checkout session using MCP Bridge API.`,
            inputSchema: {
                identifier: z.string().optional(),
                environment: z.enum(["TEST", "DEVELOP", "UAT", "LOCAL"]),
                site: z.object({
                    id: z.number().optional(),
                    name: z.string().optional(),
                    country: z.string().optional(),
                }),
                payload: z
                    .union([PaymentRequestSchema, SubscriptionRequestSchema])
                    .describe("Request payload"),
            },
        },
        async (args) => {
            // 1. Validar con tu schema oficial
            const validation = CheckoutCreateSchema.safeParse(args);
            if (!validation.success) {
                const msg = validation.error.errors
                    .map(e => `${e.path.join('.')}: ${e.message}`)
                    .join(", ");

                throw new Error(`Validation failed: ${msg}`);
            }

            const data = validation.data;

            // 2. Obtener identifier
            const identifier = data.identifier || getIdentifier();
            if (!identifier) {
                throw new Error(
                    "Identifier not set. Provide it or call settings.setIdentifier first."
                );
            }

            // 3. Construcción correcta del body de tu API MCP
            const timestamp = Math.floor(Date.now() / 1000);

            const requestBody = {
                identifier,
                timestamp,
                api: "CHECKOUT",
                action: "CREATE",
                site: data.site,
                environment: data.environment,
                payload: data.payload,
            };

            // 5. Llamada POST al bridge
            const response = await fetch(bridgeUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody),
            });

            // 6. Manejo de errores
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(
                    `MCP Bridge API Error (${response.status}): ${err.error || err.message || "Unknown"}`
                );
            }

            return await response.json();
        }
    );
}