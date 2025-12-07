import { getIdentifier } from "../state";
import { CheckoutCreateSchema } from "../../schemas/checkout.schema";
import type { McpServer as McpServerType } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerCheckoutCreateTool(
    server: McpServerType,
    MCP_BRIDGE_URL: string
) {
    server.registerTool(
        "checkout.create",
        {
            description: "Creates a checkout session through MCP Bridge API.",
            inputSchema: CheckoutCreateSchema,
        },
        async ({ environment, site, payload }) => {

            const identifier = getIdentifier();

            if (!identifier) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: "❌ Identifier not set. Run settings.setIdentifier first.",
                        },
                    ],
                };
            }

            const signedPayload = {
                identifier,
                timestamp: Math.floor(Date.now() / 1000),
                api: "checkout",
                action: "create",
                environment,
                site,
                data: payload,
                signature: "unsigned", // future: Ed25519
            };

            try {
                const response = await fetch(`${MCP_BRIDGE_URL}/api/mcp/execute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(signedPayload),
                });

                const json = await response.json();

                if (!response.ok) {
                    return {
                        isError: true,
                        content: [
                            {
                                type: "text",
                                text: `API error ${response.status}: ${JSON.stringify(json, null, 2)}`,
                            },
                        ],
                    };
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(json, null, 2),
                        },
                    ],
                };
            } catch (err: any) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: `Request failed: ${err?.message}`,
                        },
                    ],
                };
            }
        }
    );
}