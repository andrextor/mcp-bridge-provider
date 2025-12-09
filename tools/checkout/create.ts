import { z } from "zod";
import { getIdentifier } from "../settings/state.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CheckoutCreateInput, CheckoutCreateSchema } from "../../schemas/checkout.schema.js";

export function registerCheckoutCreateTool(server: McpServer, bridgeUrl: string) {
    return server.registerTool(
        "checkout.create",
        {
            description: `Creates a checkout session using MCP Bridge API.`,
            inputSchema: CheckoutCreateSchema,
        },
        async (data: CheckoutCreateInput) => {
            const identifier = data.identifier || getIdentifier();
            if (!identifier) {
                throw new Error(
                    "MISSING_IDENTIFIER: No MCP identifier is configured. " +
                    "Ask the user for their MCP identifier string, call the tool `settings.setIdentifier` with that value, " +
                    "and then call `checkout.create` again."
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
                signature: "test-signature",
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